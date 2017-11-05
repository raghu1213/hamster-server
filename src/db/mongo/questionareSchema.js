
var mongoose = require('mongoose')

var questionareSchema = new mongoose.Schema({
    question: String,
    options: [{ option: String, weight: Number }]

})

var questionareModel = mongoose.model('questionare', questionareSchema, 'questionare');
module.exports = questionareModel;


