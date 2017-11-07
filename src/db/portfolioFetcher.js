import PortfolioPredict from '../predictor/portfolio'
import StockRiskReward from '../db/mongo/stockDetailSchema'
import MutualFundDetails from '../db/mongo/mutualFundDetailsSchema'

export default class PorfolioFetcher {
    constructor() { }
   

    async getPortfolioDrillDown(riskScrore) {
        let predictor = new PortfolioPredict();

        //all assets  --sorted by category, rank and volatility
        let rankedSets = this._getRankedAssets()

        let samplingProportion = [50, 30, 20];
        let customerAmountDivition = [] // amount divided based on above
        let result = [];
        let diffRanks = findUniqueRanks() // ranks array
        
        for (let rank of diffRanks) {
            let rankItems = fetchItemsForrank(rank) //ranked itemm on beta
            let eachItemContrib = 50 / rankItems.length;

        }

       // let portfolioComposition = await predictor.getRiskAdjustedPortfolio(riskScore);
        //let mutualFundDetails = await MutualFundDetails.find().exec();//sort by category, rank, volatility
        //let stockRiskReward = await StockRiskReward.find().exec();

        

        // if (portfolioComposition.stockPercent != undefined && portfolioComposition.stockPercent > 0) {

        // }
        // if (portfolioComposition.stockPercent != undefined && portfolioComposition.stockPercent > 0)
        
    }
}