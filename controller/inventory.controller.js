const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const { setShopifyInventory } = require("../utils/update");
const {setRetailShopifyInventory} = require("../utils/updateStore");

const location_id = process.env.SHOPIFY_LOCATION_ID;

const updateBulkInventory = async (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Request body must be a non-empty array." });
  }

  const results = [];

  for (const item of updates) {
    const { sku, quantity, threshold } = item;

    if (!sku || quantity === undefined || threshold === undefined) {
      results.push({ sku, success: false, error: "Missing SKU, quantity, or threshold" });
      continue;
    }

    try {
      const wholesaleDoc = await Wholesale.findOne({ sku });

      if (!wholesaleDoc) {
        results.push({ sku, success: false, error: "SKU not found in wholesale" });
        continue;
      }

            const retailDoc = await Retail.findOne({ sku });

      if (!retailDoc) {
        results.push({ sku, success: false, error: "SKU not found in retail" });
        continue;
      }
        
      const inventory_item_id = wholesaleDoc.inventory_item_id;
      const inventoryId= retailDoc.inventory_item_id;

      // Shopify update
      await setShopifyInventory(inventory_item_id, quantity, Number(location_id));

      await setRetailShopifyInventory(inventoryId, quantity, Number(location_id));

      // Update wholesale
      await Wholesale.updateOne({ sku }, { quantity, threshold });

      // Update retail
      await Retail.updateOne({ sku }, { quantity, threshold });

      // Update sync
      await Sync.findOneAndUpdate(
        { sku },
        {
          sku,
          quantity,
          threshold,
          product_title: wholesaleDoc.product_title,
          variant_title: wholesaleDoc.variant_title
        },
        { upsert: true }
      );

       await setShopifyInventory(inventory_item_id, quantity);

     

      results.push({ sku, success: true });

    } catch (err) {
      console.error(`Error updating ${sku}:`, err.message);
      results.push({ sku, success: false, error: err.message });
    }
  }

  return res.status(200).json({ message: "Bulk inventory update completed", results });
};

module.exports = { updateBulkInventory };
