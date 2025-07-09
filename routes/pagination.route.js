const express = require("express");
// const { auth } = require ("../middleware/auth.js");
const router = express.Router();
const { getSyncData } = require("../controller/pagination.controller");

//http://localhost:3000/api/syncpage?page=3

router.get("/syncpage", getSyncData); 

module.exports = router;
