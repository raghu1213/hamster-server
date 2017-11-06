
var mongoose = require('mongoose')


var mutualFundDetailsSchema = new mongoose.Schema({
    ticker: String,
name: String,
isin: String,
shareClass:String,
inceptionDate: String,
assetClass:String,
subAssetClass:String,
region: String,
strategy:String,
market:String,
ytdPercent: Number,
ytd1Ypercent:Number,
ytd3Ypercent:Number,
ytd5Ypercent:Number,
ytd10Ypercent:Number,
inceptPercent:Number,
performaceAsOf:String,
netAssets:Number,
nav:Number,
changeInUSD: Number,
changeInPercent:Number,
navAsOf: String,
thirtydaySECYieldPercent: Number,
dailyRangeVolatilityPercent:Number,
dailyCloseVolatilityPercent:Number,
riskProfile:String,
bestReturnIn:Number
})

mutualFundDetailsSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var mutualFundDetailsModel = mongoose.model('mutualFundDetails', mutualFundDetailsSchema, 'mutualFundDetails');
module.exports = mutualFundDetailsModel;




