const { graphqlRequest } = require("./Shopify");
const syncStatus = require('../model/syncstatus.model')
const fetchShopifyVariants = async () => {
  const variants = [];
  let {wholesale_cursor,wholesale_product} = await syncStatus.findOne({},'');
  let endCursor = wholesale_cursor;
  if(wholesale_product) {
    return {variants:{
      all:true
    }}
  }
  try {
    const query = `
  {
    products(first: 250${endCursor ? `, after: "${endCursor}"` : ""}) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          title
              images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryQuantity
                inventoryItem {
                  id
                }
                image {
                  originalSrc
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

      console.log(" Sending GraphQL query to Shopify...");
 const result = await graphqlRequest({ query });

      console.log(" Received Shopify response.");

      // if (!result?.data?.products?.edges) {
      //   console.error(" No products found in result:", JSON.stringify(result, null, 2));
      //   break;
      // }

      const productEdges = result.data.products.edges;
console.log(productEdges[0].node.id,"wholesale_product")
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
            product_image: product.images?.edges?.[0]?.node?.url,
            variant_title: variant.title,
            variant_price: variant.price,
            variant_image: variant.image?.originalSrc,
          });
        }
      }
      let product_done=false;
      let hasNextPage = result.data.products.pageInfo.hasNextPage;
      endCursor = result.data.products.pageInfo.endCursor;
      if(!hasNextPage) product_done=true;
   await syncStatus.findOneAndUpdate({},{ $set: { wholesale_cursor: endCursor,wholesale_product:product_done } },{ new: true });


    console.log(` Total variants fetched: ${variants.length}`);
    return {variants};
  } catch (err) {
    console.error(" Shopify GraphQL fetch failed:", err?.message || err);
    return [];
  }
};

module.exports = { fetchShopifyVariants };
