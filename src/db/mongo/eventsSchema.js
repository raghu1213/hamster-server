
var mongoose = require('mongoose')

var eventsSchemaDef = new mongoose.Schema({
    cif: { type: Number, ref: 'cif' },
    portfolioId: String,
    portfolioAbove:Number,
    portfolioBelow:Number,
    instrumentAbove:Number,
    instrumentBelow:Number
})

eventsSchemaDef.query.byCustomerDetails = function (cif, portfolioId) {
    return this.find({ cif: cif, portfolioId: portfolioId });
}

var eventsSchema = mongoose.model('eventsSchema', eventsSchemaDef, 'eventsSchema');
module.exports = eventsSchema;


