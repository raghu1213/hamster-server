var express = require('express');
var router = express.Router();
var customerSchema = require('../src/db/mongo/customerSchema');

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
    await customerSchema.find().byLoginId(reqCustomer.userId).exec(function (err, data) {
        if (data != null && data != undefined) {
            let newCustomer = new customerSchema({
                userId: reqCustomer.userId,
                age: reqCustomer.age,
                portfolioId: reqCustomer.portfolioId,
                retirementStatus: reqCustomer.retirementStatus,
                initialInvestmentAmount: reqCustomer.initialInvestmentAmount,
                maxLossPercentage: reqCustomer.maxLossPercentage,
                expectedReturn: reqCustomer.expectedReturn,
                investmentHorizon: reqCustomer.investmentHorizon,
                totalRiskScore: 7
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
    await customerSchema.findOneAndUpdate(
        { "cif": reqCustomer.cif },//find this
        {
            //update
            userId: reqCustomer.userId,
            age: reqCustomer.age,
            portfolioId: reqCustomer.portfolioId,
            retirementStatus: reqCustomer.retirementStatus,
            initialInvestmentAmount: reqCustomer.initialInvestmentAmount,
            maxLossPercentage: reqCustomer.maxLossPercentage,
            expectedReturn: reqCustomer.expectedReturn,
            investmentHorizon: reqCustomer.investmentHorizon,
            totalRiskScore: 7
        },
        { upsert: true, 'new': true },//fetch the updated
        function (err, updatedObject) {
            res.json(updatedObject)
        })
})

module.exports = router;