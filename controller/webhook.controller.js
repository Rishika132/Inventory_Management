
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const { setRetailShopifyInventory } = require("../utils/updateStore");
const Webhook = async (req, res) => {
  
  try {
    const order = req.body;
    console.log(JSON.stringify(order));
    for (const item of order.line_items || []) {
      const sku = item.sku?.trim();
      const qtyOrdered = item.quantity;

      if (!sku || !qtyOrdered) continue;

      // 🔽 Update quantity in Retail MongoDB
      await Wholesale.findOneAndUpdate({ sku },{ $inc: { quantity: -qtyOrdered } } );

      // 🔽 Fetch wholesale product
      const retailProduct = await Retail.findOne({sku:sku});
      console.log( retailProduct);
      const inventoryId = retailProduct.inventory_item_id;
      const currentQty = retailProduct.quantity || 0;
      const newQty = currentQty - qtyOrdered;
     

      if (!inventoryId) {
        console.warn(`⚠️ Inventory ID missing for SKU ${sku}`);
        continue;
      }

      // ✅ Update Shopify inventory
      await setRetailShopifyInventory(inventoryId, newQty);

      // 🔽 Update wholesale DB
      await Retail.updateOne({ sku }, { quantity: newQty });

      console.log(`✅ SKU ${sku} updated. New Qty: ${newQty}`);
    }

    return res.status(200).json({ message: "✅ Order sync complete" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

module.exports = { Webhook };