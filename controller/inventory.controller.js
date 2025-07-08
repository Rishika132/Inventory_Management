const { updateShopifyInventoryGraphQL } = require("../utils/update");
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");

const updateInventoryController = async (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: "Request must be an array of objects" });
  }

  let updatedItems = [];
  let errors = [];

  for (const item of updates) {
    const { sku, quantity, threshold } = item;

    if (!sku || quantity == null || threshold == null) {
      errors.push({ sku, error: "Missing required fields" });
      continue;
    }

    try {
      // 1. Find inventory item ID from Wholesale
      const wholesaleItem = await Wholesale.findOne({ sku });

      if (!wholesaleItem || !wholesaleItem.inventory_item_id) {
        errors.push({ sku, error: "Wholesale item not found or missing inventory_item_id" });
        continue;
      }

      const inventoryItemId = wholesaleItem.inventory_item_id;

      // 2. Update Shopify inventory via GraphQL
      await updateShopifyInventoryGraphQL(inventoryItemId, quantity, threshold);

      // 3. Update Wholesale
      await Wholesale.findOneAndUpdate({ sku }, { quantity, threshold });

      // 4. Update Retail
      await Retail.findOneAndUpdate({ sku }, { quantity, threshold });

      // 5. Update Sync collection
      await Sync.findOneAndUpdate(
        { sku },
        {
          quantity,
          threshold,
          product_title: wholesaleItem.product_title || "N/A",
          variant_title: wholesaleItem.variant_title || "N/A",
        },
        { upsert: true }
      );

      updatedItems.push({ sku, inventory_item_id: inventoryItemId });
    } catch (err) {
      console.error(`❌ Error processing SKU: ${sku}`, err.message);
      errors.push({ sku, error: err.message });
    }
  }

  return res.json({
    success: true,
    updated: updatedItems,
    errors,
  });
};

module.exports = { updateInventoryController };
