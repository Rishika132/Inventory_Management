const shopify = require("./utils/Shopify");
const Inventory = require("./model/inventory.model");
let location_id = null;
async function getLocationId() {
  if (location_id) return location_id;
  const locations = await shopify.location.list();
  location_id = locations[0].id;
  return location_id;
}
async function getAllProducts() {
  let products = [];
  let params = { limit: 250 };
  do {
    const currentPage = await shopify.product.list(params);
    products = products.concat(currentPage);
    params = currentPage.nextPageParameters || null;
  } while (params);
  return products;
}
async function updateAllInventoriesSameQuantity(quantity) {
  try {
    const locationId = await getLocationId();
    const allProducts = await getAllProducts();

    for (const product of allProducts) {
      const variant = product.variants[0];
      const inventoryItemId = variant.inventory_item_id;

      if (!inventoryItemId) continue;
      await shopify.inventoryItem.update(inventoryItemId, {
        tracked: true,
      });

      await shopify.inventoryLevel.set({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity,
      });

      await Inventory.findOneAndUpdate(
        { inventory_item_id: inventoryItemId },
        { $set: { quantity } },
        { upsert: true, new: true }
      );

      console.log(` Updated: ${product.title}`);
    }

    return {
      success: true,
      message: ` All ${allProducts.length} product quantities updated to ${quantity}`,
    };
  } catch (error) {
    console.error(" Error updating inventory:", error.response?.body || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = updateAllInventoriesSameQuantity;
