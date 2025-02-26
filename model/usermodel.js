let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    email : String,
    password : String,
    uniqueId: { type: String, unique: true }
})

let usermodel = mongoose.model('useregform', userSchema)

module.exports = usermodel;