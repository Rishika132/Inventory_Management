const express = require("express");
const router = express.Router();
const { updateBulkInventory} = require("../controller/inventory.controller");
const { updateInventory } = require("../controller/updateStore.controller");

//http://localhost:3000/update/update-inventory

router.post("/update-inventory",updateBulkInventory);
router.post("/inventory",updateInventory);

module.exports = router;
