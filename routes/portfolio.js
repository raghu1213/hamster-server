import PortfolioPredict from "../src/predictor/portfolio";
import * as Helpers from '../src/utils/helper'
import Logger from '../src/utils/logging'

var express = require('express');
var router = express.Router();
var PortfolioWeightSchema = require('../src/db/mongo/pwSchema');
import PortfolioBatch from '../src/predictor/assets';

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





module.exports = router;
