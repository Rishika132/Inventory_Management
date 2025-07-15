
const Order = require("../model/order.model");

const Webhook4 = async (req, res) => {
  try {
    const order = req.body;

    const orderId = order.id;
    const storeName = req.headers["x-shopify-shop-domain"] || null;

    const lineItems = order.line_items || [];

    const inserted = [];

    for (const item of lineItems) {
      const sku = item.sku?.trim();
      const quantity = item.quantity;
      const variant_title = item.title;

      if (!sku || !quantity || !variant_title || !orderId) continue;

      const saved = await Order.insertMany(
       
        {
          sku,
          quantity,
          variant_title,
          order_id: String(orderId),
          store_name: storeName,
        }
      );

      inserted.push(saved);
    }

    return res.status(200).json({ message: "✅ Order synced", inserted });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Failed to handle webhook" });
  }
};


// // const Sync = require("../model/sync.model");

// const OrderDeleted2 = async (req, res) => {
//   try {
//     const order = req.body;
//     const orderId = String(order.id);

//     // 1. Find all order items with this order_id
//     const orderItems = await Order.find({ order_id: orderId });
//     console.log(orderItems);

//     if (!orderItems.length) {
//       return res.status(404).json({ message: "No order items found to reverse" });
//     }

//     const updated = [];

//     for (const item of orderItems) {
//       const { sku, quantity } = item;

//       await Order.deleteOne({ order_id: orderId });
//     }

//     return res.status(200).json({ message: "✅ Order deletion handled", updated });
//   } catch (err) {
//     console.error("❌ Order delete webhook error:", err.message);
//     return res.status(500).json({ error: "Failed to handle order deletion" });
//   }
// };


module.exports = { Webhook4 };
