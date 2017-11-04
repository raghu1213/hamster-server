var mongoose = require('mongoose')
var autoIncrement = require('mongoose-auto-increment')

autoIncrement.initialize(mongoose.connection)

var customerSchema = new mongoose.Schema({
    cif: { type: Number, ref: 'cif' },
    userId: String,
    age: Number,
    portfolioId: String,
    retirementStatus: String

})