var express = require('express');
var router = express.Router();
var customerSchema = require('../src/db/mongo/customerSchema');
import CustomerPredict from '../src/predictor/customer';
import PortfolioWeight from '../src/predictor/portfolio';

let customerRiskPredictor = new CustomerPredict()

router.get('/all', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})

router.get('/get/:id', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})

router.get('/get/', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})


router.post('/insert', async function (req, res) {
    let reqCustomer = req.body;
    console.log('Request-->' + JSON.stringify(reqCustomer))

    let existing = await customerSchema.find().byLoginId(reqCustomer.userId).exec()

    let response;
    if (existing != null && existing != undefined && existing.length <= 0) {
        let riskScore = await customerRiskPredictor.getRiskScore(reqCustomer);
        let riskCategory = customerRiskPredictor.getRiskCategory(riskScore);
        let newCustomer = new customerSchema({
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
                console.log(err);
                res.send(err);
            }
            let suggestedPortfolio = await customerRiskPredictor.getStockCompostionSummary(riskScore);
            response = { customer: data, portfolio: suggestedPortfolio };
            console.log(JSON.stringify(response))
            res.send(response);
        })
    } else {
        res.status(400)
        response = { message: "Duplicate" };
        res.send(response);
    }
})


router.post('/update', async function (req, res) {

    let reqCustomer = req.body;
    if (reqCustomer.cif == undefined) {
        return res.status(400).send({
            message: 'CIF is not defined! Please provide a CIF'
        });
    }
    let riskScore = await customerRiskPredictor.getRiskScore(reqCustomer)
    let riskCategory = customerRiskPredictor.getRiskCategory(riskScore)
    await customerSchema.findOneAndUpdate(
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
            res.json({ customer: updatedObject, portfolio: suggestedPortfolio });
        })

})


module.exports = router;