const Login = require("../model/login.model");
const jwt = require("jsonwebtoken");

const login = async (request, response) => {

    try {
        let { email, password } = request.body;
        let user = await Login.findOne({ email });

        if (!user) {
            return response.status(401).json({ error: "Unauthorized user | Email id not found" });
        }
        if (user.password === password) {
        user.password = undefined;
        let payload = { currentUser: user._id };
        let token = jwt.sign(payload, "dflfdkjreiwreriovnxvmnvxcm@#12fdfre#");
        response.cookie("token", token);
        return response.status(200).json({ message: "Sign In Success" ,  token});
    }

    return response.status(401).json({ error: "Unauthorized user | Invalid password" });

    }
    catch (err) {
        console.log(err);
        return response.status(500).json({ error: "Internal Server Error" });
    }
}

const addUser = async (request, response) => {
    try {
        let { email, password ,role} = request.body;

        if (!email || !password) {
            return response.status(400).json({ message: 'Email and password are required.' });
        }

        const existingUser = await Login.findOne({ email });
        if (existingUser) {
            return response.status(409).json({ message: 'User already exists.' });
        }

        const newUser = new Login({ email, password, role });
        await newUser.save();

        return response.status(200).json({ message: 'User created successfully.', user: newUser });
    } catch (err) {
        console.error(err);
        return response.status(500).json({ message: ' Internal Server error' });
    }
};


module.exports = {login , addUser};

