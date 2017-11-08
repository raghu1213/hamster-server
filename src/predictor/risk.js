import Questionare from '../batchs/questionare'
import Logger from '../utils/logging'
var logger = new Logger();
export default class Risk {
    constructor() {

    }

    async getRiskScore(customer) {

        logger.log("Calculating risk score...")
        let score = 0;
        for (let obj of Questionare) {
            let optionScore
            if (obj.question === 'age') {
                let ageRanges = obj.options
                let ageScore = this._getScoreFromRange(customer.age, ageRanges);
                logger.log("Age-->" + ageScore);
                score = score + ageScore;
            }
            else if (obj.question === 'investmentKnowledge') {
                let knowledgeOptions = obj.options;
                let knowledgeScore = this._getScoreFromDirectMatch(customer.investmentKnowledge, knowledgeOptions);
                logger.log("investmentKnowledge-->" + knowledgeScore);
                score = score + knowledgeScore;
            }
            else if (obj.question === 'investmentExperience') {
                let expOptions = obj.options;
                let investmentScore = this._getScoreFromDirectMatch(customer.investmentExperience, expOptions);
                logger.log("investmentExperience-->" + investmentScore);
                score = score + investmentScore
            }
            else if (obj.question === 'expectedReturn') {
                let returnOptions = obj.options;
                let returnScore = this._getScoreFromDirectMatch(customer.expectedReturn, returnOptions)
                logger.log("expectedReturn-->" + returnScore);

                score = score + returnScore;
            }
            else if (obj.question === 'investmentHorizon') {
                let horizonOption = obj.options;
                let horizonScore = this._getScoreFromDirectMatch(customer.investmentHorizon, horizonOption)
                logger.log("investmentHorizon-->" + horizonScore);
                score = score + horizonScore;
            }
            else if (obj.question === 'reactionToFluctuation') {
                let fluctuationOption = obj.options;
                let fluctuationScore = this._getScoreFromDirectMatch(customer.reactionToFluctuation, fluctuationOption)
                logger.log("reactionToFluctuation-->" + fluctuationScore);
                score = score + fluctuationScore
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