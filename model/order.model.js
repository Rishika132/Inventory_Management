const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  
  quantity: { type: Number, required: true },

    order_id: {
    type: String,
    required: true,
  },

   store_name:{
     type: String, 
      default: null,
  },

   variant_title: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
