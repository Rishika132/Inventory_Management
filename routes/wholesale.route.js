const express = require("express");

const { wholesaleSync } = require("../controller/wholesale.controller");


const router = express.Router();


router.get("/wholesale",wholesaleSync);


module.exports = router;
