var mongoose = require('mongoose')
var PwSchema = require('../db/mongo/pwSchema')
var Env = require('../../env')

console.log('STARTING INSERT')
//let mongoURL = "mongodb://127.0.0.1:27017/hamsterdb";
let mongoURL = Env.mongoDB;
mongoose.connect(mongoURL, { useMongoClient: true })
console.log('Connected to ' + mongoURL)
console.log('----------------------------')

let pw1 = new PwSchema({
    profile: "conservative",
    stockPercent: 5,
    bondPercent: 70,
    etfPercent: 5,
    mfFIPercent: 10,
    mfEqPercent: 0,
    mfMixedPercent: 0,
    cash: 10
})
pw1.save()
console.log("Conservative")

let pw2 = new PwSchema({
    profile: "balanced",
    stockPercent: 30,
    bondPercent: 30,
    etfPercent: 10,
    mfFIPercent: 10,
    mfEqPercent: 10,
    mfMixedPercent: 0,
    cash: 10
})
pw2.save()
console.log("balanced")

let pw3 = new PwSchema({
    profile: "highGrowth",
    stockPercent: 45,
    bondPercent: 15,
    etfPercent: 25,
    mfFIPercent: 5,
    mfEqPercent: 0,
    mfMixedPercent: 5,
    cash: 5
})
pw3.save()
console.log("balanced")
console.log('----------------------------')
console.log('COMPLETED')