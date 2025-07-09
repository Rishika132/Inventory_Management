const express = require("express");
const {login ,addUser , fetchUsers }  = require("../controller/login.controller");
// const { auth } = require ("../middleware/auth.js");



const router = express.Router();

//http://localhost:3000/login
//http://localhost:3000/add-user
//http://localhost:3000/users

router.post("/login", login);

router.post("/add-user",addUser);

router.get("/users",fetchUsers);


module.exports = router;
