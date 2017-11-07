var PwSchema = require('../db/mongo/pwSchema')
import Logger from '../utils/logging'
import * as Helpers from '../utils/helper'

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

    async getRiskAdjustedPortfolio(riskScore) {
        try {
            let riskCategory = Helpers.getRiskCategory(riskScore)

            let median = this.getMedian(riskCategory);
            let distance = 0
            var portfolioWeight = await PwSchema.findOne({ 'profile': riskCategory }).exec();
            distance = riskScore - median
            //stocks
            portfolioWeight.stockPercent = Math.round(portfolioWeight.stockPercent + (distance * 0.8));
            portfolioWeight.etfPercent = Math.round(portfolioWeight.etfPercent + (distance * 0.2));
            //equities mutual funds
            //Fixed income
            portfolioWeight.bondPercent = Math.round(portfolioWeight.bondPercent + (distance * -0.8))
            portfolioWeight.cash = 100 - (portfolioWeight.stockPercent + portfolioWeight.etfPercent + portfolioWeight.bondPercent)//Math.round(portfolioWeight.cash + (distance * -0.2));
            //fixed income mutual fund
        }
        catch (err) {
            logger.log(err.message);
            return {};
        }
        return portfolioWeight;
    }
}