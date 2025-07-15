const express = require("express");

const {Webhook} = require("../controller/webhook.controller");
const {Webhook2} = require("../controller/webhook2.controller");
const {Webhook3} = require("../controller/webhook3.controller");
const {Webhook4} = require("../controller/webhook4.controller");

const router = express.Router();

//http://localhost:3000/webhook/order

router.post("/order",Webhook);
router.post("/order2",Webhook2);

router.post("/order-creation" , Webhook3);
router.post("/order-creation2" , Webhook4);

module.exports = router;
