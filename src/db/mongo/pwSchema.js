
var mongoose = require('mongoose')

var pwSchema = new mongoose.Schema({
    profile: String,
    stockPercent: Number,
    bondPercent: Number,
    etfPercent: Number,
    mfPercent: Number,
    cash: Number
   
})

var pwModel = mongoose.model('portfolioWeight', pwSchema, 'portfolioWeight');
module.exports = pwModel;


