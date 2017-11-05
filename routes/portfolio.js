var express = require('express');
var router = express.Router();
var PortfolioWeightSchema = require('../src/db/mongo/pwSchema');


router.get('/suggest', async function (req, res, next) {
    let result = await PortfolioWeightSchema.find().exec()
    res.json(result);
});

router.get('/suggest/summary', async function (req, res, next) {
    let results = await PortfolioWeightSchema.find().exec()
    let mungedResults = []

    for (let result of results) {
        let mungedResult = {
            profile: result.profile,
            stock: result.stockPercent + result.etfPercent + result.mfEqPercent,
            fixedIncome: result.bondPercent + result.mfFIPercent,
            cash: result.cash,
            others: result.mfMixedPercent
        }
        mungedResults.push(mungedResult)
    }
    res.json(mungedResults);
})

module.exports = router;
