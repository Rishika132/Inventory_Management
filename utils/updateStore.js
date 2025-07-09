
require("dotenv").config();

const Shopify = require("shopify-api-node");

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORES,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN_STORE,
});

const setShopifyInventory = async (inventory_item_id, quantity, location_id) => {

inventory_item_id = inventory_item_id.replace("gid://shopify/InventoryItem/",'');
location_id = process.env.SHOPIFY_STORE_LOCATION_ID;

    
      await shopify.inventoryItem.update(inventory_item_id, {
        tracked: true,
      });

      
      await shopify.inventoryLevel.adjust({
        location_id: location_id,
        inventory_item_id: inventory_item_id,
        available: quantity,
      });
};


module.exports = { setShopifyInventory, shopify };

// require("dotenv").config();
// const Shopify = require("shopify-api-node");

// // Validate env variables early
// if (!process.env.SHOPIFY_STORES || !process.env.SHOPIFY_ACCESS_TOKEN_STORE || !process.env.SHOPIFY_STORE_LOCATION_ID) {
//   throw new Error("Missing required Shopify environment variables");
// }

// const shopify = new Shopify({
//   shopName: process.env.SHOPIFY_STORES,
//   accessToken: process.env.SHOPIFY_ACCESS_TOKEN_STORE,
// });

// const setShopifyInventory = async (inventory_item_id, quantity) => {
//   try {
//     // Remove Shopify global ID prefix if present
//     const cleanedInventoryItemId = inventory_item_id.replace("gid://shopify/InventoryItem/", "");
//     const location_id = process.env.SHOPIFY_STORE_LOCATION_ID;

//     // Make sure required fields exist
//     if (!cleanedInventoryItemId || !location_id) {
//       console.warn("Missing inventory_item_id or location_id");
//       return;
//     }

//     // Ensure inventory is tracked
//     await shopify.inventoryItem.update(cleanedInventoryItemId, {
//       tracked: true,
//     });

//     // Adjust inventory level
//     await shopify.inventoryLevel.set({
//       location_id,
//       inventory_item_id: cleanedInventoryItemId,
//       available: quantity,
//     });

//     console.log(`✅ Inventory updated: Item ID ${cleanedInventoryItemId}, Qty: ${quantity}`);
//   } catch (error) {
//     console.error(`❌ Shopify inventory update failed: ${error.message}`);
//     throw error;
//   }
// };

// module.exports = { setShopifyInventory, shopify };
