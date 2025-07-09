require("dotenv").config();
const fetch = require("cross-fetch");

const GRAPHQL_ENDPOINT = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-04/graphql.json`;

const graphqlRequest = async (payload) => {
  if (!payload || !payload.query) {
    console.error("❌ GraphQL payload is missing 'query' field.");
    return { errors: { query: "Required parameter missing or invalid" } };
  }

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
    },
    body: JSON.stringify(payload),
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
