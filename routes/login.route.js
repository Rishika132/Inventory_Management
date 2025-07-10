const express = require("express");
const {login ,addUser , fetchUsers , deleteUser , updateUser}  = require("../controller/login.controller");
const { auth } = require ("../middleware/auth.js");



const router = express.Router();

//http://localhost:3000/login
//http://localhost:3000/add-user
//http://localhost:3000/users

router.post("/login", login);

router.post("/add-user",auth,addUser);

router.get("/users",auth,fetchUsers);

router.delete("/delete/:id",auth,deleteUser);

router.put("/update/:id",updateUser);


module.exports = router;
