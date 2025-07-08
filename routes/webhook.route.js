const express = require("express");

const {Webhook} = require("../controller/webhook.controller");
const {Webhook2} = require("../controller/webhook2.controller");

const router = express.Router();

//http://localhost:3000/webhook/order

router.post("/order",Webhook);
router.post("/order2",Webhook2);

module.exports = router;
