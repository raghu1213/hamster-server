var mongoose = require('mongoose')

var stockTimeSeriesSchema = new mongoose.Schema({
    ticker: String,
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    dividend: Number,
    split: Number,
    adj_Open: Number,
    adj_High: Number,
    adj_Low: Number,
    adj_Close: Number,
    adj_Volume: Number
})

stockTimeSeriesSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

var stockTimeSeriesModel = mongoose.model('stockTimeSeries', stockTimeSeriesSchema, 'stockTimeSeries');
module.exports = stockTimeSeriesModel;


