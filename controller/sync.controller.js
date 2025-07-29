const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model");
const { sendThresholdEmails } = require("./nodemailer");
const { fetchShopifyVariants } = require("../utils/wholesaleproduct");
const { fetchRetailVariants } = require("../utils/retailproduct");
const syncStatus = require('../model/syncstatus.model');


// WHOLESALE SYNC
const syncWholesale = async () => {
  const {variants} = await fetchShopifyVariants();

  const skipped = [];
  const processed = [];
  if(variants.all) {
    console.log(variants)
    let wholeData= Wholesale.find();
    processed.push(...wholeData) ;
    let skippedData=SkippedProduct.find();
    skipped.push(...skippedData) ;
    return { processed, skipped };
  }

for (const variant of variants) {
  const sku = variant.sku?.trim();

  if (!sku) {
    const alreadySkipped = await SkippedProduct.findOne({
      productId: variant.product_id,
      reason: "Missing SKU"
    });

    if (!alreadySkipped) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: "Missing SKU",
        json: variant,
      });
    }

    skipped.push({ reason: "Missing SKU", productId: variant.product_id });
    continue;
}


    try {
      const result = await Wholesale.findOneAndUpdate(
        { sku },
        {
          inventory_item_id: variant.inventory_item_id,
          quantity: variant.quantity,
          sku,
          product_id: variant.product_id,
          product_title: variant.product_title,
          product_image: variant.product_image,
          variant_title: variant.variant_title,
          variant_price: variant.variant_price,
          variant_image: variant.variant_image,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      processed.push(result);
    } catch (err) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: err.message,
        json: variant,
      });
      skipped.push({ sku, reason: err.message });
    }
  }

  return { processed, skipped };
};

// RETAIL SYNC
const syncRetail = async () => {
  const {variants} = await fetchRetailVariants();
  const skipped = [];
  const processed = [];
 if(variants.all) {
    let retailData= Wholesale.find();
    processed.push(...retailData) ;
    let skipData=SkippedProduct.find();
    skipped.push(...skipData) ;
    return { processed, skipped };
  }
for (const variant of variants) {
  const sku = variant.sku?.trim();

  if (!sku) {
    const alreadySkipped = await SkippedProduct.findOne({
      productId: variant.product_id,
      reason: "Missing SKU"
    });

    if (!alreadySkipped) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: "Missing SKU",
        json: variant,
      });
    }

    skipped.push({ reason: "Missing SKU", productId: variant.product_id });
    continue;
}


    try {
      const result = await Retail.findOneAndUpdate(
        { sku },
        {
          inventory_item_id: variant.inventory_item_id,
          quantity: variant.quantity,
          sku,
          product_id: variant.product_id,
          product_title: variant.product_title,
          product_image: variant.product_image,
          variant_title: variant.variant_title,
          variant_price: variant.variant_price,
          variant_image: variant.variant_image,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      processed.push(result);
    } catch (err) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: err.message,
        json: variant,
      });
      skipped.push({ sku, reason: err.message });
    }
  }

  return { processed, skipped};
};

// SYNC WHOLESALE ➡ SYNC COLLECTION
const syncFromWholesaleToSync = async () => {
  const [retailData, wholesaleData] = await Promise.all([
    Retail.find(),
    Wholesale.find(),
  ]);
  const failed = [];
  const processed = [];

  const skuMap = new Map();

  for (const item of retailData) {
    skuMap.set(item.sku, {
      sku: item.sku,
      quantity: item.quantity,
      product_title: item.product_title,
      product_image: item.product_image,
      variant_title: item.variant_title,
      variant_price: item.variant_price,
      variant_image: item.variant_image,
    });
  }

  for (const item of wholesaleData) {
    if (!skuMap.has(item.sku)) {
      skuMap.set(item.sku, {
        sku: item.sku,
        quantity: item.quantity,
        product_title: item.product_title,
        product_image: item.product_image,
        variant_title: item.variant_title,
        variant_price: item.variant_price,
        variant_image: item.variant_image,
      });
    }
  }

  const mergedData = Array.from(skuMap.values());

  for (const item of mergedData) {
    try {
      const result = await Sync.findOneAndUpdate(
        { sku: item.sku },
        item,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      processed.push(result);
    } catch (err) {
      failed.push({ sku: item.sku, error: err.message });
    }
  }

  return { processed, failed };
};

async function runFullSyncFunction() {
  try {
let {inprogress} = await syncStatus.findOne({},'')
   if (inprogress) {
  console.log("Skipping sync because inprogress is true");
  return { success: false, message: "Sync not in progress" };
}
await syncStatus.findOneAndUpdate({}, { inprogress: true });
    const wholesaleResult = await syncWholesale();
    console.log(wholesaleResult);
    const retailResult = await syncRetail();
    const syncResult = await syncFromWholesaleToSync();

    await sendThresholdEmails();
    await syncStatus.findOneAndUpdate({}, { inprogress: false });
    return ({
      success:true,
      message: "✅ Full sync completed successfully",
      wholesale: {
        processedCount: wholesaleResult.processed.length,
        skippedCount: wholesaleResult.skipped.length,
        data: wholesaleResult.processed,
      },
      retail: {
        processedCount: retailResult.processed.length,
        skippedCount: retailResult.skipped.length,
        data: retailResult.processed,
      },
      sync: {
        processedCount: syncResult.processed.length,
        failedCount: syncResult.failed.length,
        data: syncResult.processed.map(p => ({
          sku: p.sku,
          product_title: p.product_title,
          variant_title: p.variant_title,
          quantity: p.quantity,
        })),
        failed: syncResult.failed,
      },
    });
  } catch (err) {
    console.error("❌ Full sync error:", err.message);
    return {
      success:false
    }
  }
}

// MAIN SYNC CONTROLLER
const runFullSync = async (req, res) => {
  await syncStatus.findOneAndUpdate({}, {
      retailCursor: null,
      wholesaleCursor: null,
      syncing:true,
      wholesale_product:false,
      retail_product:false
    }, { upsert: true });

  
  let data = await runFullSyncFunction();
  if(data.success){
    return res.status(200).json(data);
  }else{
    res.status(500).json({ error: "Full sync failed" });
  }
};

module.exports = {
  runFullSync,
  syncWholesale,
  syncRetail,
  runFullSyncFunction,
  syncFromWholesaleToSync,
};