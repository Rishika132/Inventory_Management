require("dotenv").config();

const Shopify = require("shopify-api-node");

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORES,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN_STORE,
});



module.exports = { shopify };