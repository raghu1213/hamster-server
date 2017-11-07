var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var customerSchema = new mongoose.Schema({
    cif: { type: Number, ref: 'cif' },
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
    initialInvestmentAmount:Number
})

customerSchema.plugin(autoIncrement.plugin, { model: 'customer', field: 'cif', startAt: 1000 })

customerSchema.query.byLoginId = function (userId) {
    return this.find({ userId: userId });
}

var customerModel = mongoose.model('customer', customerSchema, 'customer')

module.exports = customerModel