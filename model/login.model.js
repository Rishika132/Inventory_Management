const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required: true
    }
});

const Login = mongoose.model("login", loginSchema);

module.exports = Login;
