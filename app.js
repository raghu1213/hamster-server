var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var env = require('./env.js');
var mongoose = require('mongoose');

var index = require('./routes/index');
var stock = require('./routes/stock');
var customer = require('./routes/customer');
var test = require('./routes/test');
var portfolio = require('./routes/portfolio');



var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', index);
app.use('/stock', stock);
app.use('/customer', customer);
app.use('/test', test);
app.use('/portfolio', portfolio);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

connectMongo();

function connectMongo() {
  'use strict'
  let options = { server: { socketOptions: { keepAlive: 1 }, reconnectTries: 3 } }
  mongoose.promise = global.Promise

  mongoose.connection.on("open", (ref) => {
    console.log("Connected to mongo db")
  })
  mongoose.connection.on("error", (err) => {
    console.log("Error connecting mongo db" + err)
  })

  mongoose.connect(env.mongoDB, { useMongoClient: true })

  console.log('Connected to mongo db: ' + env.mongoDB)
}


module.exports = app;
