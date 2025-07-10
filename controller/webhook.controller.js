
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const { setRetailShopifyInventory } = require("../utils/updateStore");
const Webhook = async (req, res) => {
  
  try {
      const order = req.body;
    console.log("🔔 financial_status:", order.financial_status);

    const isRefund = order.refunds && order.refunds.length > 0;

    const items = isRefund
      ? order.refunds.flatMap(refund =>
          refund.refund_line_items.map(refundItem => ({
            sku: refundItem.line_item?.sku?.trim(),
            quantity: refundItem.quantity
          }))
        )
      : order.line_items.map(item => ({
          sku: item.sku?.trim(),
          quantity: item.quantity
        }));

    for (const { sku, quantity } of items) {
      if (!sku || !quantity) continue;

        const retailProduct = await Retail.findOne({ sku });
            if (!retailProduct) {
              console.warn(`❌ SKU ${sku} not found in Wholesale`);
              continue;
            }
      
            const inventoryId = retailProduct.inventory_item_id;
            const currentQty = retailProduct.quantity || 0;
      
            if (!inventoryId) {
              console.warn(`⚠️ Inventory ID missing for SKU ${sku}`);
              continue;
            }
      
            const newQty = isRefund
              ? currentQty + quantity
              : currentQty - quantity;

      // 🔽 Update quantity in Retail MongoDB
      await Wholesale.findOneAndUpdate({ sku },{ $inc: { quantity: isRefund ? quantity : -quantity  } } );
      
      await Retail.updateOne({ sku }, { quantity: newQty });
      
      await Sync.updateOne({ sku }, { quantity: newQty });
     
      // ✅ Update Shopify inventory
      await setRetailShopifyInventory(inventoryId, newQty);

      // 🔽 Update wholesale DB
    

      console.log(`✅ SKU ${sku} updated. New Qty: ${newQty}`);
    }

    return res.status(200).json({ message: "✅ Order sync complete" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

module.exports = { Webhook };