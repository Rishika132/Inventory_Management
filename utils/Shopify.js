// require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// const Shopify = require("shopify-api-node");

// const shopify = new Shopify({
//   shopName: process.env.SHOPIFY_STORE,
//   accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
// });
// module.exports = {shopify};

require("dotenv").config();
const fetch = require("cross-fetch");

const GRAPHQL_ENDPOINT = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-04/graphql.json`;

const graphqlRequest = async (query) => {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const result = await res.json();

  if (result.errors) {
    console.error("❌ Shopify GraphQL API returned errors:", result.errors);
  }

  if (!result.data) {
    console.error("❌ No 'data' field in Shopify GraphQL response:", result);
  }

  return result;
};

module.exports = { graphqlRequest };
