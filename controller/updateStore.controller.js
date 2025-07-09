const { setShopifyInventory } = require("../utils/updateStore");

const location_id = process.env.SHOPIFY_LOCATION_ID;

const updateInventory = async (req, res) => {
    const { inventory_item_id, quantity}  = req.body;

    try{
        await setShopifyInventory(inventory_item_id, quantity, Number(location_id));
  return res.status(200).json({ message: " inventory update completed"});
    } catch (err) {
      console.error('Error updating :', err.message);

    }
  }


module.exports = { updateInventory };