var mongoose = require('mongoose')

var bondDetailsSchema = new mongoose.Schema({
    name: String,
    ticker: String,
    coupon: String,
    couponType: String,
    paymentRank: String,
    maturity: String,
    maturityType: String,
    ytm: String,
    maturityYearsFromToday: String,
    catatgory: String,
    rating: String,
    amtOut: String,
    amount: String
})

bondDetailsSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var bondDetailsModel = mongoose.model('bondDetails', bondDetailsSchema, 'bondDetails');
module.exports = bondDetailsModel;


