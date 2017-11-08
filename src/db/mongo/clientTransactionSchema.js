
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

var clientTransactionSchema = new mongoose.Schema({
    cif: Number,
    portfolioId: String,
    mobileNumber:String,
    txnStatus:{type:String},
    txnNumber:Number,
    txnDate:{ type : Date, default: Date.now },
    AssetType:String,
    ticker:String,
    BuySell:String,
    unitPrice:Number,
    numberOfUnits:Number,
    amount: Number
});

clientTransactionSchema.plugin(autoIncrement.plugin, {
    model: 'clientTransactionSchema',
    field: 'txnNumber',
    startAt: 0,
    incrementBy: 1});

clientTransactionSchema.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId , txnStatus: 'completed'});
}

clientTransactionSchema.query.pendingTransactionByMobileNumberTickerAndBuySell = function (mobileNumber, ticker, buySell) {
    return this.find({ mobileNumber: mobileNumber, ticker: ticker, txnStatus: 'pending', BuySell:buySell});
}

clientTransactionSchema.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId , txnStatus: 'completed'});
}





clientTransactionSchema.query.byDate = function (date) {
    return this.find({ txnDate:{$gte: Date(date), $lt:Date(date.setDate(date.getDate() + 1))}, txnStatus: 'completed' });
}



var clientTransactionSchema = mongoose.model('clientTransactionSchema', clientTransactionSchema, 'clientTransactionSchema');
module.exports = clientTransactionSchema;


