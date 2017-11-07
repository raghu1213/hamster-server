
var mongoose = require('mongoose')
import StockDetails from '../db/mongo/stockDetailSchema'
import MutualFundDetails from '../db/mongo/mutualFundDetailsSchema'
import BondDetails from '../db/mongo/bondDetailsSchema'
import CustomerDetails from '../db/mongo/customerSchema'
import PortfolioPredict from './portfolio'
const RISK_SCORE = 25;
const LARGE = .5;
const MID = .3;
const SMALL = .2;
const INVESTMENT_DIVERSIFICATION = [.4, .3, .2, .1];
const DECREMENT_FACTOR = .2

import * as Helpers from '../utils/helper'
import StockTimeSeries from '../db/mongo/stockTimeSeries';
import MFData from '../db/mongo/mutualFundDetailsSchema';
import Logger from '../utils/logging'


var logger = new Logger();
export default class StockComposition {
    constructor() {
        this.Results = [];
    }


    async picupBond(investmentAmout, riskScore, cif) {

        let bonds;
        if (cif != undefined && cif != null) {
            let customer = await CustomerDetails.findOne({ cif: cif }).exec();
            let horizon = customer.investmentHorizon.split("-");
            let min = horizon[0]
            let max = horizon[1]
            bonds = BondDetails.find({ 'maturityYearsFromToday': { $gte: min, $lte: max } }).sort('-ytm');

        }
        else {
            bonds = BondDetails.find().sort('-ytm');
        }
        let amountInvestedSoFar = await this.buyAndDistribute(bonds, investmentAmout, 'BOND');
        logger.log(`BOND To be invested ${investmentAmout}; Invested ${amountInvestedSoFar}`)

    }


    async pickupMutualFunds(investmentAmount, riskScore) {
        let riskCategory = Helpers.getRiskCategory(riskScore)
        logger.log("Mutual Fund Investment-->" + investmentAmount + ": Risk Score-->" + riskScore)
        let mutualFunds = await this._getMutualFunds(riskCategory)
        let amountInvestedSoFar = await this.buyAndDistribute(mutualFunds, investmentAmount, 'MF');
        logger.log(`Mutual Fund: To be invested ${investmentAmount}; Invested ${amountInvestedSoFar}`)

    }

    async  pickupStocks(investmentAmount, riskScore) {

        let riskCategory = Helpers.getRiskCategory(riskScore);
        logger.log("Investment-->" + investmentAmount + ": Risk Score-->" + riskScore)
        let totalLargeCapAmount = investmentAmount * LARGE;
        let totalMidCapAmount = investmentAmount * MID;
        let totalSmallCapAmount = investmentAmount * SMALL
        logger.log("Large cap amount --> " + totalLargeCapAmount + "Mid cap amount --> " + totalMidCapAmount + "Small cap amount --> " + totalSmallCapAmount)

        let largeCapStocks = await this._getStocks(riskCategory, "LARGE")
        let amountInvestedSoFar = await this.buyAndDistribute(largeCapStocks, totalLargeCapAmount, 'STOCK');
        logger.log(`Large Cap : To be invested ${totalLargeCapAmount}; Invested ${amountInvestedSoFar}`)
        totalMidCapAmount = totalMidCapAmount + totalLargeCapAmount - amountInvestedSoFar

        let midCapStocks = await this._getStocks(riskCategory, "MID", 'STOCK')
        await this.buyAndDistribute(midCapStocks, totalMidCapAmount);
        totalSmallCapAmount = totalSmallCapAmount + totalMidCapAmount - amountInvestedSoFar
        logger.log(`Mid Cap : To be invested ${totalMidCapAmount}; Invested ${amountInvestedSoFar}`)

        let smallCapStocks = await this._getStocks(riskCategory, "SMALL", 'STOCK')
        await this.buyAndDistribute(smallCapStocks, totalSmallCapAmount);
        logger.log(`Small Cap : To be invested ${totalSmallCapAmount}; Invested ${amountInvestedSoFar}`)

        console.log(`remaining amount to be adjusted in cash ${totalSmallCapAmount - amountInvestedSoFar}`)
    }



    async distribute(amount, riskScore) {

        let portfolioPredict = new PortfolioPredict()
        let suggestedPortfolio = await portfolioPredict.getRiskAdjustedPortfolio(riskScore);
        let stockAmount = amount * (suggestedPortfolio.stockPercent / 100);
        let totalMFPercent = suggestedPortfolio.mfFIPercent + suggestedPortfolio.mfEqPercent + suggestedPortfolio.mfMixedPercent;
        let mfAmount = amount * (totalMFPercent / 100);
        let totalBondAmount = amount * (suggestedPortfolio.bondPercent / 100);
        let totalEtfAmount = amount * (suggestedPortfolio.etfPercent / 100);
        let totalCashAmount = amount * (suggestedPortfolio.cash / 100);
        logger.log(`Stock:${stockAmount} ETF:${totalEtfAmount} MF amount:${mfAmount} Bonds:${totalBondAmount} Cash:${totalCashAmount}`);
        await this.pickupStocks(stockAmount, riskScore)
        await this.pickupMutualFunds(mfAmount, riskScore)

        let obj = { ticker: "CASH", quantity: suggestedPortfolio.cash, totalAmount: totalCashAmount, type: "CASH", name: "CASH" }
        this.Results.push(obj);
        return this.Results;
    }
    async _getStocks(riskCategory, marketCap) {
        let stocks = StockDetails.find({ riskProfileBeta: riskCategory, marketCapCategory: marketCap }).sort("-roe").exec();
        return stocks;
    }

    async  _getMutualFunds(riskCategory) {
        let mutualFunds = MutualFundDetails.find({ riskProfile: riskCategory }).sort('-ytd5Ypercent').exec();
        return mutualFunds;
    }



    async buyAndDistribute(listOfStocks, totalAmountToInvest, type) {
        let stockNumber = 0;
        let amountInvestedSoFar = 0;
        for (let i = 0; i < listOfStocks.length; i++) {
            let stock = listOfStocks[i]

            let stockPrice = 0;
            if (type === 'STOCK') {
                let searchResult = await StockTimeSeries.find({ ticker: stock.ticker }).sort('-date').limit(1).exec();
                //logger.log(JSON.stringify(stockEodData))
                if (searchResult.length === 1) {
                    stockPrice = searchResult[0].close;
                    logger.log('Stock price for ' + stock.ticker + ':' + stockPrice)
                }
            }
            else if (type === 'MF') {
                stockPrice = stock.nav;
            }
            if (stockPrice === 0) continue;
            let amountToInvest = totalAmountToInvest * INVESTMENT_DIVERSIFICATION[stockNumber]
            //let stockPrice = Math.floor((Math.random() * 5000) + 1);
            if (stockPrice > amountToInvest) {
                continue;
            }

            let stockBought = Math.floor(amountToInvest / stockPrice);
            let investedAmount = stockBought * stockPrice
            amountInvestedSoFar += investedAmount
            logger.log("Ticker:" + stock.ticker + ":stock price-->" + stockPrice + ":Amout allocated:" + investedAmount + ": Bought-->" + stockBought)
            let obj = { ticker: stock.ticker, quantity: stockBought, totalAmount: investedAmount, type: type, name: stock.name }
            this.Results.push(obj);
            stockNumber++
            if (stockNumber >= 4) {
                break;
            }

        }
        return amountInvestedSoFar;
    }
}











