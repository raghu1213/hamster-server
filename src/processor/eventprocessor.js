
import Logger from '../utils/logging'
import Nexmo from 'nexmo'
var ClientTranasctionSchema = require('../db/mongo/clientTransactionSchema');

var logger = new Logger();
let nexmo = new Nexmo({
    apiKey: '1424594a',
    apiSecret: '6513db48610e6a78',
    applicationId: 'HRobo'
}, {});




export default class EventProcessor {
    constructor() {

    }

    async processEvent(eventSetting, initialPosition, clientTransactionData, clientDetails, stockEODData) {
        let portfolioAbove = parseInt(eventSetting.portfolioAbove)
        let portfolioBelow = parseInt(eventSetting.portfolioBelow)
        let instrumentAbove = parseInt(eventSetting.instrumentAbove)
        let instrumentBelow = parseInt(eventSetting.instrumentBelow)
        let clientMob = '6594889470' //clientDetails.mobileNumber
        let cif = clientDetails.cif;
        let portfolioId = clientDetails.portfolioId

        let netPortfolioPosition = this._netPortfolioPosition(initialPosition, clientTransactionData, stockEODData)


        if ((netPortfolioPosition > 0 && netPortfolioPosition >= portfolioAbove) ||
            (netPortfolioPosition < 0 && Math.abs(netPortfolioPosition) > portfolioBelow)) {
            let buyInstruments = [{'ticker': 'AAPL', units: 100, 'AssetType': 'Stocks'}]
            let sellInstruments = [{'ticker': 'ACN', units: 600}]

            let upDownMessage = 'Down'
            if (netPortfolioPosition > 0) {
                upDownMessage = 'Up'
            }

            let message = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Buy: ${buyInstruments[0].ticker} ${buyInstruments[0].units} Sell: ${sellInstruments[0].ticker} ${sellInstruments[0].units}. Please reply y/n`

            await nexmo.message.sendSms('Noorul', clientMob, message, {}, 'https://hamster-server.herokuapp.com/events/confirmation')


                /*(nexmoResponse) => {
                logger.log(`sent Message to ${clientMob}, Message : ${message}`);
                logger.log(nexmoResponse);

                this._executeTransaction(cif, portfolioId, true, stockEODData.adj_Close, buyInstruments[0])
                this._executeTransaction(cif, portfolioId, false, stockEODData.adj_Close, sellInstruments[0])
            });*/
        }

        let netInstrumentPositions = this._netInstrumentPositions(clientTransactionData, stockEODData)
        let worstInstrument;
        let bestInstrument;
        for (let inst in netInstrumentPositions) {
            if (worstInstrument === undefined) {
                worstInstrument = netInstrumentPositions[inst];
                continue
            }
            if (bestInstrument === undefined) {
                bestInstrument = netInstrumentPositions[inst];
                continue
            }

            if (inst.netPosition > 0 && bestInstrument.netPosition < inst.netPosition) {
                bestInstrument = inst;
            }
            if (inst.netPosition < 0 && Math.abs(inst.netPosition) > Math.abs(worstInstrument.netPosition)) {
                worstInstrument = inst;
            }
        }
    }


    _netPortfolioPosition(initialPosition, clientTransactionData, stockEODData){

        let portfolioEOD = 0
        for(let clientTransact in clientTransactionData) {
            let clientTrans = clientTransactionData[clientTransact]
            let ticker = clientTrans.ticker
            let eodPrice = this._getEODPriceForTicker(ticker, stockEODData)
            if(eodPrice > 0) {
                portfolioEOD += parseInt(clientTrans.numberOfUnits) * eodPrice
            }

        }
        if(portfolioEOD < 0) {
            return initialPosition;
        }
        let netChange = (portfolioEOD - initialPosition) * 100 / portfolioEOD
        return Math.floor(netChange);
    }

    _getEODPriceForTicker(ticker, stockEODData){
        let portfolioPosition = 0
        for(let stockIndex in stockEODData) {
            if(stockEODData[stockIndex].ticker.toLowerCase() === ticker.toLowerCase()){
                return parseFloat(stockEODData[stockIndex].close)
            }
        }
        return -1
    }

    _netInstrumentPositions(clientTransactionData, stockEODData){
        return [{instrument:'AAPL', netPosition: -20}]
    }

    _executeTransaction(cif, portfolioId, isBuy, closePrice, transactionDetails){
        let buySell = 'S'
        if(isBuy) {
            buySell = 'B'
        }

        let transaction = new ClientTranasctionSchema({
            cif: cif,
            portfolioId: portfolioId,
            AssetType: transactionDetails.AssetType,
            ticker: transactionDetails.ticker,
            BuySell: buySell,
            unitPrice: closePrice,
            numberOfUnits: transactionDetails.units,
            amount: parseInt(transactionDetails.units) * parseFloat(closePrice)
        })

        transaction.save(async (err, data) => {
            if (err) {
                logger.log(`unable to execute client transaction cif: ${cif}, portfolio: ${portfolioId}`)
                return
            }
            logger.log("New Transaction executed-->" + data)
            logger.log(JSON.stringify(data))
        })
    }
}

