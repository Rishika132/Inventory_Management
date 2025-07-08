const { graphqlClient } = require("./Shopify");

async function fetchShopifyVariants() {
  const variants = [];
  let hasNextPage = true;
  let endCursor = null;

  try {
    while (hasNextPage) {
      const query = `
        {
          products(first: 100${endCursor ? `, after: "${endCursor}"` : ""}) {
            pageInfo { hasNextPage }
            edges {
              cursor
              node {
                id
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
      const result = await graphqlClient.request(query);
      console.log("✅ Received Shopify response.");

      const productEdges = result.data.products.edges || [];

      for (const productEdge of productEdges) {
        const product = productEdge.node;
        for (const variantEdge of product.variants.edges) {
          const varNode = variantEdge.node;
          const qty = varNode.inventoryItem?.inventoryQuantity?.quantity || 0;

          variants.push({
            sku: varNode.sku,
            inventory_item_id: varNode.inventoryItem?.id,
            quantity: qty,
            product_id: product.id,
            product_title: product.title,
            variant_title: varNode.title,
          });
        }
      }

      hasNextPage = result.data.products.pageInfo.hasNextPage;
      endCursor = productEdges.length
        ? productEdges[productEdges.length - 1].cursor
        : null;
    }

    console.log(`🎯 Total variants fetched: ${variants.length}`);
    return variants;
  } catch (err) {
    console.error("❌ Shopify GraphQL fetch failed:", err?.response?.errors || err.message);
    return [];
  }
}

module.exports = { fetchShopifyVariants };
