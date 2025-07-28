const SyncStatus = require("../model/syncstatus.model");
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model"); 
const { sendThresholdEmails } = require("./nodemailer");

const { fetchShopifyVariants } = require("../utils/wholesaleproduct");
const { fetchRetailVariants } = require("../utils/retailproduct");

const { startSyncCron, stopSyncCron ,registerContinueSyncJob } = require("../cron");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== TRIGGER SYNC ==========
const triggerSync = async (req, res) => {
  try {
    await SyncStatus.findOneAndUpdate({}, {
      inprogress: true,
      retailCursor: null,
      wholesaleCursor: null
    }, { upsert: true });

    startSyncCron();

    return res.status(200).json({ message: "Sync started successfully" });
  } catch (err) {
    console.error("Sync trigger error:", err.message);
    return res.status(500).json({ error: "Failed to start sync" });
  }
};

// ========== CONTINUE SYNC ==========
let isRunning = false;

const continueSyncJob = async () => {
  if (isRunning) {
    console.log("⚠️ Previous sync job still running. Skipping this cycle.");
    return;
  }

  isRunning = true;

  try {
    const status = await SyncStatus.findOne();
    if (!status?.inprogress) {
      console.log("No sync in progress. Skipping this run.");
      return;
    }

    const { retailCursor, wholesaleCursor } = status;

    const wholesaleRes = await fetchShopifyVariants(wholesaleCursor);
    const retailRes = await fetchRetailVariants(retailCursor);

    await processVariants(wholesaleRes.variants, "wholesale");
    await processVariants(retailRes.variants, "retail");

    console.log("🧭 wholesaleCursor:", wholesaleRes.endCursor);
    console.log("🧭 retailCursor:", retailRes.endCursor);

    await SyncStatus.findOneAndUpdate({}, {
      wholesaleCursor: wholesaleRes.endCursor || null,
      retailCursor: retailRes.endCursor || null,
    });

    if (!wholesaleRes.endCursor && !retailRes.endCursor) {
      console.log("🎉 Sync complete for both wholesale and retail.");
      await syncFromWholesaleToSync();
      await sendThresholdEmails();
      await SyncStatus.findOneAndUpdate({}, { inprogress: false });
      stopSyncCron();
    }
  } catch (err) {
    console.error("❌ Sync job failed:", err.message);
  } finally {
    isRunning = false;
  }
};


// ========== PROCESS VARIANTS ==========
const batchProcess = async (data, batchSize, handler, delayMs = 0) => {
  const total = data.length;
  const batches = [];

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = i / batchSize + 1;
    console.log(`Processing batch ${batchNumber} of ${Math.ceil(total / batchSize)}`);

    const processed = await handler(batch);

    batches.push({
      batchNumber,
      processedCount: processed.length,
      data: processed,
    });

    if (i + batchSize < total && delayMs > 0) {
      await delay(delayMs);
    }
  }

  return batches;
};

const processVariants = async (variants, type) => {
  const skipped = [];

  const processBatch = async (batch) => {
    return await Promise.all(batch.map(async (variant) => {
      const sku = variant.sku?.trim();
      if (!sku) {
        await SkippedProduct.create({
          productId: variant.product_id,
          reason: "Missing SKU",
          json: variant,
        });
        skipped.push({ reason: "Missing SKU", productId: variant.product_id });
        return null;
      }

      try {
        const model = type === "wholesale" ? Wholesale : Retail;

        return await model.findOneAndUpdate(
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
            variant_image: variant.variant_image
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        await SkippedProduct.create({
          productId: variant.product_id,
          reason: err.message,
          json: variant,
        });
        skipped.push({ sku, reason: err.message });
        return null;
      }
    }));
  };

  await batchProcess(variants, 100, processBatch);
};

// ========== SYNC COLLECTION MERGE ==========
const syncFromWholesaleToSync = async () => {
  const [retailData, wholesaleData] = await Promise.all([
    Retail.find(),
    Wholesale.find()
  ]);

  const failed = [];
  const skuMap = new Map();

  for (const item of retailData) {
    skuMap.set(item.sku, {
      sku: item.sku,
      quantity: item.quantity,
      product_title: item.product_title,
      product_image: item.product_image,
      variant_title: item.variant_title,
      variant_image: item.variant_image,
      retail_price: item.variant_price  
    });
  }

  for (const item of wholesaleData) {
    if (skuMap.has(item.sku)) {
      skuMap.get(item.sku).wholesale_price = item.variant_price;
    } else {
      skuMap.set(item.sku, {
        sku: item.sku,
        quantity: item.quantity,
        product_title: item.product_title,
        product_image: item.product_image,
        variant_title: item.variant_title,
        variant_image: item.variant_image,
        wholesale_price: item.variant_price  
      });
    }
  }

  const mergedData = Array.from(skuMap.values());

  const processBatch = async (batch) => {
    return await Promise.all(batch.map(async (item) => {
      try {
        return await Sync.findOneAndUpdate(
          { sku: item.sku },
          item,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        failed.push({ sku: item.sku, error: err.message });
        return null;
      }
    }));
  };

  await batchProcess(mergedData, 100, processBatch);
};

// ========== VIEW PRODUCTS ==========
const fetchProducts = async (req, res) => {
  try {
    const result = await Sync.find();
    const products = result.map(item => ({
      product_title: item.product_title,
      variant_title: item.variant_title,
      sku: item.sku
    }));
    return res.status(200).json({ products });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  triggerSync,
  continueSyncJob,
  fetchProducts
};
registerContinueSyncJob(continueSyncJob); 