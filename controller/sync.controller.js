// sync.controller.js

const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model");

const { fetchShopifyVariants } = require("../utils/wholesaleproduct");
const { fetchRetailVariants } = require("../utils/retailproduct");

// 1. WHOLESALE SYNC FUNCTION
const syncWholesale = async () => {
  const variants = await fetchShopifyVariants();
  const inserted = [];
  const skipped = [];

  for (const variant of variants) {
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
    } catch (err) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: err.message,
        json: variant,
      });
      skipped.push({ sku, reason: err.message });
    }
  }

  return { inserted, skipped };
};

// 2. RETAIL SYNC FUNCTION
const syncRetail = async () => {
  const variants = await fetchRetailVariants();
  const inserted = [];
  const skipped = [];

  for (const variant of variants) {
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
    } catch (err) {
      await SkippedProduct.create({
        productId: variant.product_id,
        reason: err.message,
        json: variant,
      });
      skipped.push({ sku, reason: err.message });
    }
  }

  return { inserted, skipped };
};

// 3. SYNC FROM WHOLESALE TO SYNC COLLECTION
const syncFromWholesaleToSync = async () => {
  const retailData = await Retail.find();
  const inserted = [];
  const failed = [];

  for (const item of retailData) {
    try {
      // Check if SKU exists in Wholesale too
      const wholesaleItem = await Wholesale.findOne({ sku: item.sku });

      if (!wholesaleItem) {
        failed.push({ sku: item.sku, error: "SKU not found in Wholesale" });
        continue;
      }

      // Insert into Sync only if SKU exists in both
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

      inserted.push(saved);
    } catch (err) {
      failed.push({ sku: item.sku, error: err.message });
    }
  }

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
