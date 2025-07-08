const { graphqlRequest } = require("./Shopify");

async function updateShopifyInventoryGraphQL(inventoryItemId, available, threshold) {
  // ✅ Mutation 1: Adjust Quantity
  const adjustQtyMutation = `
    mutation InventoryUpdate($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryLevels {
          id
          available
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const adjustQtyVars = {
    input: {
      reason: "correction",
      name: "Manual Correction",
      changes: [
        {
          inventoryItemId: `gid://shopify/InventoryItem/${inventoryItemId}`,
          availableDelta: available,
        },
      ],
    },
  };

  const response1 = await graphqlRequest({
    query: adjustQtyMutation,
    variables: adjustQtyVars,
  });

  const errors1 = response1.data?.inventoryAdjustQuantities?.userErrors || [];
  if (errors1.length > 0) {
    throw new Error(errors1[0].message);
  }

  // ✅ Mutation 2: Ensure tracking is enabled
  const thresholdMutation = `
    mutation inventoryItemUpdate($input: InventoryItemUpdateInput!) {
      inventoryItemUpdate(input: $input) {
        inventoryItem {
          id
          tracked
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const thresholdVars = {
    input: {
      id: `gid://shopify/InventoryItem/${inventoryItemId}`,
      tracked: true,
    },
  };

  const response2 = await graphqlRequest({
    query: thresholdMutation,
    variables: thresholdVars,
  });

  const errors2 = response2.data?.inventoryItemUpdate?.userErrors || [];
  if (errors2.length > 0) {
    throw new Error(errors2[0].message);
  }

  return true;
}

module.exports = {
  updateShopifyInventoryGraphQL,
};
