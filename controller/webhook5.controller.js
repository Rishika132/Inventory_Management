const Order = require("../model/order.model");

const Webhook5 = async (req, res) => {
  try {
    const order = req.body;
    const orderId = String(order.id); // Shopify order ID

    // Delete all entries with this order_id
    const result = await Order.deleteMany({ order_id: orderId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "⚠️ No orders found to delete in DB" });
    }

    return res.status(200).json({
      message: "✅ Order deleted from MongoDB",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("❌ Webhook error (order delete):", err.message);
    return res.status(500).json({ error: "Failed to delete order from DB" });
  }
};

module.exports = { Webhook5 };
