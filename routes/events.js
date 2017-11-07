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
    if(req.body === undefined ){
        logger.log(`invalid request recieved`)
    }
    let status = req.body.text.toLowerCase()
    let clientMobile = req.body.msisdn

    if(status === 'no') {
        res.send('recieved')
        return
    }

    let txnDetails = status.split(' ')
    for(let i = 0;i<= txnDetails.length / 3; i++) {
        let buySell = txnDetails[0].toUpperCase().charAt(0)
        let ticker = txnDetails[1].toUpperCase()
        let units = parseInt(txnDetails[2])
        logger.log(`executing transaction BuySell: ${buySell}, ticker: ${ticker}, units: ${units}`)
        let clientTransactions = await ClientTransactionSchema.find().pendingTransactionByMobileNumberTickerAndBuySell(clientMobile, ticker, buySell).exec()
        logger.log(`number of matching transactions found for customer : ${clientTransactions.length}`)
        let matchingTrans = clientTransactions[0]
        await ClientTransactionSchema.findOneAndUpdate(
            {"cif": matchingTrans.cif, portfolioId: matchingTrans.portfolioId},//find this
            {
                cif: matchingTrans.cif,
                portfolioId: matchingTrans.portfolioId,
                AssetType: matchingTrans.AssetType,
                ticker: matchingTrans.ticker,
                BuySell: matchingTrans.BuySell,
                unitPrice: matchingTrans.unitPrice,
                numberOfUnits: units,
                txnStatus:'completed',
                amount: parseInt(units) * parseFloat(matchingTrans.unitPrice)
            },
            {upsert: true, 'new': true},//fetch the updated
            async function (err, updatedObject) {
                let response = {customer: updatedObject}
                logger.log("Update Respose-->" + JSON.stringify(response))

            })
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
    let stockDetails = await StockTimeSeries.find().byDateRange(processingDateMinusOne, processingDate).exec()
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

        let customerDetails = await CustomerSchema.find().byCustomerAndPortfolio(eventDetail.cif, eventDetail.portfolioId).exec()
        console.log('customer found')
        logger.log(`processing events for event ${event}`)
        await eventProcesssor.processEvent(eventDetail, clientInitialPositionInfo, clientTransactions, customerDetails, stockDetails)
    }

    res.json('events processed');
})

router.post('/process/:cif/:portfolioid', async function (req, res) {
    let dateJson = req.body
    console.log('process')
    console.log(`${req.baseUrl} processing date: ${JSON.stringify(dateJson)}`)
    let processingDateMinusOne = new Date(parseInt(dateJson.year), parseInt(dateJson.month), parseInt(dateJson.day) -1 )
    let processingDate = new Date(parseInt(dateJson.year), parseInt(dateJson.month), parseInt(dateJson.day) )
    let events = await EventsSchema.find().byCustomerDetails(req.params.cif, req.params.portfolioid) .exec();
    let eventProcesssor = new EventProcessor()
    let jsonEvents = JSON.parse(JSON.stringify(events))
    let stockDetails = await StockTimeSeries.find().byDateRange(processingDateMinusOne, processingDate).exec()
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

        let customerDetails = await CustomerSchema.find().byCustomerAndPortfolio(eventDetail.cif, eventDetail.portfolioId).exec()
        console.log('customer found')
        logger.log(`processing events for event ${event}`)
        await eventProcesssor.processEvent(eventDetail, clientInitialPositionInfo, clientTransactions, customerDetails, stockDetails)
    }

    res.json('events processed');
})






module.exports = router;