//var PwSchema = require('../db/mongo/pwSchema')
import Logger from '../utils/logging'
import * as Helpers from '../utils/helper'
<<<<<<< HEAD
import PortfolioWeight from '../batchs/pw'
=======
var ClientTranasctionSchema = require('../db/mongo/clientTransactionSchema');
var StockTimeSeries = require('../db/mongo/stockTimeSeries')

>>>>>>> eb0ad23d6c0bf9d1982a43448a706cfad9913f56

let logger = new Logger();

export default class Portfolio {
    constructor() {

    }

    getMedian(riskCategory) {
        if (riskCategory === 'conservative')
            return 7
        else if (riskCategory === 'balanced') {
            return 26
        }
        else {
            return 43
        }
    }

    async getPortfolioPositionAsOfToday(cif, portfolioId, prevDate, date) {
        var dict = {};
        let transactions = await ClientTranasctionSchema.find().byCustomerAndPortfolio(cif, portfolioId).sort({"date": -1}).exec();
        let stockDetails = await StockTimeSeries.find().byDateRange(prevDate, date).sort({"date": -1}).exec()
        for(let trans in transactions) {
            let data = transactions[trans]
            let units = data.numberOfUnits
            if(data.BuySell === 'S') {
                units = -units
            }
            if(dict[data.ticker] === undefined || dict[data.ticker] === null) {
                dict[data.ticker] = units
            }
            else {
                dict[data.ticker] += units
            }
        }

        let currentPosition = 0
        for(let key in dict){
            let eodPrice = this._getEODPriceForTicker(key, stockDetails)
            currentPosition += parseInt(dict[key]) * parseFloat(eodPrice)
        }
        return currentPosition
    }

    async getRealizedGain(cif, portfolioId) {
        var dict = {};
        let transactions = await ClientTranasctionSchema.find().byCustomerAndPortfolio(cif, portfolioId).sort({"date": -1}).exec();
        for(let trans in transactions) {
            let data = transactions[trans]
            if(data.BuySell === 'B') {
                continue
            }
            if(dict[data.ticker] === undefined || dict[data.ticker] === null) {
                dict[data.ticker] = parseInt(data.numberOfUnits) * parseFloat(data.unitPrice)
            }
            else {
                dict[data.ticker] += parseInt(data.numberOfUnits) * parseFloat(data.unitPrice)
            }
        }

        let realizedGain = 0
        for(let key in dict){
            realizedGain += dict[key]
        }
        return realizedGain
    }

    async getRiskAdjustedPortfolio(riskScore) {
        try {
            let riskCategory = Helpers.getRiskCategory(riskScore)

            let median = this.getMedian(riskCategory);
            let distance = 0
            //var portfolioWeight = await PwSchema.findOne({ 'profile': riskCategory }).exec();
            var portfolioWeight;
            for (let pw of PortfolioWeight) {
                if (pw.profile === riskCategory)
                {
                    portfolioWeight = pw;
                    break;
                }    
            }


            distance = riskScore - median

            portfolioWeight.stockPercent = Math.round(portfolioWeight.stockPercent + (distance * 0.8));
            portfolioWeight.etfPercent = Math.round(portfolioWeight.etfPercent + (distance * 0.2));

            portfolioWeight.bondPercent = Math.round(portfolioWeight.bondPercent + (distance * -0.8))
            portfolioWeight.cash = 100 - (portfolioWeight.mfPercent + portfolioWeight.stockPercent + portfolioWeight.etfPercent + portfolioWeight.bondPercent)//Math.round(portfolioWeight.cash + (distance * -0.2));
            //fixed income mutual fund
        }
        catch (err) {
            logger.log(err.message);
            return {};
        }
        return portfolioWeight;
    }

    _getEODPriceForTicker(ticker, stockEODData){
        for(let stockIndex in stockEODData) {
            if(stockEODData[stockIndex].ticker.toLowerCase() === ticker.toLowerCase()){
                return parseFloat(stockEODData[stockIndex].close)
            }
        }
        return -1
    }
}