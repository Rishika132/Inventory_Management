const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  threshold: { type: Number, required: true, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model("Variant", variantSchema);
