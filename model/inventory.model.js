const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  inventory_item_id: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);
