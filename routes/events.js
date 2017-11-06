var express = require('express');
var router = express.Router();
var EventsSchema = require('../src/db/mongo/eventsSchema');
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


module.exports = router;