
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

var cleintTransactionSchemaDef = new mongoose.Schema({
    cif: String,
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

cleintTransactionSchemaDef.plugin(autoIncrement.plugin, {
    model: 'cleintTransactionSchema',
    field: 'txnNumber',
    startAt: 0,
    incrementBy: 1});

cleintTransactionSchemaDef.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId , txnStatus: 'completed'});
}

cleintTransactionSchemaDef.query.pendingTransactionByMobileNumberTickerAndBuySell = function (mobileNumber, ticker, buySell) {
    return this.find({ mobileNumber: mobileNumber, ticker: ticker, txnStatus: 'pending', BuySell:buySell});
}

cleintTransactionSchemaDef.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId , txnStatus: 'completed'});
}





cleintTransactionSchemaDef.query.byDate = function (date) {
    return this.find({ txnDate:{$gte: Date(date), $lt:Date(date.setDate(date.getDate() + 1))}, txnStatus: 'completed' });
}



var cleintTransactionSchema = mongoose.model('cleintTransactionSchema', cleintTransactionSchemaDef, 'cleintTransactionSchema');
module.exports = cleintTransactionSchema;


