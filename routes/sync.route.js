const express = require("express");
const { auth } = require ("../middleware/auth.js");
const router = express.Router();
const { runFullSync } = require("../controller/sync.controller");

//http://localhost:3000/api/sync

router.get("/sync",auth, runFullSync);

module.exports = router;
