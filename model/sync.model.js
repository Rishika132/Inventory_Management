const mongoose = require("mongoose");

const syncSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  threshold: { type: Number, required: true, default: 5 },
    product_title: {
    type: String,
    required: true,
  },
   variant_title: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Sync", syncSchema);
