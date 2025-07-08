const Wholesale = require("../model/wholesale.model");
const SkippedProduct = require("../model/skipped.model");
const { fetchShopifyVariants } = require("../utils/wholesaleproduct");

const wholesaleSync = async (req, res) => {
  try {
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
        skipped.push({
          reason: "Missing SKU",
          productId: variant.product_id,
        });
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
        console.error(`⚠️ Failed to upsert SKU: ${sku}`, err.message);
        await SkippedProduct.create({
          productId: variant.product_id,
          reason: err.message,
          json: variant,
        });
        skipped.push({ sku, reason: err.message });
      }
    }

    return res.status(200).json({
      message: "✅ Wholesale sync complete",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("❌ Wholesale Sync Error:", err.message);
    return res.status(500).json({ error: "Failed to sync wholesale variants" });
  }
};

module.exports = { wholesaleSync };
