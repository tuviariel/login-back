const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: {type: String, required: true, unique: true},
    lastOTPCode: String,
    emailTS: Number,
    auth: Boolean,
})

module.exports = mongoose.model("User", userSchema);