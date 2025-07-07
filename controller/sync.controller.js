const fetchShopifyProducts = require("../utils/Shopify");
const Product = require("../model/sync.model");
const SkippedProduct = require("../model/skipped.model"); 
const Sync = async (req, res) => {
  try {
    const products = await fetchShopifyProducts();
    let inserted = [];
    let skipped = [];

    for (const product of products) {
      const variant = product.variants?.edges?.[0]?.node;
      const sku = variant?.sku?.trim();

      console.log("➡️ Processing SKU:", sku);

      if (!sku) {
        console.warn("⏭️ Skipping product due to missing SKU:", product.id);

        // Save to SkippedProduct collection ⬇️
        await SkippedProduct.create({
          productId: product.id,
          reason: "Missing SKU",
          json: product,
        });

        skipped.push({ id: product.id, reason: "Missing SKU" });
        continue;
      }

      try {
        const savedProduct = await Product.findOneAndUpdate(
          { sku },
          {
            sku,
            json: product,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        inserted.push(savedProduct);
        console.log("✅ Saved product with SKU:", sku);
      } catch (err) {
        console.error(`❌ Failed to save product with SKU ${sku}:`, err.message);

        await SkippedProduct.create({
          productId: product.id,
          reason: err.message,
          json: product,
        });

        skipped.push({ sku, reason: err.message });
      }
    }

    return res.status(200).json({
      message: "✅ Sync complete",
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
