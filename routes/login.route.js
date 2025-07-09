const express = require("express");
const {login ,addUser }  = require("../controller/login.controller");
const { auth } = require ("../middleware/auth.js");



const router = express.Router();

//http://localhost:3000/login
//http://localhost:3000/add-user

router.post("/login", login);

router.post("/add-user",auth,addUser);


module.exports = router;
