
var mongoose = require('mongoose')
import StockDetails from '../db/mongo/stockDetailSchema'
import MutualFundDetails from '../db/mongo/mutualFundDetailsSchema'
import BondDetails from '../db/mongo/bondDetailsSchema'
import EtfDetails from '../db/mongo/etfSchema'

import CustomerDetails from '../db/mongo/customerSchema'
import PortfolioPredict from './portfolio'
const RISK_SCORE = 25;
const LARGE = .5;
const MID = .3;
const SMALL = .2;
const INVESTMENT_DIVERSIFICATION = [.4, .3, .2, .1];
const DECREMENT_FACTOR = .2
const MIN_AMOUT_FOR_INVESTMENT = 1000;

import * as Helpers from '../utils/helper'
import StockTimeSeries from '../db/mongo/stockTimeSeries';
import MFData from '../db/mongo/mutualFundDetailsSchema';
import Logger from '../utils/logging'
var roundingAmount = 0;

var logger = new Logger();
var _stocks;

export default class StockComposition {
    constructor() {
        this.Results = [];
    }

    async distribute(amount, riskScore, cif) {

        let portfolioPredict = new PortfolioPredict()
        let suggestedPortfolio = await portfolioPredict.getRiskAdjustedPortfolio(riskScore);

        logger.log("Suggested Portfolio -->" + JSON.stringify(suggestedPortfolio))

        let totalStockAmount = amount * (suggestedPortfolio.stockPercent / 100);
        let totalMfAmount = amount * (suggestedPortfolio.mfPercent / 100);
        let totalBondAmount = amount * (suggestedPortfolio.bondPercent / 100);
        let totalEtfAmount = amount * (suggestedPortfolio.etfPercent / 100);
        let totalCashAmount = amount * (suggestedPortfolio.cash / 100);
        logger.log(`Stock:${totalStockAmount} ETF:${totalEtfAmount} MF amount:${totalMfAmount} Bonds:${totalBondAmount} Cash:${totalCashAmount}`);
        await this.pickupStocks(totalStockAmount, riskScore)
        await this.pickupMutualFunds(totalMfAmount, riskScore)
        await this.pickupBond(totalBondAmount, riskScore, cif)
        await this.pickupEtf(totalEtfAmount, riskScore, cif)

        if (roundingAmount > totalCashAmount) {
            let newAmount = roundingAmount;
            roundingAmount = 0;
            let resultsTickers = this.Results.map((item) => item.ticker);
            let newFilteredStocks = this._stocks.filter((stock) => (!resultsTickers.includes(stock.ticker)));
            await this.buyAndDistribute(newFilteredStocks, newAmount, 'STOCK');
        }



        console.log('Processing CASH')
        logger.log("Remaining amount after rounding " + roundingAmount);

        //let adjustedAmount = Math.round((amount - amountInvestedSoFar));
        let totalCash = totalCashAmount + roundingAmount;
        let obj = { ticker: "FD", quantity: 1, totalAmount: totalCash, price: totalCash, type: "CASH", name: "Money Market" }
        this.Results.push(obj);

        let investedAmount = 0;
        // for (let result of this.Results) {
        //     investedAmount += result.totalAmount;
        // }
        // logger.log("Amount invested-->" + investedAmount);

        // logger.log("Non Cash Investement = " + amountInvestedSoFar + ":Cash Investment=" + totalCashAmount + adjustedAmount)
        return this.Results;
    }
    async pickupEtf(investmentAmout, riskScore, cif) {
        let etfs = await EtfDetails.find().sort({ "ytd3": -1 }).exec();
        console.log('Processing ETF')
        await this.buyAndDistribute(etfs, investmentAmout, 'ETF');
        //logger.log(`ETF To be invested ${investmentAmout}; Invested ${amountInvestedSoFar}`)
        // return amountInvestedSoFar;
    }

    async pickupBond(investmentAmount, riskScore, cif) {
        let bonds;

        bonds = await BondDetails.find().sort({ 'ytm': -1 }).limit(100).exec();

        console.log('Processing BONDS')
        await this.buyAndDistribute(bonds, investmentAmount, 'BOND');
    }

    async pickupMutualFunds(investmentAmount, riskScore) {
        let riskCategory = Helpers.getRiskCategory(riskScore)
        logger.log("Mutual Fund Investment-->" + investmentAmount + ": Risk Score-->" + riskScore)
        let mutualFunds = await this._getMutualFunds(riskCategory)
        console.log('Processing MUTUAL FUNDS')
        await this.buyAndDistribute(mutualFunds, investmentAmount, 'MF');

    }

    async  pickupStocks(investmentAmount, riskScore) {
        let riskCategory = Helpers.getRiskCategory(riskScore);
        logger.log("Investment-->" + investmentAmount + ": Risk Score-->" + riskScore)
        let totalLargeCapAmount = investmentAmount * LARGE;
        let totalMidCapAmount = investmentAmount * MID;
        let totalSmallCapAmount = investmentAmount * SMALL
        //logger.log("Large cap amount --> " + totalLargeCapAmount + "Mid cap amount --> " + totalMidCapAmount + "Small cap amount --> " + totalSmallCapAmount)

        let allStocks = await this._getStocks(riskCategory)//, "LARGE")

        let largeCapStocks = allStocks.filter((item) => (item.marketCapCategory === 'LARGE'));
        console.log('Processing stocks: LARGE')
        await this.buyAndDistribute(largeCapStocks, totalLargeCapAmount, 'STOCK');
        //logger.log(`Large Cap : To be invested ${totalLargeCapAmount}; Invested ${amountInvestedSoFar}`)
        totalMidCapAmount = totalMidCapAmount //+ (totalLargeCapAmount - amountInvestedSoFar)

        //let midCapStocks = await this._getStocks(riskCategory, "MID")
        let midCapStocks = allStocks.filter((item) => (item.marketCapCategory === 'MID'));
        console.log('Processing stocks: MID')
        await this.buyAndDistribute(midCapStocks, totalMidCapAmount, 'STOCK');

        totalSmallCapAmount = totalSmallCapAmount //+ (totalMidCapAmount - amountInvestedSoFar)
        // logger.log(`Mid Cap : To be invested ${totalMidCapAmount}; Invested ${amountInvestedSoFar}`)

        //let smallCapStocks = await this._getStocks(riskCategory, "SMALL")
        let smallCapStocks = allStocks.filter((item) => (item.marketCapCategory === 'SMALL'));
        console.log('Processing stocks: SMALL')
        await this.buyAndDistribute(smallCapStocks, totalSmallCapAmount, 'STOCK');
        //logger.log(`Small Cap : To be invested ${totalSmallCapAmount}; Invested ${amountInvestedSoFar}`)
        //roundingAmount += (investmentAmount - amountInvestedSoFar)
        // console.log(`remaining amount to be adjusted in cash ${totalSmallCapAmount - amountInvestedSoFar}`)
        // return amountInvestedSoFar;
        this._stocks = allStocks
    }

    async _getStocks(riskCategory, marketCap) {
        let stocks = StockDetails.find({ riskProfileBeta: riskCategory }).sort({ "stockRankRank": 1 }).exec();
        return stocks;
    }

    async  _getMutualFunds(riskCategory) {
        let mutualFunds = MutualFundDetails.find({ riskProfile: riskCategory }).sort({ "ytd5Ypercent": -1 }).exec();
        return mutualFunds;
    }



    async buyAndDistribute(listOfStocks, totalAmountToInvest, type) {

        if (listOfStocks === undefined) return totalAmountToInvest;
        let skipCount = 30;
        //let stockNumber = 0;
        //let amountInvestedSoFar = 0;
        let passIndex = 0;
        let reamainingAmount = totalAmountToInvest;
        let stocksToVisit = Math.round(listOfStocks.length * .20)
        let length = listOfStocks.length;
        logger.log(`Interation found ${stocksToVisit} - total item count ${length}`)

        for (let i = 0; i < listOfStocks.length; i++) {
            let stock = listOfStocks[i]

            let stockPrice = 0;
            if (type === 'STOCK') {
                let searchResult = await StockTimeSeries.find({ ticker: stock.ticker }).sort({ "date": -1 }).limit(1).exec();
                //logger.log(JSON.stringify(stockEodData))
                if (searchResult.length === 1) {
                    stockPrice = searchResult[0].close;
                    // logger.log('Stock price for ' + stock.ticker + ':' + stockPrice)
                }
            }
            else if (type === 'MF' || type === "ETF") {
                stockPrice = stock.nav;
            }
            else if (type === 'BOND') {
                stockPrice = stock.amount;
            }

            if (stockPrice === 0) continue;
            //let amountToInvest = totalAmountToInvest * INVESTMENT_DIVERSIFICATION[stockNumber]
            let amountToInvest = Math.round(this.findBestFit(listOfStocks.length, passIndex, reamainingAmount, stocksToVisit))
            passIndex++;
            //let stockPrice = Math.floor((Math.random() * 5000) + 1);
            //logger.log("Pass index -->" + passIndex);
            if (stockPrice > amountToInvest) {
                //logger.log("Skipping-->" + stock.ticker + "- stock price:" + stockPrice + "- amount to invest:" + amountToInvest)
                skipCount--;
                if (skipCount <= 0) {
                    break;
                }
                continue;
            }

            let stockBought = Math.floor(amountToInvest / stockPrice);

            let investedInthisPass = Math.round(stockBought * stockPrice);

            // amountInvestedSoFar += investedInthisPass
            reamainingAmount -= investedInthisPass;

            //logger.log("Remaining amount in this pass-->" + reamainingAmount)
            logger.log("Ticker:" + stock.ticker + ":stock price-->" + stockPrice + ":Amout allocated:" + investedInthisPass + ": Bought-->" + stockBought)
            let obj = { ticker: stock.ticker, quantity: stockBought, totalAmount: investedInthisPass, price: stockPrice, type: type, name: stock.name }
            this.Results.push(obj);
            if (reamainingAmount < MIN_AMOUT_FOR_INVESTMENT) {
                break;
            }
        }
        roundingAmount += reamainingAmount;
        logger.log("Added " + reamainingAmount + " to rounding ")
        // return amountInvestedSoFar;
    }
    findBestFit(stockCount, passIndex, amount, stocksToVisit) {
        if (passIndex == stocksToVisit) {
            return amount;
        }
        if (stockCount < 10)
            return amount / totalStockCount;

        if (passIndex >= stocksToVisit)
            return amount;
        return amount * 0.3;
    }

}











