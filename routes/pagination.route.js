const express = require("express");
const { auth } = require ("../middleware/auth.js");
const router = express.Router();
const { getSyncData } = require("../controller/pagination.controller");
const {getOrder} = require("../controller/order.controller.js");

//http://localhost:3000/api/syncpage?page=3

router.get("/syncpage",auth, getSyncData); 

router.get("/orderpage",auth,getOrder);

module.exports = router;
