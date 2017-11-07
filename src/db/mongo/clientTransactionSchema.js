
var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

var cleintTransactionSchemaDef = new mongoose.Schema({
    cif: String,
    portfolioId: String,
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
    return this.find({ cif: cif, portfolioId: portfolioId });
}

cleintTransactionSchemaDef.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId });
}

cleintTransactionSchemaDef.query.customerInitialPositionByPortfolio = function (cif, portfolioId) {
    return this.aggregate([
        {$match: { cif: cif, portfolioId: portfolioId}},
        { $group: { _id: null, amount: { $sum: "$amount" } } }
    ])
}

cleintTransactionSchemaDef.query.byDate = function (date) {
    return this.find({ txnDate:{$gte: Date(date), $lt:Date(date.setDate(date.getDate() + 1))} });
}



var cleintTransactionSchema = mongoose.model('cleintTransactionSchema', cleintTransactionSchemaDef, 'cleintTransactionSchema');
module.exports = cleintTransactionSchema;


