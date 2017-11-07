var mongoose = require('mongoose')

var etfDetailsSchema = new mongoose.Schema({
    ticker: String,
    name: String,
    shareClass: String,
    inceptionDate: Date,
    assetClass: String,
    subAssetClass: String,
    strategy: String,
    ytdPercent: Number,
    ytd1: Number,
    ytd3: Number,
    ytd5: Number,
    ytd10: Number,
    returnSinceInception: Number,
    netAssets: Number,
    nav: Number,
    changeInUSD: Number,
    changeInPercent: Number,
    dailyRangeVolatilityPercent: Number,
    dailyCloseVolatilityPercent: Number,
    riskProfile: String,
    bestReturnIn: String,
    years: Number
})

etfDetailsSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var etfDetailsModel = mongoose.model('etfDetails', etfDetailsSchema, 'etfDetails');
module.exports = etfDetailsModel;


