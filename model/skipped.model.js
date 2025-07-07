
const mongoose = require("mongoose");

const SkippedProductSchema = new mongoose.Schema({
  productId: String,
  reason: String,
  json: Object,
}, { timestamps: true });

module.exports = mongoose.model("SkippedProduct", SkippedProductSchema);
