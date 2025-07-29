const express = require("express");
// const { auth } = require ("../middleware/auth.js");
const router = express.Router();
const {runFullSync} = require("../controller/sync.controller");

//http://localhost:3000/api/sync

router.get("/sync", runFullSync);
// router.get("/fetch-products",fetchProducts);
// router.post("/start-sync", triggerSync);
module.exports = router;
