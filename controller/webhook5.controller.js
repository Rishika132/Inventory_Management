const Order = require("../model/order.model");

const Webhook5 = async (req, res) => {
  try {
    const order = req.body;
    const orderId = String(order.id);
    const storeName = req.headers["x-shopify-shop-domain"];

    if (!orderId || !storeName) {
      return res.status(400).json({ error: "Missing order ID or store name" });
    }

    const result = await Order.deleteMany({ order_id: orderId, store_name: storeName });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "⚠️ No matching orders found to delete",
        order_id: orderId,
        store: storeName,
      });
    }

    return res.status(200).json({
      message: "✅ Order deleted successfully",
      order_id: orderId,
      store: storeName,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("❌ Order delete webhook error:", err.message);
    return res.status(500).json({ error: "Failed to handle order deletion" });
  }
};

module.exports = { Webhook5 };
