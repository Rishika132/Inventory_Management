
// const Wholesale = require("../model/wholesale.model");
// const Retail = require("../model/retail.model");
// const { setShopifyInventory } = require("../utils/update");
// const Webhook2 = async (req, res) => {
  
//   try {
//     const order = req.body;
//     // console.log(JSON.stringify(order.refunds));
//     // console.log(order.refunds.refund_line_items.sku);
//     // console.log(order.refunds.refund_line_items.quantity);
//     for (const item of order.line_items || []) {
//       const sku = item.sku?.trim();
//       const qtyOrdered = item.quantity;

//       if (!sku || !qtyOrdered) continue;

//       // 🔽 Update quantity in Retail MongoDB
//       await Retail.findOneAndUpdate({ sku },{ $inc: { quantity: -qtyOrdered } } );

//       // 🔽 Fetch wholesale product
//       const wholesaleProduct = await Wholesale.findOne({sku:sku});
//       console.log( wholesaleProduct);
//       const inventoryId = wholesaleProduct.inventory_item_id;
//       const currentQty = wholesaleProduct.quantity || 0;
//       const newQty = currentQty - qtyOrdered;
     

//       if (!inventoryId) {
//         console.warn(`⚠️ Inventory ID missing for SKU ${sku}`);
//         continue;
//       }

//       // ✅ Update Shopify inventory
//       await setShopifyInventory(inventoryId, newQty);

//       // 🔽 Update wholesale DB
//       await Wholesale.updateOne({ sku }, { quantity: newQty });

//       console.log(`✅ SKU ${sku} updated. New Qty: ${newQty}`);
//     }

//     return res.status(200).json({ message: "✅ Order sync complete" });
//   } catch (err) {
//     console.error("❌ Webhook error:", err.message);
//     return res.status(500).json({ error: "Webhook processing failed" });
//   }
// }

// module.exports = { Webhook2 };
const Wholesale = require("../model/wholesale.model");
const Retail = require("../model/retail.model");
const Sync = require("../model/sync.model");
const { setShopifyInventory } = require("../utils/update");

const Webhook2 = async (req, res) => {
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

      const wholesaleProduct = await Wholesale.findOne({ sku });
      if (!wholesaleProduct) {
        console.warn(`❌ SKU ${sku} not found in Wholesale`);
        continue;
      }

      const inventoryId = wholesaleProduct.inventory_item_id;
      const currentQty = wholesaleProduct.quantity || 0;

      if (!inventoryId) {
        console.warn(`⚠️ Inventory ID missing for SKU ${sku}`);
        continue;
      }

      const newQty = isRefund
        ? currentQty + quantity
        : currentQty - quantity;

      await Retail.findOneAndUpdate(
        { sku },
        { $inc: { quantity: isRefund ? quantity : -quantity } }
      );

      await Wholesale.updateOne({ sku }, { quantity: newQty });
       await Sync.updateOne({ sku }, { quantity: newQty });


      await setShopifyInventory(inventoryId, newQty);

      console.log(`✅ SKU ${sku} ${isRefund ? 'restocked (refund)' : 'sold'}. New Qty: ${newQty}`);
    }

    return res.status(200).json({
      message: `✅ Inventory ${isRefund ? 'restocked (refund)' : 'synced (sale)'}`,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

module.exports = { Webhook2 };
