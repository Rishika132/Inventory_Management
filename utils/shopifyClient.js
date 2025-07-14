require("dotenv").config();

const { shopifyApi} = require('@shopify/shopify-api');

const shopify = new shopifyApi({
  shopName: process.env.SHOPIFY_STORES,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN_STORE,
});



module.exports = shopify.admin;
