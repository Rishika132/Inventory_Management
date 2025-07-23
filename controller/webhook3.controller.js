
const Order = require("../model/order.model");
const {sendThresholdEmails} = require("./nodemailer");

const Webhook3 = async (req, res) => {
  try {
    const {order} = req.body;
    
    const orderId = order.id;

    const channel=order['source_name'];
    const storeName = req.headers["x-shopify-shop-domain"] || null;
console.log(channel);
    const lineItems = order.line_items || [];

    const inserted = [];

    for (const item of lineItems) {
      const sku = item.sku?.trim();
      const quantity = item.quantity;
      const variant_title = item.title;

      if (!sku || !quantity || !variant_title || !orderId) continue;

      const newOrder = new Order({
             sku,
             quantity,
             variant_title,
             order_id: order.name,
             store_name: storeName,
             channel:channel
           });
     
           const saved = await newOrder.save();
console.log(saved);
      inserted.push(saved);
    }

        await sendThresholdEmails();

    return res.status(200).json({ message: " Order synced", inserted });
  } catch (err) {
    console.error(" Webhook error:", err.message);
    return res.status(500).json({ error: "Failed to handle webhook" });
  }
};

module.exports = { Webhook3 };
