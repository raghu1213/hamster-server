var mongoose = require('mongoose')
var questionareSchema = require('../db/mongo/questionareSchema');
import PortfolioPredictor from './portfolio'

export default class Customer {
    constructor() {

    }

    getStockCompostionSummary(riskScore) {
        let pp = new PortfolioPredictor()
        return pp.getRiskAdjustedPortfolio(riskScore, this.getRiskCategory(riskScore))
    }
    getRiskCategory(riskScore) {
        if (riskScore <= 15) {
            return "conservative"
        }
        else if (riskScore > 15 && riskScore <= 35) {
            return "balanced"
        }
        else {
            return "highGrowth"
        }
    }

    async getRiskScore(customer) {

        let questions = await questionareSchema.find().exec()
        let score = 0;
        for (let obj of questions) {
            let optionScore
            if (obj.question === 'age') {
                let ageRanges = obj.options
                score = score + this._getScoreFromRange(customer.age, ageRanges)
            }
            else if (obj.question === 'investmentKnowledge') {
                let knowledgeOptions = obj.options;
                score = score + this._getScoreFromDirectMatch(customer.investmentKnowledge, knowledgeOptions)
            }
            else if (obj.question === 'investmentExperience') {
                let expOptions = obj.options;
                score = score + this._getScoreFromDirectMatch(customer.investmentExperience, expOptions)
            }
            else if (obj.question === 'expectedReturn') {
                let returnOptions = obj.options;
                score = score + this._getScoreFromDirectMatch(customer.expectedReturn, returnOptions)
            }
            else if (obj.question === 'investmentHorizon') {
                let horizonOption = obj.options;
                score = score + this._getScoreFromRange(customer.investmentHorizon, horizonOption)
            }
            else if (obj.question === 'reactionToFluctuations') {
                let fluctuationOption = obj.options;
                score = score + this._getScoreFromDirectMatch(customer.reactionToFluctuations, fluctuationOption)
            }
        }
        return score;
    }
    _getScoreFromRange(custData, options) {
        for (let item of options) {
            let range = item.option.split("-")
            if (custData > range[0] && custData <= range[1]) {
                return item.weight;
            }
        }
        return 0;
    }
    _getScoreFromDirectMatch(custData, options) {
        for (let item of options) {
            if (item.option === custData) {
                return item.weight;
            }
        }
        return 0;
    }



}