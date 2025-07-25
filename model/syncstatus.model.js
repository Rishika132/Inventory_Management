const mongoose = require("mongoose");

const syncStatusSchema = new mongoose.Schema({
inprogress:{type:Boolean,default:false}
})
module.exports = mongoose.model("SyncStatus", syncStatusSchema);
