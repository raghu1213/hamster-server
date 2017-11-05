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
    let existing = await customerSchema.find().byLoginId(reqCustomer.userId).exec()

    if (existing != null && existing != undefined && existing.length <= 0) {
        let riskScore = await customerRiskPredictor.getRiskScore(reqCustomer);
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
            riskCategory: customerRiskPredictor.getRiskCategory(riskScore)
        })

        newCustomer.save((err, data) => {
            if (err) {
                console.log(err);
                res.send(err);
            }
            res.json({ customer: data, portfolio: customerRiskPredictor.getStockCompostionSummary(riskScore) });
        })
    } else {
        res.send("Duplicate")
    }
})


router.post('/update', async function (req, res) {

    let reqCustomer = req.body;
    if (reqCustomer.cif == undefined) {
        return res.status(400).send({
            message: 'CIF is not defined! Please provide a CIF'
        });
    }
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
            totalRiskScore: await customerRiskPredictor.getRiskScore(reqCustomer),
            riskCategory: customerRiskPredictor.getRiskCategory(riskScore)

        },
        { upsert: true, 'new': true },//fetch the updated
        function (err, updatedObject) {
            res.json({ customer: updatedObject, portfolio: customerRiskPredictor.getStockCompostionSummary(riskScore) });
        })

})


module.exports = router;