var mongoose = require('mongoose')

var stockTimeSeriesSchema = new mongoose.Schema({
    ticker: String,
    date: {type: Date, index:true},
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

stockTimeSeriesSchema.index({ticker: 1, date: 1}, {unique: true});

stockTimeSeriesSchema.query.byTickers = function (tickers) {
    return this.find({ 'ticker': { $in: tickers } })
}

stockTimeSeriesSchema.query.byDate = function (date) {
    return this.find({ 'date': { $gte:date } })
}
stockTimeSeriesSchema.query.byDateRangeAndTickers = function (tickers, prevDate, date) {
    return this.find({ 'ticker': { $in: tickers } , 'date': {$gte: prevDate, $lte: date} })
}

stockTimeSeriesSchema.query.byDateAndTickers = function (tickers, date) {
    return this.find({ 'ticker': { $in: tickers } , 'date': { $gte: date } })
}

var stockTimeSeriesModel = mongoose.model('stockTimeSeries', stockTimeSeriesSchema, 'stockTimeSeries');
module.exports = stockTimeSeriesModel;


