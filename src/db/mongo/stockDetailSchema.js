
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var stockDetailsSchema = new mongoose.Schema({
    sr_No: { type: Number, ref: 'sr_No' },
    ticker: String,
    company: String,
    sector: String,
    industry: String,
    country: String,
    marketCap: Number,
    peRatio: Number,
    peRatio: Number,
    price: Number,
    change: Number,
    volume: Number,
    fwdPERatio: Number,
    peg: Number,
    psRatio: Number,
    pbRatio: Number,
    pcRatio: Number,
    pfcFRatio: Number,
    epsThisYear: Number,
    divident: Number,
    roa: Number,
    roe: Number,
    roi: Number,
    currR: Number,
    quickR: Number,
    ltDeptEq: Number,
    debtEq: Number,
    outstanding: Number,
    float: Number,
    insiderOwn: Number,
    insiderTran: Number,
    instOwn: Number,
    instTran: Number,
    floatShort: Number,
    shortRatio: Number
})
stockDetailsSchema.plugin(autoIncrement.plugin, { model: 'sr_No', field: 'sr_No', startAt: 1 })

stockDetailsSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var stockDetailsModel = mongoose.model('stockDetails', stockDetailsSchema, 'stockDetails');
module.exports = stockDetailsModel;
