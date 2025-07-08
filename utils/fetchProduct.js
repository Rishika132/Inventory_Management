require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const Shopify = require("shopify-api-node");

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const fetchShopifyProducts = async (limit = Infinity) => {
  const products = [];
  let hasNextPage = true;
  let endCursor = null;

  try {
   while (hasNextPage && products.length < limit) {
      const query = `
        {
          products(first: 100${endCursor ? `, after: "${endCursor}"` : ""}) {
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
              node {
                title
                variants(first: 100) {
                  edges {
                    node {
                      id
                       title
                      sku
                        inventoryItem {
                          id
                        }
                      inventoryQuantity
                    }
                  }
                }
              }
            }
          }
        }
      `;

      console.log("🔄 Sending GraphQL query to Shopify...");
      const result = await shopify.graphql(query);
      console.log("✅ Received Shopify response.");

      if (!result || !result.products) {
        console.error("❌ No products in response:", result);
        break;
      }

      const edges = result.products?.edges || [];
      console.log(`📦 Fetched batch of ${edges.length} products.`);

       for (const edge of edges) {
        if (products.length >= limit) break;
        products.push(edge.node);
      }

      hasNextPage = result.products.pageInfo.hasNextPage;
      endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    }

    console.log(`🎯 Total products fetched: ${products.length}`);
    return products;
  } catch (err) {
    console.error("❌ Shopify GraphQL fetch failed:", err);
    return [];
  }
};


if (require.main === module) {
  (async () => {
    const products = await fetchShopifyProducts();
    console.log("🧪 Final product count:", products.length);
  })();
}
module.exports = {
  shopify,
  fetchShopifyProducts
};