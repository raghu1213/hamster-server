var express = require('express');
var router = express.Router();
var customerSchema = require('../src/db/mongo/customerSchema');
import CustomerPredict from '../src/predictor/customer';

let customerRiskPredictor = new CustomerPredict()

router.get('/all', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})


router.get('/get/:id', async function (req, res) {
    let result = await customerSchema.find().exec();
    res.json(result);
})

router.post('/insert', async function (req, res) {
    let reqCustomer = req.body;
    await customerSchema.find().byLoginId(reqCustomer.userId).exec(async function (err, data) {
        if (data != null && data != undefined) {
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
                totalRiskScore: riskScore
            })

            newCustomer.save((err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                }
                res.json(data);
            })
        } else {
            res.send("Duplicate")
        }
    })
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
            totalRiskScore: await customerRiskPredictor.getRiskScore(reqCustomer)

        },
        { upsert: true, 'new': true },//fetch the updated
        function (err, updatedObject) {
            res.json(updatedObject)
        })

})


module.exports = router;