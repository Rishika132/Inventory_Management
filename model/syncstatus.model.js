const mongoose = require("mongoose");

const syncStatusSchema = new mongoose.Schema({
syncing:{type:Boolean,default:false},
inprogress:{type:Boolean,default:false},
wholesale_cursor: { type: String, default: null },
retail_cursor: { type: String, default: null },
wholesale_product:{type:Boolean,default:false},
retail_product:{type:Boolean,default:false},
})
module.exports = mongoose.model("SyncStatus", syncStatusSchema);
