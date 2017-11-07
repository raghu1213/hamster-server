var express = require('express');
var router = express.Router();
var ClientTranasctionSchema = require('../src/db/mongo/clientTransactionSchema');
import Utils from './utils'
import Logger from '../src/utils/logging'

let util = new Utils();
let logger = new Logger();

router.get('/all', async function (req, res) {
    let result = await ClientTranasctionSchema.find().exec();
    res.json(result);
})

router.get('/:cif/:portfolioid', async function (req, res) {
    console.log(`${req.baseURI} => cif = ${req.params.cif}, portfolioid = ${req.params.portfolioid}`)
    let result = await ClientTranasctionSchema.find().byCustomerAndPortfolio(req.params.cif, req.params.portfolioid).exec();
    res.json(result);
})

router.get('/position/:cif/:portfolioid', async function (req, res) {
    console.log(`${req.baseURI} => cif = ${req.params.cif}, portfolioid = ${req.params.portfolioid}`)
    let result = await ClientTranasctionSchema.find().byCustomerAndPortfolio(req.params.cif, req.params.portfolioid).exec();
    var position = 0;
    let jsonResult = JSON.parse(JSON.stringify(result))
    for (let trans in jsonResult) {
        let jsonData = jsonResult[trans];
        /*for(let key in jsonData) {
            if (key === 'amount') {
                position += parseFloat(jsonData[data]['Amount']);
            }
        }*/
        if(jsonData['amount'] === undefined) {
            continue
        }
        position += jsonData['amount']
    }
    res.json({position: position});
})

router.get('/:cif/:portfolioid/:txndate', async function (req, res) {
    console.log(`${req.baseURI} => cif = ${req.params.cif}, portfolioid = ${req.params.portfolioid}, txnDate = ${req.params.txndate}`)
    let result = await ClientTranasctionSchema.find().byDateForCustomer(req.params.cif, req.params.portfolioid, req.params.txndate).exec();
    res.json(result);
})

router.get('/:txndate', async function (req, res) {
    console.log(`${req.uri} => txndate = ${req.params.txndate}`)
    let result = await ClientTranasctionSchema.find().byDateForCustomer(req.params.txndate).exec();
    res.json(result);
})

router.post('/insert', async (req, res) => {
    let requestJson = req.body;
    console.log(`${req.baseUrl} => request = ${JSON.stringify(requestJson)}`)



    let newTransaction = new ClientTranasctionSchema({
        cif: requestJson.cif,
        portfolioId: requestJson.portfolioId,
        AssetType: requestJson.AssetType,
        ticker: requestJson.ticker,
        BuySell: requestJson.BuySell,
        unitPrice: requestJson.unitPrice,
        numberOfUnits: requestJson.numberOfUnits,
        amount: parseInt(requestJson.numberOfUnits) * parseFloat(requestJson.unitPrice)
    })

    newTransaction.save(async (err, data) => {
        if (err) {
            return util.errorRespose(res, err);
        }
        logger.log("New Event created-->" + data)
        let response = { eventInfo: data};
        logger.log(JSON.stringify(response))
        res.send(response);
    })

})


module.exports = router;