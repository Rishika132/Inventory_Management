const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model");

const { fetchShopifyVariants } = require("../utils/wholesaleproduct");
const { fetchRetailVariants } = require("../utils/retailproduct");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// WHOLESALE SYNC
const syncWholesale = async () => {
  const variants = await fetchShopifyVariants();
  const skipped = [];

  const processBatch = async (batch) => {
    const results = await Promise.all(batch.map(async (variant) => {
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
        return await Wholesale.findOneAndUpdate(
          { sku },
          {
            inventory_item_id: variant.inventory_item_id,
            quantity: variant.quantity,
            sku,
            product_id: variant.product_id,
            product_title: variant.product_title,
            variant_title: variant.variant_title,
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

    return results.filter(Boolean);
  };

  const batches = await batchProcess(variants, 1000, processBatch, 0);
  return { batches, skipped };
};

// RETAIL SYNC
const syncRetail = async () => {
  const variants = await fetchRetailVariants();
  const skipped = [];

  const processBatch = async (batch) => {
    const results = await Promise.all(batch.map(async (variant) => {
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
        return await Retail.findOneAndUpdate(
          { sku },
          {
            inventory_item_id: variant.inventory_item_id,
            quantity: variant.quantity,
            sku,
            product_id: variant.product_id,
            product_title: variant.product_title,
            variant_title: variant.variant_title,
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

    return results.filter(Boolean);
  };

  const batches = await batchProcess(variants, 1000, processBatch, 0);
  return { batches, skipped };
};

// SYNC WHOLESALE ➡ SYNC COLLECTION
const syncFromWholesaleToSync = async () => {
  const retailData = await Retail.find();
  const failed = [];

  const processBatch = async (batch) => {
    const results = await Promise.all(batch.map(async (item) => {
      try {
        const wholesaleItem = await Wholesale.findOne({ sku: item.sku });
        if (!wholesaleItem) {
          failed.push({ sku: item.sku, error: "SKU not found in Wholesale" });
          return null;
        }

        return await Sync.findOneAndUpdate(
          { sku: item.sku },
          {
            sku: item.sku,
            quantity: item.quantity,
            product_title: item.product_title,
            variant_title: item.variant_title,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        failed.push({ sku: item.sku, error: err.message });
        return null;
      }
    }));

    return results.filter(Boolean);
  };

  const batches = await batchProcess(retailData, 1000, processBatch, 0);
  return { batches, failed };
};

// MAIN SYNC CONTROLLER
const runFullSync = async (req, res) => {
  try {
    const wholesaleResult = await syncWholesale();
    const retailResult = await syncRetail();
    const syncResult = await syncFromWholesaleToSync();

    return res.status(200).json({
      message: "✅ Full sync completed successfully",
      wholesale: {
        totalBatches: wholesaleResult.batches.length,
        batches: wholesaleResult.batches.map(b => ({
          batchNumber: b.batchNumber,
          processedCount: b.processedCount,
        })),
        skippedCount: wholesaleResult.skipped.length,
      },
      retail: {
        totalBatches: retailResult.batches.length,
        batches: retailResult.batches.map(b => ({
          batchNumber: b.batchNumber,
          processedCount: b.processedCount,
        })),
        skippedCount: retailResult.skipped.length,
      },
   sync: {
  totalBatches: syncResult.batches.length,
  batches: syncResult.batches.map(b => ({
    batchNumber: b.batchNumber,
    processedCount: b.processedCount,
    uploaded: b.data.map(p => ({
      sku: p.sku,
      product_title: p.product_title,
      variant_title: p.variant_title,
      quantity: p.quantity,
    }))
  })),
  failedCount: syncResult.failed.length,
  failed: syncResult.failed,
},

    });
  } catch (err) {
    console.error("❌ Full sync error:", err.message);
    return res.status(500).json({ error: "Full sync failed" });
  }
};

module.exports = {
  runFullSync,
  syncWholesale,
  syncRetail,
  syncFromWholesaleToSync,
};
