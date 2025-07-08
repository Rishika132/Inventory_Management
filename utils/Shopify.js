require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const Shopify = require("shopify-api-node");

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});
module.exports = {shopify};
