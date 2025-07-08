
const {  shopify } = require("../utils/Shopify");
const { fetchShopifyProducts } = require("../utils/fetchProduct");
const Variant = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model");

const Sync = async (req, res) => {
  try {
    const limitParam = req.params.limit;
    const limit = parseInt(limitParam) ;  
    
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ error: "Invalid limit parameter" });
    }
      const products = await fetchShopifyProducts(limit);
    let inserted = [];
    let skipped = [];

    for (const product of products) {
      const productVariants = product.variants?.edges || [];

      for (const variantEdge of productVariants) {
        const variant = variantEdge.node;
        const sku = variant?.sku?.trim();
        const inventoryQuantity = variant.inventoryQuantity;
        

        if (!sku) {
          await SkippedProduct.create({
            productId: product.id,
            reason: "Missing SKU",
            json: variant,
          });
          skipped.push({ reason: "Missing SKU", variantId: variant.id });
          continue;
        }

        try {
          const inventoryItemId = variant.inventoryItem?.id;

          let quantity = 0;

          // ✅ Fetch quantity using REST API
          if (inventoryItemId) {
            const levels = await shopify.inventoryLevel.list({
              inventory_item_ids: inventoryItemId,
            });
           
            quantity = inventoryQuantity;
          }

          const savedVariant = await Variant.findOneAndUpdate(
            { sku },
            {
              sku,
              quantity,
              threshold: 5,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          inserted.push(savedVariant);
        } catch (err) {
          await SkippedProduct.create({
            productId: product.id,
            reason: err.message,
            json: variant,
          });
          skipped.push({ sku, reason: err.message });
        }
      }
    }

    return res.status(200).json({
      message: "✅ Variant sync complete",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("❌ Shopify Sync Error:", err.message);
    return res.status(500).json({ error: "Failed to sync products from Shopify" });
  }
};

module.exports = { Sync };
