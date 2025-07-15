
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

// // Order-delete
// const Sync = require("../model/sync.model");
// const Wholesale = require("../model/wholesale.model");
// const Retail = require("../model/retail.model");

// const OrderDeleted = async (req, res) => {
//   try {
//     const order = req.body;
//     const orderId = String(order.id);

//     const orderItems = await Order.find({ order_id: orderId });

//     if (!orderItems.length) {
//       return res.status(404).json({ message: "No order items found to reverse" });
//     }

//     const updated = [];

//     for (const item of orderItems) {
//       const { sku, quantity } = item;

//       const log = { sku, restored_quantity: quantity };

//       // Update Sync
//       const syncItem = await Sync.findOne({ sku });
//       if (syncItem) {
//         syncItem.quantity += quantity;
//         await syncItem.save();
//         log.sync_quantity = syncItem.quantity;
//       }

//       // Update Wholesale
//       const wholesaleItem = await Wholesale.findOne({ sku });
//       if (wholesaleItem) {
//         wholesaleItem.quantity += quantity;
//         await wholesaleItem.save();
//         log.wholesale_quantity = wholesaleItem.quantity;
//       }

//       // Update Retail
//       const retailItem = await Retail.findOne({ sku });
//       if (retailItem) {
//         retailItem.quantity += quantity;
//         await retailItem.save();
//         log.retail_quantity = retailItem.quantity;
//       }

//       updated.push(log);

//       // Delete the order item
//     await Order.deleteMany({ order_id: orderId });    }

//     return res.status(200).json({ message: "✅ Order deletion handled", updated });
//   } catch (err) {
//     console.error("❌ Order delete webhook error:", err.message);
//     return res.status(500).json({ error: "Failed to handle order deletion" });
//   }
// };

module.exports = { Webhook3 };
