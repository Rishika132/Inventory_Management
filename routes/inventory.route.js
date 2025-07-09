const express = require("express");
// const { auth } = require ("../middleware/auth.js");
const router = express.Router();
const { updateBulkInventory} = require("../controller/inventory.controller");

//http://localhost:3000/update/update-inventory

router.post("/update-inventory",updateBulkInventory);


module.exports = router;
