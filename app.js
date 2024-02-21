const express = require("express");
const app = express();
const login = require('./routes/login');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://"+ process.env.MONGO_ATLAS_UN +":" + process.env.MONGO_ATLAS_PW + "@email.loo0e8r.mongodb.net/?retryWrites=true&w=majority&appName=email")
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if(req.method === 'OPTION') {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
})

app.use("/login", login);

app.use((req, res, next) => {
    const error = new Error("Not found!")
    error.status = 404;
    next(error);
})
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message
        }
    });
})

module.exports = app;