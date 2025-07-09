
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

      
      await shopify.inventoryLevel.set({
        location_id: location_id,
        inventory_item_id: inventory_item_id,
        available: quantity,
      });
};


module.exports = { setShopifyInventory, shopify };
