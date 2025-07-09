
const axios = require("axios");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const Shopify = require("shopify-api-node");

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const setShopifyInventory = async (inventory_item_id, quantity, location_id) => {

inventory_item_id = inventory_item_id.replace("gid://shopify/InventoryItem/",'');
location_id = process.env.SHOPIFY_LOCATION_ID;

      // Enable tracking
      await shopify.inventoryItem.update(inventory_item_id, {
        tracked: true,
      });

      // Update quantity
      await shopify.inventoryLevel.set({
        location_id: location_id,
        inventory_item_id: inventory_item_id,
        available: quantity,
      });
};


module.exports = { setShopifyInventory, shopify };
