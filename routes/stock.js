var express = require('express');
var router = express.Router();
var stockMasterSchema = require('../src/db/mongo/stockMasterSchema');

router.get('/all', async function (req, res) {
    let result = await stockMasterSchema.find().exec();
    res.json(result);
})

module.exports = router;