
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var stockDetailsSchema = new mongoose.Schema({
    srNo: { type: Number, ref: 'srNo' },
    ticker: String,
    name: String,
    sector: String,
    industry: String,
    country: String,
    marketCap: Number,
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
    shortRatio: Number,
    perfWeek: Number,
    perfMonth: Number,
    perfQuart: Number,
    perfHalf: Number,
    perfYear: Number,
    perfYTD: Number,
    volatilityWeek: Number,
    volatilityMonth: Number,
    recom: Number,
    beta: Number,
    atr: Number,
    sma20: Number,
    sma50: Number,
    sma200: Number,
    rsi: Number,
    loadDate: Date,
    marketCapCategory: String,
    peRatioRank: Number,
    fwdPERatioRank: Number,
    epsAndDividentRank: Number,
    roaRank: Number,
    roeRank: Number,
    debtEqRank: Number,
    marketCapBillionsRank: Number,
    weightedFactorsRank: Number,
    stockRankRank: Number,
    betaRank: Number,
    riskProfileBeta: String,
    normalizedBeta: Number
})
stockDetailsSchema.plugin(autoIncrement.plugin, { model: 'srNo', field: 'srNo', startAt: 1 })

stockDetailsSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var stockDetailsModel = mongoose.model('stockDetails', stockDetailsSchema, 'stockDetails');
module.exports = stockDetailsModel;
