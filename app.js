const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const LoginRouter = require("./routes/login.route");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const WebhookRouter = require("./routes/webhook.route");
const SyncRouter = require("./routes/sync.route");
const PageRouter = require("./routes/pagination.route");
const UpdateRouter = require("./routes/inventory.route");
const CSVRouter = require("./routes/csv.route");

const dotenv = require("dotenv");
dotenv.config();



const app = express();
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGODB_URI)

    .then(() => {
        console.log("Connected to MongoDB");

        app.use("/", LoginRouter);
        app.use("/webhook", WebhookRouter);
        app.use("/api",SyncRouter);
          app.use("/api",PageRouter);
          app.use("/update",UpdateRouter);
          app.use('/api', CSVRouter);


        app.listen(3000, () => {
            console.log("Server started on port 3000");
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
    });
