
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var stockRiskRewardSchema = new mongoose.Schema({
    srNo: { type: Number, ref: 'srNo' },
    ticker: String,
    company: String,
    sector: String,
    peRatio: Number,
    fwdPERatio: Number,
    epsAndDivident: Number,
    roa: Number,
    roe: Number,
    debtEq: Number,
    marketCapBillions: Number,
    weightedFactors: Number,
    stockRank: Number,
    beta: Number,
    riskProfileBeta: Number
})

stockRiskRewardSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

stockRiskRewardSchema.plugin(autoIncrement.plugin, { model: 'srNo', field: 'srNo', startAt: 1 })

var stockRiskRewardModel = mongoose.model('stockMaster', stockRiskRewardSchema, 'stockMaster');
module.exports = stockRiskRewardModel;




