var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var customerSchema = new mongoose.Schema({
    cif:String,
    userId: String,
    name:String,
    portfolioId: String,
    age: Number,
    investmentKnowledge: String,
    investmentExperience: String,
    expectedReturn: String,
    investmentHorizon: String,
    reactionToFluctuations: String,
    totalRiskScore: { type: Number, required: true, default: 1 },
    riskCategory: String,
    initialInvestmentAmount:Number,
    mobileNumber: String
})

customerSchema.plugin(autoIncrement.plugin, { model: 'customer', field: 'cif', startAt: 1000 })

customerSchema.query.byLoginId = function (userId) {
    return this.find({ userId: userId });
}

customerSchema.query.byCustomerAndPortfolio = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId });
}

var customerModel = mongoose.model('customer', customerSchema, 'customer')

module.exports = customerModel