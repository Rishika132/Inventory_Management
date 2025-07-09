const { graphqlRequest } = require("./Shopify");

const fetchShopifyVariants = async () => {
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
                      inventoryQuantity
                      inventoryItem {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      console.log("🔄 Sending GraphQL query to Shopify...");
 const result = await graphqlRequest({ query });

      console.log("✅ Received Shopify response.");

      // ✅ Defensive check
      if (!result?.data?.products?.edges) {
        console.error("❌ No products found in result:", JSON.stringify(result, null, 2));
        break;
      }

      const productEdges = result.data.products.edges;

      for (const productEdge of productEdges) {
        const product = productEdge.node;
        for (const variantEdge of product.variants.edges) {
          const variant = variantEdge.node;
        
          const qty = variant.inventoryQuantity || 0;

          variants.push({
            sku: variant.sku,
            inventory_item_id: variant.inventoryItem?.id,
            quantity: qty,
            product_id: product.id,
            product_title: product.title,
            variant_title: variant.title,
          });
        }
      }

      hasNextPage = result.data.products.pageInfo.hasNextPage;
      endCursor = productEdges.length > 0 ? productEdges[productEdges.length - 1].cursor : null;
    }

    console.log(`🎯 Total variants fetched: ${variants.length}`);
    return variants;
  } catch (err) {
    console.error("❌ Shopify GraphQL fetch failed:", err?.message || err);
    return [];
  }
};

module.exports = { fetchShopifyVariants };
