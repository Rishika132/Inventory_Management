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
    },
      role: { type: String, default: 'user' }
});

const Login = mongoose.model("login", loginSchema);

module.exports = Login;
