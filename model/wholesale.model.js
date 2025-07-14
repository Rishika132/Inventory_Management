const mongoose = require("mongoose");

const wholesaleSchema = new mongoose.Schema({
  inventory_item_id: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  sku: { type: String, required: true, unique: true },
    threshold: { type: Number, required: true, default: 5 },
  product_id: {
    type: String,
    required: true,
  },
   product_title: {
    type: String,
    required: true,
  },
   product_image:{
     type: String, 
      default: null,
  },
   variant_title: {
    type: String,
    required: true,
  },
  variant_price:{
    type:String,
    required:true
  },
  variant_image:{
     type: String, 
      default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model("Wholesale", wholesaleSchema);
