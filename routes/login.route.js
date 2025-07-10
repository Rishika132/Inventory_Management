const express = require("express");
const {login ,addUser , fetchUsers }  = require("../controller/login.controller");
const { auth } = require ("../middleware/auth.js");



const router = express.Router();

//http://localhost:3000/login
//http://localhost:3000/add-user
//

router.post("/login", login);

router.post("/add-user",auth,addUser);

router.get("/users",auth,fetchUsers);


module.exports = router;
