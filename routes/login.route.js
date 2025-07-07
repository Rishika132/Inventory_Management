const express = require("express");
const {login }  = require("../controller/login.controller");
const {Sync }  = require("../controller/sync.controller");
const {Webhook} = require("../controller/webhook.controller");

const router = express.Router();

router.post("/login", login);
router.get("/sync",Sync);
router.post("/webhook/order",Webhook);

module.exports = router;
