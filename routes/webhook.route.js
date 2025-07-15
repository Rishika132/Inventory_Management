const express = require("express");

const {Webhook} = require("../controller/webhook.controller");
const {Webhook2} = require("../controller/webhook2.controller");
const {Webhook3 , Webhook4} = require("../controller/webhook3.controller");
// const {Webhook4 } = require("../controller/webhook4.controller");
const {Webhook5} = require("../controller/webhook5.controller")

const router = express.Router();

//http://localhost:3000/webhook/order

router.post("/order",Webhook);
router.post("/order2",Webhook2);

router.post("/order-creation" , Webhook3);
// router.post("/order-creation2" , Webhook4);

router.post("/order-delete" , Webhook5);
// router.post("/order-delete2");

module.exports = router;
