const mongoose = require("mongoose");

const syncStatusSchema = new mongoose.Schema({
inprogress:{type:Boolean,default:false},
wholesale_cursor: { type: String, default: null },
retail_cursor: { type: String, default: null }
})
module.exports = mongoose.model("SyncStatus", syncStatusSchema);
