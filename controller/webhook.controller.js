const Order = require("../model/order.model");
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const { setRetailShopifyInventory } = require("../utils/updateStore");

const Webhook = async (req, res) => {
  try {
      const order = req.body;
      const storeName = req.headers["x-shopify-shop-domain"] || null;
      const orderId = String(order.name);

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

      await Wholesale.findOneAndUpdate({ sku },{ $inc: { quantity: isRefund ? quantity : -quantity  } } );
      
      await Retail.updateOne({ sku }, { quantity: newQty });
      
      await Sync.updateOne({ sku }, { quantity: newQty });
     
      // ✅ Update Shopify inventory
      await setRetailShopifyInventory(inventoryId, newQty);

    

      console.log(`✅ SKU ${sku} updated. New Qty: ${newQty}`);
    }

      await Order.deleteMany({ order_id: orderId, store_name: storeName });

    return res.status(200).json({ message: "✅ Order sync complete and order deleted" });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

module.exports = { Webhook };