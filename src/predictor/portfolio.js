
var PwSchema = require('../db/mongo/pwSchema')
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

    async getRiskAdjustedPortfolio(riskScore, riskCategory) {
        let median = this.getMedian(riskCategory);
        let distance = 0
        var portfolioWeight = await PwSchema.findOne({ 'profile': riskCategory }).exec();

        distance = riskScore - median

        if (distance > 0) {
            portfolioWeight.stockPercent = portfolioWeight.stockPercent + (portfolioWeight.stockPercent * 0.8);
            portfolioWeight.bondPercent = portfolioWeight.bondPercent + (portfolioWeight.bondPercent * -0.8)
            portfolioWeight.etfPercent = portfolioWeight.etfPercent + (portfolioWeight.bondPercent * 0.2);
            portfolioWeight.cash = portfolioWeight.cash + (portfolioWeight.bondPercent * -0.2);
        }
        else {
            portfolioWeight.stockPercent = portfolioWeight.stockPercent + (portfolioWeight.stockPercent * -0.8);
            portfolioWeight.bondPercent = portfolioWeight.bondPercent + (portfolioWeight.bondPercent * 0.8)
            portfolioWeight.etfPercent = portfolioWeight.etfPercent + (portfolioWeight.bondPercent * -0.2);
            portfolioWeight.cash = portfolioWeight.cash + (portfolioWeight.bondPercent * 0.2);
        }
        return portfolioWeight;
    }
}