var mongoose = require('mongoose')

var stockMasterSchema = new mongoose.Schema({
    symbol: String,
    name: String,
    marketCapital: Number,
    ipoYear: String,
    sector: String,
    industry: String,
    date: Date
})

var stockMasterModel = mongoose.model('stockMaster', stockMasterSchema, 'stockMaster');
module.exports = stockMasterModel;


