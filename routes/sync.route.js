const express = require("express");
const router = express.Router();
const { runFullSync } = require("../controller/sync.controller");

//http://localhost:3000/api/sync

router.get("/sync", runFullSync);

module.exports = router;
