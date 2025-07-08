const express = require("express");
const {login }  = require("../controller/login.controller");



const router = express.Router();

//http://localhost:3000/login

router.post("/login", login);




module.exports = router;
