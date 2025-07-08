const express = require("express");
const {login }  = require("../controller/login.controller");
const {Sync }  = require("../controller/sync.controller");


const router = express.Router();

router.post("/login", login);
router.get("/sync/:limit", Sync);



module.exports = router;
