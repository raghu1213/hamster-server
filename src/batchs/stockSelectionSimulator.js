require('babel-register')
require('babel-polyfill')
var mongoose = require('mongoose')
import StockDetails from '../db/mongo/stockDetailSchema'
import MutualFundDetails from '../db/mongo/mutualFundDetailsSchema'
import PortfolioPredict from '../predictor/portfolio'
const RISK_SCORE = 25;
const LARGE = .5;
const MID = .3;
const SMALL = .2;
const INVESTMENT_DIVERSIFICATION = [.4, .3, .2, .1];
const DECREMENT_FACTOR = .2

import * as Helpers from '../utils/helper'
import StockTimeSeries from '../db/mongo/stockTimeSeries';
import Logger from '../utils/logging'

var logger = new Logger();
export default class StockComposition {
    constructor() {

    }
    async _getStocks(riskCategory, marketCap) {
        let stocks = StockDetails.find({ riskProfileBeta: riskCategory, marketCapCategory: marketCap }).sort("-roe").exec();
        return stocks;
    }

    async _getDistinctRank(fieldName, mongoSchemaList) {
        let distinctRank = await mongoSchemaList.distinct(fieldName).exec();
        return distinctRank;
    }

    async  _getMutualFunds(riskCategory) {
        let mutualFunds = MutualFundDetails.find({ riskProfileBeta: riskCategory }).exec();
        return mutualFunds;
    }

    async  pickupStocks(investmentAmount, riskScore) {
        let results = [];
        try {
            let riskCategory = Helpers.getRiskCategory(riskScore);
            logger.log("Investment-->" + investmentAmount + ": Risk Score-->" + riskScore)
            let totalLargeCapAmount = investmentAmount * LARGE;
            let totalMidCapAmount = investmentAmount * MID;
            let totalSmallCapAmount = investmentAmount * SMALL
            logger.log("Large cap amount --> " + totalLargeCapAmount + "Mid cap amount --> " + totalMidCapAmount + "Small cap amount --> " + totalSmallCapAmount)
            let largeCapStocks = await this._getStocks(riskCategory, "LARGE")
            let midCapStocks = await this._getStocks(riskCategory, "MID")
            let smallCapStocks = await this._getStocks(riskCategory, "SMALL")


            let stockNumber = 0;
            let amountInvestedSoFar = 0;
            for (let i = 0; i < largeCapStocks.length; i++) {
                let stock = largeCapStocks[i];
                //let stockPrice = await StockTimeSeries.find({ ticker: stock.ticker }).sort('-date').limit(1).exec();
                let amountToInvest = totalLargeCapAmount * INVESTMENT_DIVERSIFICATION[stockNumber]
                let stockPrice = Math.floor((Math.random() * 5000) + 1);
                if (stockPrice > amountToInvest) {
                    continue;
                }

                let stockBought = Math.floor(amountToInvest / stockPrice);
                let investedAmount = stockBought * stockPrice
                amountInvestedSoFar += investedAmount
                logger.log("Ticker:" + stock.ticker + ":stock price-->" + stockPrice + ":Amout allocated:" + investedAmount + ": Bought-->" + stockBought)
                let obj = { ticker: stock.ticker, quantity: stockBought, totalAmount: investedAmount }
                results.push(obj);
                stockNumber++
                if (stockNumber >= 4) {
                    break;
                }
            }


            stockNumber = 0;


            logger.log(`Large Cap : To be invested ${totalLargeCapAmount}; Invested ${amountInvestedSoFar}`)
            totalMidCapAmount = totalMidCapAmount + totalLargeCapAmount - amountInvestedSoFar
            amountInvestedSoFar = 0
            for (let i = 0; i < midCapStocks.length; i++) {
                let stock = midCapStocks[i];
                //let stockPrice = await StockTimeSeries.find({ ticker: stock.ticker }).sort('-date').limit(1).exec();
                let amountToInvest = totalMidCapAmount * INVESTMENT_DIVERSIFICATION[stockNumber]
                let stockPrice = Math.floor((Math.random() * 5000) + 1);
                if (stockPrice > amountToInvest) {
                    continue;
                }

                let stockBought = Math.floor(amountToInvest / stockPrice);
                let investedAmount = stockBought * stockPrice
                amountInvestedSoFar += investedAmount
                logger.log("Ticker:" + stock.ticker + ":stock price-->" + stockPrice + ":Amout allocated:" + investedAmount + ": Bought-->" + stockBought)
                let obj = { ticker: stock.ticker, quantity: stockBought, totalAmount: investedAmount }
                results.push(obj);
                stockNumber++
                if (stockNumber >= 4) {
                    break;
                }
            }

            stockNumber = 0;

            totalSmallCapAmount = totalSmallCapAmount + totalMidCapAmount - amountInvestedSoFar
            logger.log(`Mid Cap : To be invested ${totalMidCapAmount}; Invested ${amountInvestedSoFar}`)

            amountInvestedSoFar = 0
            for (let i = 0; i < smallCapStocks.length; i++) {
                let stock = smallCapStocks[i];
                //let stockPrice = await StockTimeSeries.find({ ticker: stock.ticker }).sort('-date').limit(1).exec();
                let amountToInvest = totalSmallCapAmount * INVESTMENT_DIVERSIFICATION[stockNumber]
                let stockPrice = Math.floor((Math.random() * 5000) + 1);
                if (stockPrice > amountToInvest) {
                    continue;
                }

                let stockBought = Math.floor(amountToInvest / stockPrice);
                let investedAmount = stockBought * stockPrice
                amountInvestedSoFar += investedAmount
                logger.log("Ticker:" + stock.ticker + ":stock price-->" + stockPrice + ":Amout allocated:" + investedAmount + ": Bought-->" + stockBought)
                let obj = { ticker: stock.ticker, quantity: stockBought, totalAmount: investedAmount }
                results.push(obj);
                stockNumber++
                if (stockNumber >= 4) {
                    break;
                }
            }

            logger.log(`Small Cap : To be invested ${totalSmallCapAmount}; Invested ${amountInvestedSoFar}`)

            console.log(`remaining amount to be adjusted in cash ${totalSmallCapAmount - amountInvestedSoFar}`)

            return results;
        }
        catch (err) {
            console.log(err.message);
        }

    }
}







