var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var env = require('../env');
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

module.exports = router;
