var express = require('express');
var router = express.Router();
import Utils from './utils'
import CustomerPredict from '../src/predictor/customer';
import PortfolioWeight from '../src/predictor/portfolio';
import CustomerSchema from '../src/db/mongo/customerSchema';
import Logger from '../src/utils/logging'

let util = new Utils();
let logger = new Logger();
let customerRiskPredictor = new CustomerPredict();

router.get('/all', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})

router.get('/get/:loginId', async function (req, res) {
    logger.log('Fetchign results for id --> ' + req.params.loginId)
    let result = await CustomerSchema.find().byLoginId(req.params.loginId).exec();
    logger.log("Sending response--> " + result);
    res.json(result);
})

router.post('/insert', async function (req, res) {
    let reqCustomer = req.body;
    logger.log('Request-->' + JSON.stringify(reqCustomer))

    let existing = await CustomerSchema.find().byLoginId(reqCustomer.userId).exec()
    if (existing != undefined && existing.length > 0) {
        logger.log(JSON.stringify(existing))
        return util.errorRespose(res, "Login id already exist!");
    }

    let riskScore = await customerRiskPredictor.getRiskScore(reqCustomer);
    let riskCategory = customerRiskPredictor.getRiskCategory(riskScore);
    let newCustomer = new CustomerSchema({
        userId: reqCustomer.userId,
        portfolioId: reqCustomer.portfolioId,
        age: reqCustomer.age,
        investmentKnowledge: reqCustomer.investmentKnowledge,
        investmentExperience: reqCustomer.investmentExperience,
        expectedReturn: reqCustomer.expectedReturn,
        investmentHorizon: reqCustomer.investmentHorizon,
        reactionToFluctuations: reqCustomer.reactionToFluctuations,
        totalRiskScore: riskScore,
        riskCategory: riskCategory
    })
    newCustomer.save(async (err, data) => {
        if (err) {
            return util.errorRespose(res, err);
        }
        logger.log("Customer created-->" + data)
        let suggestedPortfolio = await customerRiskPredictor.getStockCompostionSummary(riskScore);
        logger.log("Suggested portfolio-->" + suggestedPortfolio)
        suggestedPortfolio = formatPortfolio(suggestedPortfolio)
        let response = { customer: data, portfolio: suggestedPortfolio };
        logger.log(JSON.stringify(response))
        res.send(response);
    })

})


router.post('/update', async function (req, res) {

    let reqCustomer = req.body;
    if (reqCustomer.cif == undefined) {
        return util.errorRespose(res, "CIF is not defined! Please provide a CIF")
    }
    logger.log("Customer to update-->" + JSON.stringify(reqCustomer))
    let riskScore = await customerRiskPredictor.getRiskScore(reqCustomer)
    let riskCategory = customerRiskPredictor.getRiskCategory(riskScore)
    await CustomerSchema.findOneAndUpdate(
        { "cif": reqCustomer.cif },//find this
        {
            userId: reqCustomer.userId,
            portfolioId: reqCustomer.portfolioId,
            age: reqCustomer.age,
            investmentKnowledge: reqCustomer.investmentKnowledge,
            investmentExperience: reqCustomer.investmentExperience,
            expectedReturn: reqCustomer.expectedReturn,
            investmentHorizon: reqCustomer.investmentHorizon,
            reactionToFluctuations: reqCustomer.reactionToFluctuations,
            totalRiskScore: riskScore,
            riskCategory: riskCategory
        },
        { upsert: true, 'new': true },//fetch the updated
        async function (err, updatedObject) {
            let suggestedPortfolio = await customerRiskPredictor.getStockCompostionSummary(riskScore);
            suggestedPortfolio = formatPortfolio(suggestedPortfolio)
            let response = { customer: updatedObject, portfolio: suggestedPortfolio }

            logger.log("Update Respose-->" + JSON.stringify(response))
            res.json(response);
        })
})

function formatPortfolio(suggestedPortfolio) {
    let arr = [];
    arr.push({ STOCK: suggestedPortfolio.stockPercent })
    arr.push({ ETF: suggestedPortfolio.etfPercent })
    arr.push({ MFEQ: suggestedPortfolio.mfEqPercent })
    arr.push({ BOND: suggestedPortfolio.bondPercent })
    arr.push({ MFFI: suggestedPortfolio.mfFIPercent })
    arr.push({ MFMIX: suggestedPortfolio.mfMixedPercent })
    arr.push({ CASH: suggestedPortfolio.cash })
    return ({ profile: suggestedPortfolio.profile, distribution: arr });

}

module.exports = router;