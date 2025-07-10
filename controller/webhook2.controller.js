
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const { setShopifyInventory } = require("../utils/update");
const Webhook2 = async (req, res) => {
  
  try {
    const order = req.body;
    console.log(JSON.stringify(order.refunds));
    console.log(order.refunds.sku);
    console.log(order.refunds.quantity);
    for (const item of order.line_items || []) {
      const sku = item.sku?.trim();
      const qtyOrdered = item.quantity;

      if (!sku || !qtyOrdered) continue;

      // 🔽 Update quantity in Retail MongoDB
      await Retail.findOneAndUpdate({ sku },{ $inc: { quantity: -qtyOrdered } } );

      // 🔽 Fetch wholesale product
      const wholesaleProduct = await Wholesale.findOne({sku:sku});
      console.log( wholesaleProduct);
      const inventoryId = wholesaleProduct.inventory_item_id;
      const currentQty = wholesaleProduct.quantity || 0;
      const newQty = currentQty - qtyOrdered;
     

      if (!inventoryId) {
        console.warn(`⚠️ Inventory ID missing for SKU ${sku}`);
        continue;
      }

      // ✅ Update Shopify inventory
      await setShopifyInventory(inventoryId, newQty);

      // 🔽 Update wholesale DB
      await Wholesale.updateOne({ sku }, { quantity: newQty });

      console.log(`✅ SKU ${sku} updated. New Qty: ${newQty}`);
    }

    return res.status(200).json({ message: "✅ Order sync complete" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

module.exports = { Webhook2 };