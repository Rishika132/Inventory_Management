// sync.controller.js

const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model");

const { fetchShopifyVariants } = require("../utils/wholesaleproduct");
const { fetchRetailVariants } = require("../utils/retailproduct");

//batch function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const batchProcess = async (data, batchSize, handler, delayMs = 1000) => {
  const total = data.length;
  const result = [];

  for (let i = 0; i < total; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(total / batchSize)}`);

    // ✅ Make sure handler is a function
    if (typeof handler !== 'function') {
      throw new Error("Handler must be a function");
    }

    const processed = await handler(batch);
    result.push(...processed);

    if (i + batchSize < total) {
      await delay(delayMs); // wait before next batch
    }
  }

  return result;
};


// 1. WHOLESALE SYNC FUNCTION
const syncWholesale = async () => {
  const variants = await fetchShopifyVariants();
  const inserted = [];
  const skipped = [];

  const processBatch = async (batch) => {
    const results = [];

    for (const variant of batch) {
      const sku = variant.sku?.trim();

      if (!sku) {
        await SkippedProduct.create({
          productId: variant.product_id,
          reason: "Missing SKU",
          json: variant,
        });
        skipped.push({ reason: "Missing SKU", productId: variant.product_id });
        continue;
      }

      try {
        const saved = await Wholesale.findOneAndUpdate(
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
        inserted.push(saved);
        results.push(saved);
      } catch (err) {
        await SkippedProduct.create({
          productId: variant.product_id,
          reason: err.message,
          json: variant,
        });
        skipped.push({ sku, reason: err.message });
      }
    }

    return results;
  };

  await batchProcess(variants, 500, processBatch, 1000);
  return { inserted, skipped };
};


// 2. RETAIL SYNC FUNCTION
const syncRetail = async () => {
  const variants = await fetchRetailVariants();
  const inserted = [];
  const skipped = [];

  const processBatch = async (batch) => {
    const results = [];

    for (const variant of batch) {
    const sku = variant.sku?.trim();

    if (!sku) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: "Missing SKU",
        json: variant,
      });
      skipped.push({ reason: "Missing SKU", productId: variant.product_id });
 continue;;
    }

    try {
      const saved = await Retail.findOneAndUpdate(
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
      inserted.push(saved);
      results.push(saved);
    } catch (err) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: err.message,
        json: variant,
      });
      skipped.push({ sku, reason: err.message });
    }
  }
 return results;
};
  await batchProcess(variants, 500, processBatch, 1000);
  return { inserted, skipped };
};

// 3. SYNC FROM WHOLESALE TO SYNC COLLECTION
const syncFromWholesaleToSync = async () => {
  const retailData = await Retail.find();
  const inserted = [];
  const failed = [];

  // ✅ Batch handler
  const processBatch = async (batch) => {
    const results = [];

    for (const item of batch) {
      try {
        const wholesaleItem = await Wholesale.findOne({ sku: item.sku });

        if (!wholesaleItem) {
          failed.push({ sku: item.sku, error: "SKU not found in Wholesale" });
          continue;
        }

        const saved = await Sync.findOneAndUpdate(
          { sku: item.sku },
          {
            sku: item.sku,
            quantity: item.quantity,
            product_title: item.product_title,
            variant_title: item.variant_title,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        results.push(saved);
      } catch (err) {
        failed.push({ sku: item.sku, error: err.message });
      }
    }

    return results;
  };

  // ✅ Use batchProcess
  const insertedResults = await batchProcess(retailData, 500, processBatch, 1000);
  inserted.push(...insertedResults);

  return { inserted, failed };
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
        insertedCount: wholesaleResult.inserted.length,
        skippedCount: wholesaleResult.skipped.length,
      },
      retail: {
        insertedCount: retailResult.inserted.length,
        skippedCount: retailResult.skipped.length,
      },
      sync: {
        insertedCount: syncResult.inserted.length,
        failedCount: syncResult.failed.length,
        data: syncResult.inserted,
        failed: syncResult.failed,
      },
    });
  } catch (err) {
    console.error("❌ Full sync error:", err.message);
    return res.status(500).json({ error: "Full sync failed" });
  }
};

module.exports = {
  runFullSync, // main API
  syncWholesale,
  syncRetail,
  syncFromWholesaleToSync,
};
