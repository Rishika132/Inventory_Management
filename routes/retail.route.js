const express = require("express");
const { retailSync } = require("../controller/retail.controller");

const router = express.Router();
router.get("/retail", retailSync);

module.exports = router;
