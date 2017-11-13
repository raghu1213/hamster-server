var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var env = require('../env');
import eodBatch from '../src/batchs/insertEodTimeSeries';
import StockTimeSeries from '../src/db/mongo/stockTimeSeries';

/* GET home page. */
router.get('/mongodb', function (req, res, next) {

    mongoose.connection.on("open", (ref) => {
        res.send("Connected to mongo server");
    })
    mongoose.connection.on("error", (err) => {
        res.send("Error connecting mongo db " + err)
    })
    mongoose.connect(env.mongoDB, { useMongoClient: true })
});

router.post('/insertEod/:date', async function (req, res) {
    await eodBatch(req.params.date);
    res.send("Success");
});

router.post('/insertsingle', async function (req, res) {
  let data = req.body;
  if (data === undefined || data === '') { res.send({ message: "Empty body" }); }
  let stockTimeSeries = new StockTimeSeries({
    ticker: data.ticker,
    date: data.date,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
    volume: data.volume,
    dividend: data.dividend,
    split: data.split,
    adj_Open: data.adj_Open,
    adj_High: data.adj_High,
    adj_Low: data.adj_Low,
    adj_Close: data.adj_Close,
    adj_Volume: data.adj_Volume
  });

  stockTimeSeries.save(async (err, updatedData) => {
    if (err) {
      res.json(util.errorRespose(res, err));
    }
    res.json(updatedData);
  });
});

module.exports = router;
