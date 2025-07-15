
const Order = require("../model/order.model");

const Webhook3 = async (req, res) => {
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

      const saved = await Order.findOneAndUpdate(
        { sku },
        {
          sku,
          quantity,
          variant_title,
          order_id: String(orderId),
          store_name: storeName,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      inserted.push(saved);
    }

    return res.status(200).json({ message: "✅ Order synced", inserted });
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(500).json({ error: "Failed to handle webhook" });
  }
};

module.exports = { Webhook3 };
