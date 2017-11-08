import PortfolioPredict from "../src/predictor/portfolio";
import * as Helpers from '../src/utils/helper'
import Logger from '../src/utils/logging'

var express = require('express');
var router = express.Router();
var PortfolioWeightSchema = require('../src/db/mongo/pwSchema');
import PortfolioBatch from '../src/predictor/assets';
import CustomerSchema from '../src/db/mongo/customerSchema';

var logger = new Logger()

router.get('/suggest', async function (req, res, next) {
    let result = await PortfolioWeightSchema.find().exec()
    res.json(result);
});



router.get('/suggest/summary', async function (req, res, next) {
    let results = await PortfolioWeightSchema.find().exec()
    let mungedResults = []

    for (let result of results) {
        let mungedResult = {
            profile: result.profile,
            stock: result.stockPercent + result.etfPercent,
            fixedIncome: result.bondPercent ,
            cash: result.cash,
            mutualFund: result.mfPercent
        }
        mungedResults.push(mungedResult)
    }
    res.json(mungedResults);
})

router.get('/suggest/:riskscore', async function (req, res, next) {

    let porfolioPredict = new PortfolioPredict();
    let suggestedPortfolio = await porfolioPredict.getRiskAdjustedPortfolio(req.params.riskscore)

    suggestedPortfolio = Helpers.formatPortfolio(suggestedPortfolio)

    logger.log("Update Respose-->" + JSON.stringify(suggestedPortfolio))
    res.json(suggestedPortfolio);
})
router.get('/compose/:riskscore/:amount', async function (req, res, next) {
    var batch = new PortfolioBatch();
    let result = await batch.distribute(req.params.amount, req.params.riskscore);
    return res.send(JSON.stringify(result));
})

router.get('/position/:cif/:portfolioid', async function (req, res, next) {

    logger.log(`Requesting portfolio position cif: ${req.params.cif}, portfolioId: ${req.params.portfolioid}`)
    let cif = req.params.cif
    let portfolioId = req.params.portfolioid
    let porfolioPredict = new PortfolioPredict();
    let date = new Date()
    let prevDate = new Date(date.getFullYear(), date.getMonth(), date.getDay() - 1)
    let portfolioPostion = await porfolioPredict.getPortfolioPositionAsOfToday(cif, portfolioId, prevDate, date)
    let reaslizedGain = await porfolioPredict.getRealizedGain(cif, portfolioId)
    let customer = await CustomerSchema.findOne({cif:cif, portfolioId: portfolioId}).exec()
    let initialPosition = 0
    if(customer != undefined && customer != null ) {
        initialPosition = customer.initialInvestmentAmount
    }

    let responseJson = {todayPosition: portfolioPostion, realizedGain: reaslizedGain, initialPosition: initialPosition}
    logger.log(" Respose-->" + JSON.stringify(responseJson))
    res.json(responseJson);
})
router.get('/compose/:riskscore/:amount', async function (req, res, next) {
    var batch = new PortfolioBatch();
    let result = await batch.distribute(req.params.amount, req.params.riskscore);
    return res.send(JSON.stringify(result));
})





module.exports = router;
