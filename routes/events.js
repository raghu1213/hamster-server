var express = require('express');
var router = express.Router();
var EventsSchema = require('../src/db/mongo/eventsSchema');
var ClientTransactionSchema = require('../src/db/mongo/clientTransactionSchema');
var StockTimeSeries = require('../src/db/mongo/stockTimeSeries');
import EventProcessor from '../src/processor/eventprocessor';
import CustomerSchema from '../src/db/mongo/customerSchema';

import Utils from './utils'
import Logger from '../src/utils/logging'

let util = new Utils();
let logger = new Logger();

router.get('/all', async function (req, res) {
    let result = await EventsSchema.find().exec();
    res.json(result);
})

router.get('/:cif/:portfolioid', async function (req, res) {
    console.log(`${req.uri} => cif = ${req.params.cif}, portfolioid = ${req.params.portfolioid}`)
    let result = await EventsSchema.find().byCustomerDetails(req.params.cif, req.params.portfolioid).exec();
    res.json(result);
})

router.post('/insert', async (req, res) => {
    let requestJson = req.body;
    console.log(`${req.baseUrl} => request = ${JSON.stringify(requestJson)}`)

    let existing = await EventsSchema.find().byCustomerDetails(requestJson.cif, requestJson.portfolioId).exec()
    if (existing != undefined && existing.length > 0) {
        logger.log(JSON.stringify(existing))
        return util.errorRespose(res, "events already exists!");
    }

    let newEvent = new EventsSchema({
        cif: requestJson.cif,
        portfolioId: requestJson.portfolioId,
        portfolioAbove: requestJson.portfolioAbove,
        portfolioBelow: requestJson.portfolioBelow,
        instrumentAbove: requestJson.instrumentAbove,
        instrumentBelow: requestJson.instrumentBelow
    })

    newEvent.save(async (err, data) => {
        if (err) {
            return util.errorRespose(res, err);
        }
        logger.log("New Event created-->" + data)
        let response = { eventInfo: data};
        logger.log(JSON.stringify(response))
        res.send(response);
    })

})

router.post('/update', async function (req, res) {

    let requestJson = req.body;
    if (requestJson.cif == undefined || requestJson.portfolioId) {
        return util.errorRespose(res, "CIF/PortfolioId is not defined! Please provide valid CIF/PortfolioId")
    }
    logger.log("Event to update-->" + JSON.stringify(requestJson))

    await CustomerSchema.findOneAndUpdate(
        { "cif": requestJson.cif, "portfolioId": requestJson.portfolioId },//find this
        {
            cif: requestJson.cif,
            portfolioId: requestJson.portfolioId,
            portfolioAbove: requestJson.portfolioAbove,
            portfolioBelow: requestJson.portfolioBelow,
            instrumentAbove: requestJson.instrumentAbove,
            instrumentBelow: requestJson.instrumentBelow
        },
        { upsert: true, 'new': true },//fetch the updated
        async function (err, updatedObject) {
            let response = { eventInfo: updatedObject}
            logger.log("Update Respose-->" + JSON.stringify(response))
            res.json(response);
        })
})

router.post('/confirmation', async function(req, res){
    logger.log(`recieved callback from nexmo : ${JSON.stringify(req.body)}`)
    let status = req.body.text.toLowerCase()
    let clientMobile = req.body.msisdn
    if(status === 'yes') {
        executeTransaction('1034', '1', 'B', '174', 'stock', 'AAPL', 100)
        executeTransaction('1034', '1', 'S', '100', 'stock', 'ACN', 600)
    }
    res.send('recieved')
})

router.post('/process', async function (req, res) {
    let dateJson = req.body
    console.log('process')
    console.log(`${req.baseUrl} processing date: ${JSON.stringify(dateJson)}`)
    let processingDateMinusOne = new Date(parseInt(dateJson.year), parseInt(dateJson.month), parseInt(dateJson.day) -1 )
    let processingDate = new Date(parseInt(dateJson.year), parseInt(dateJson.month), parseInt(dateJson.day) )
    let events = await EventsSchema.find().exec();
    let eventProcesssor = new EventProcessor()
    let jsonEvents = JSON.parse(JSON.stringify(events))
    for (let event in jsonEvents) {
        let eventDetail = jsonEvents[event];
        let clientTransactions = await ClientTransactionSchema.find().byCustomerAndPortfolio(eventDetail.cif, eventDetail.portfolioId).exec()

        let clientInitialPositionInfo = 0.0
        let tickers = ''
        for(let trans in clientTransactions) {
            let data = clientTransactions[trans]
            if(tickers.length === 0) {
                tickers += data.ticker
            }
            else {
                tickers += ',' + data.ticker
            }
            if(data.amount === undefined || data.amount === null || isNaN(data.amount)) {
                continue
            }

            clientInitialPositionInfo += parseFloat(data.amount)
        }
        console.log('clientInitialPositionInfo : ' + clientInitialPositionInfo + 'Tickers + ' + tickers)
        if(clientInitialPositionInfo === 0 || isNaN(clientInitialPositionInfo)) {
            continue
        }

        let customerDetails = await CustomerSchema.find().byCustomerAndPortfolio(event.cif, event.portfolioId).exec()
        console.log('customer found')
        let stockDetailsTest = await StockTimeSeries.find().byTickers(tickers).exec()
        let stockDetails = await StockTimeSeries.find().byDateRangeAndTickers('AAPL', processingDateMinusOne, processingDate).exec()
        logger.log(`processing events for event ${event}`)
        await eventProcesssor.processEvent(eventDetail, clientInitialPositionInfo, clientTransactions, customerDetails, stockDetails)
    }

    res.json('events processed');
})


 function executeTransaction(cif, portfolioId, isBuy, closePrice, assetType, ticker, units){
    let buySell = 'S'
    if(isBuy) {
        buySell = 'B'
    }

    let transaction = new ClientTransactionSchema({
        cif: cif,
        portfolioId: portfolioId,
        AssetType: assetType,
        ticker: ticker,
        BuySell: buySell,
        unitPrice: closePrice,
        numberOfUnits: units,
        amount: parseInt(units) * parseFloat(closePrice)
    })

    transaction.save(async (err, data) => {
        if (err) {
            logger.log(`unable to execute client transaction cif: ${cif}, portfolio: ${portfolioId}`)
            return
        }
        logger.log("New Transaction executed-->" + data)
        logger.log(JSON.stringify(data))
    })
}



module.exports = router;