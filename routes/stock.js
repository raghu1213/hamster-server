var express = require('express');
var router = express.Router();
var stockMasterSchema = require('../src/db/mongo/stockMasterSchema');
var stockDetailsSchema = require('../src/db/mongo/stockDetailSchema');

router.get('/master', async function (req, res) {
    let result = await stockMasterSchema.find().exec();
    res.json(result);
})

router.get('/detail', async function (req, res) {
    let result = await stockDetailsSchema.find().exec();
    res.json(result);
})

router.get('/master/:tickers', async (req, res) => {
    let tickers = req.params.tickers.split(",")
    let result = await stockMasterSchema.find().byTickers(tickers).exec();
    res.json(result);
})

router.get('/detail/:tickers', async (req, res) => {
    let tickers = req.params.tickers.split(",")
    let result = await stockDetailsSchema.find().byTickers(tickers).exec();
    res.json(result);
})

module.exports = router;