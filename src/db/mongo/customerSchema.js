var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var customerSchema = new mongoose.Schema({
    cif: { type: Number, ref: 'cif' },
    userId: String,
    age: Number,
    portfolioId: String,
    retirementStatus: String,
    initialInvestmentAmount: { type: Number, required: true, default: 0 },
    maxLossPercentage: { type: Number, required: true, default: 0 },
    expectedReturn: { type: Number, required: true, default: 0 },
    investmentHorizon: { type: Number, required: true, default: 1 },
    totalRiskScore: { type: Number, required: true, default: 1 }
})

customerSchema.plugin(autoIncrement.plugin, { model: 'customer', field: 'cif', startAt: 1000 })

customerSchema.query.byLoginId = function (userId) {
    return this.find({ userId: userId });
}

var customerModel = mongoose.model('customer', customerSchema, 'customer')

module.exports = customerModel