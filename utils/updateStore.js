
require("dotenv").config();
const Shopify = require("shopify-api-node");

if (!process.env.SHOPIFY_STORES || !process.env.SHOPIFY_ACCESS_TOKEN_STORE || !process.env.SHOPIFY_STORE_LOCATION_ID) {
  throw new Error("Missing required Shopify environment variables");
}

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORES,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN_STORE,
});

const setShopifyInventory = async (inventory_item_id, quantity) => {
  try {
  
    const cleanedInventoryItemId = inventory_item_id.replace("gid://shopify/InventoryItem/", "");
    const location_id = process.env.SHOPIFY_STORE_LOCATION_ID;
   
    
    if (!cleanedInventoryItemId || !location_id) {
      console.warn("Missing inventory_item_id or location_id");
      return;
    }

    await shopify.inventoryItem.update(cleanedInventoryItemId, {
      tracked: true,
    });


    await shopify.inventoryLevel.set({
      location_id,
      inventory_item_id: cleanedInventoryItemId,
      available: quantity,
    });

    console.log(`✅ Inventory updated: Item ID ${cleanedInventoryItemId}, Qty: ${quantity}`);
  } catch (error) {
    console.error(`❌ Shopify inventory update failed: ${error.message}`);
    throw error;
  }
};

module.exports = { setShopifyInventory, shopify };
