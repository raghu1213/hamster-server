var mongoose = require('mongoose')
var questionareSchema = require('../db/mongo/questionareSchema')
var env = require('../../env')

console.log('STARTING INSERT')
let mongoURL = env.mongoDB//"mongodb://127.0.0.1:27017/hamsterdb";
mongoose.connect(mongoURL, { useMongoClient: true })
console.log('Connected to ' + mongoURL)
console.log('----------------------------')
let question1 = new questionareSchema({
    question: "age",
    options: [
        { option: "20-30", weight: 10 },
        { option: "30-40", weight: 8 },
        { option: "40-50", weight: 7 },
        { option: "50-60", weight: 6 },
        { option: "60-70", weight: 5 },
        { option: "70-200", weight: 3 },
    ]
})
question1.save();
console.log('age')

let question2 = new questionareSchema({
    question: "investmentKnowledge",
    options: [
        { option: "none", weight: 1 },
        { option: "average", weight: 3 },
        { option: "extensive", weight: 5 }
    ]
})
question2.save();
console.log('investmentKnowledge')

let question3 = new questionareSchema({
    question: "investmentExperience",
    options: [
        { option: "none", weight: 1 },
        { option: "average", weight: 3 },
        { option: "extensive", weight: 5 }
    ]
})
question3.save();
console.log('investmentExperience')

let question4 = new questionareSchema({
    question: "expectedReturn",
    options: [
        { option: "conservative", weight: 1 },
        { option: "moderate", weight: 5 },
        { option: "aggressive", weight: 10 }
    ]
})
question4.save();
console.log('expectedReturn')

let question5 = new questionareSchema({
    question: "investmentHorizon",
    options: [
        { option: "0-5", weight: 1 },
        { option: "5-10", weight: 5 },
        { option: "10-200", weight: 10 }
    ]
})
question5.save();
console.log('investmentHorizon')

let question6 = new questionareSchema({
    question: "reactionToFluctuation",
    options: [
        { option: "nervous", weight: 1 },
        { option: "concerned", weight: 5 },
        { option: "ignore", weight: 10 },

    ]
})
question6.save();
console.log('reactionToFluctuation')
console.log('----------------------------')
console.log('COMPLETED')