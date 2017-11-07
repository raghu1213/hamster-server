var express = require('express');
var router = express.Router();
import Utils from './utils'
import CustomerPredict from '../src/predictor/risk';
import PortfolioWeight from '../src/predictor/portfolio';
var ClientTranasctionSchema = require('../src/db/mongo/clientTransactionSchema');
import CustomerSchema from '../src/db/mongo/customerSchema';
import Logger from '../src/utils/logging'
import RiskPredictor from '../src/predictor/risk'
import * as Helper from '../src/utils/helper'
import PortfolioBatch from '../src/predictor/assets';

let util = new Utils();
let logger = new Logger();

router.get('/all', async function (req, res) {
    let result = await CustomerSchema.find().exec();
    res.json(result);
})

router.get('/get/:loginId', async function (req, res) {
    logger.log('Fetchign results for id --> ' + req.params.loginId)
    let result = await CustomerSchema.find().byLoginId(req.params.loginId).exec();
    logger.log("Sending response--> " + result);
    res.json(result);
})

router.post('/riskscore', async function (req, res) {
    let reqCustomer = req.body;
    if (reqCustomer === undefined || reqCustomer === null || reqCustomer.userId === '') {
        res.json('Invalid Risk data')
    }

    var riskPredictor = new RiskPredictor();
    var riskScore = await riskPredictor.getRiskScore(reqCustomer)
    logger.log("Sending response--> " + riskScore);
    res.json({ totalRiskScore: riskScore });
})

router.post('/insert', async function (req, res) {
    let reqCustomer = req.body;
    logger.log('Request-->' + JSON.stringify(reqCustomer))

    if (reqCustomer === undefined || reqCustomer === null || reqCustomer.userId === '') {
        res.json('Invalid Risk data')
    }

    let existing = await CustomerSchema.find().byLoginId(reqCustomer.userId).exec()
    if (existing != undefined && existing.length > 0) {
        logger.log(JSON.stringify(existing))
        return util.errorRespose(res, "Login id already exist!");
    }
    let riskCategory = Helper.getRiskCategory(reqCustomer.totalRiskScore);
    let newCustomer = new CustomerSchema({
        userId: reqCustomer.userId,
        name: reqCustomer.name,
        portfolioId: reqCustomer.portfolioId,
        age: reqCustomer.age,
        investmentKnowledge: reqCustomer.investmentKnowledge,
        investmentExperience: reqCustomer.investmentExperience,
        expectedReturn: reqCustomer.expectedReturn,
        investmentHorizon: reqCustomer.investmentHorizon,
        reactionToFluctuations: reqCustomer.reactionToFluctuations,
        totalRiskScore: reqCustomer.totalRiskScore,
        riskCategory: riskCategory,
        initialInvestmentAmount: reqCustomer.initialInvestmentAmount,
        mobileNumber: reqCustomer.mobileNumber
    })
    newCustomer.save(async (err, data) => {
        if (err) {
            res.json(util.errorRespose(res, err));
        }
        logger.log("Risk created-->" + data)
        let response = { customer: data };
        logger.log(JSON.stringify(response))

    })
    var batch = new PortfolioBatch();

    let constituents = await batch.distribute(newCustomer.initialInvestmentAmount, newCustomer.totalRiskScore);
    logger.log(`found details as : ${JSON.stringify(constituents)}`)
    for(let transact in constituents) {
        let data = constituents[transact];
        let newTransaction = new ClientTranasctionSchema({
            cif: newCustomer.cif,
            portfolioId: newCustomer.portfolioId,
            AssetType: data.type,
            ticker: data.ticker,
            BuySell: 'B',
            unitPrice: data.price,
            numberOfUnits: data.quantity,
            amount: parseInt(data.quantity) * parseFloat(data.price)
        })

        newTransaction.save(async (err, data) => {
            if (err) {
                res.json(util.errorRespose(res, err));
            }
            logger.log("New Event created-->" + data)
            let response = { eventInfo: data};
            logger.log(JSON.stringify(response))

        })
    }

    res.send('new user created');

})


router.post('/update', async function (req, res) {

    let reqCustomer = req.body;
    if (reqCustomer.cif == undefined) {
        return util.errorRespose(res, "CIF is not defined! Please provide a CIF")
    }
    logger.log("Risk to update-->" + JSON.stringify(reqCustomer))

    await CustomerSchema.findOneAndUpdate(
        { "cif": reqCustomer.cif },//find this
        {
            userId: reqCustomer.userId,
            name: reqCustomer.name,
            portfolioId: reqCustomer.portfolioId,
            age: reqCustomer.age,
            investmentKnowledge: reqCustomer.investmentKnowledge,
            investmentExperience: reqCustomer.investmentExperience,
            expectedReturn: reqCustomer.expectedReturn,
            investmentHorizon: reqCustomer.investmentHorizon,
            reactionToFluctuations: reqCustomer.reactionToFluctuations,
            totalRiskScore: reqCustomer.totalRiskScore,
            riskCategory: reqCustomer.riskCategory,
            initialInvestmentAmount: reqCustomer.initialInvestmentAmount,
            mobileNumber: reqCustomer.mobileNumber
        },
        { upsert: true, 'new': true },//fetch the updated
        async function (err, updatedObject) {
            let response = { customer: updatedObject }
            logger.log("Update Respose-->" + JSON.stringify(response))
            res.json(response);
        })
})



module.exports = router;