const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  json: { type: Object, required: true },
});

module.exports = mongoose.model("Product", ProductSchema);
