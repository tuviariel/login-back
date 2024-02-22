const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer');
const path = require('path');
const express = require("express");
const router = express.Router();
const User = require("../models/users")
const mongoose = require("mongoose");
const { default: axios } = require('axios');

// initialize nodemailer
const transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth:{
            user: 'tuviaa109@gmail.com',
            pass: 'runq raoy nhqz fkdl'
        }
    }
);

// point to the template folder
const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

// use a template file with nodemailer
transporter.use('compile', hbs(handlebarOptions))

//on email address receive
router.post('/', async (req,res,next) => {
    if(req.body.email) {
        // console.log(req.body);
        const OTPCode = await getOTPCode(); 
        const email = req.body.email;
        const emailTS = Date.now();

        // relate to DB- if user -> update, if no user -> create:
        try {
            const user = await User.findOne({email: email})
            if(user) {
                user.emailTS = emailTS;
                user.lastOTPCode = OTPCode;
                await user.save();
            } else {
                console.log("no current user");
                let user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    name: req.body.name || "New User",
                    email: req.body.email,
                    lastOTPCode: OTPCode,
                    emailTS: emailTS,
                    auth: false,
                });
                await user.save();
            }
        } catch (err) {
            console.log("DB error", err);
        }

        // sending email to user:
        const userL = {
            email: req.body.email,
            name: req.body.name || req.body.email.slice(0,req.body.email.indexOf("@")) || "New User",
            code: OTPCode,
        }
        if (userL.email) {
            const mailOptions = {
                from: '"My Company" <tuviaa109@gmail.com>',
                template: "email",
                to: userL.email,
                subject: `Welcome to the site, ${userL.name}!`,
                context: {
                    name: userL.name,
                    email: userL.email,
                    code: userL.code,
                },
            };
            console.log(mailOptions)
            try {
                const result = await transporter.sendMail(mailOptions);
                console.log("result:", result)
                res.status(200).json({
                    message: "We sent you an email.",
                    action: "next",
                })
            } catch (error) {
                res.status(400).json({
                    message: "There was an error in the server. The email wasn't sent",
                    err: error,
                })
                console.log(`Nodemailer error sending email to ${userL.email}`, error);
            }
        }
    }
});

//on code receive
router.post('/code', async (req,res,next) => {
    if(req.body.code && req.body.email) {
        console.log(req.body.code);
        const currentTime = Date.now();
        try {
            const user = await User.findOne({email: req.body.email})
            if(user) {
                if(user.lastOTPCode !== req.body.code) {
                    res.status(202).json({
                        message: "incorrect code- check the email you received and try again",
                        action: "stay"
                    })
                } else if(user.emailTS < currentTime-300000) {
                    res.status(202).json({
                        message: "5 minutes have passed since the email was sent to you- try sending your email address again",
                        action: "back"
                    })
                } else if(user.emailTS > currentTime-300000 && user.lastOTPCode === req.body.code) {
                    user.auth = true;
                    await user.save();
                    res.status(200).json({
                        message: "correct code- you have authorization to join the site",
                        action: "next"
                    })
                }
            } else {
                console.log("user not found")    
            }
        } catch (err) {
            console.log("DB error", err);
        }
    }
});

const getOTPCode = async () => {
    // requesting temp from external API:
    const tempData = await axios.get("https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timelinemulti?key="+ process.env.WEATHER_API_KEY +"&locations=London%2CUK%7CParis%2CFrance%7CTokyo%2CJapan%7C")
    if(tempData) {
        let newOTPCode = "";
        tempData.data.locations.map(place => {
            let newTemp = parseInt(Math.abs(place.days[0].temp)).toString();
            if(newTemp.length !== 2) {
                if(newTemp.length > 2) {
                    newTemp.slice(0,2)
                } else {
                    newTemp = "0" + newTemp
                }
            }
            newOTPCode = newOTPCode + newTemp;
        })
        console.log(newOTPCode)
        return newOTPCode
    }
}

module.exports = router;