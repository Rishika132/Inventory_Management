const express = require("express");
const router = express.Router();
const { updateInventoryController } = require("../controller/inventory.controller");

router.post("/update-inventory", updateInventoryController);

module.exports = router;
