
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
        let portfolioAlertMsg = ''
        let instrumentAlertMsg = ''

        if ((netPortfolioPosition > 0 && netPortfolioPosition >= portfolioAbove) ||
            (netPortfolioPosition < 0 && Math.abs(netPortfolioPosition) > portfolioBelow)) {
            let buyInstruments = [{'ticker': 'AAPL', units: 100, 'AssetType': 'Stocks'}]
            let sellInstruments = [{'ticker': 'ACN', units: 600}]

            let upDownMessage = 'Down'
            if (netPortfolioPosition > 0) {
                upDownMessage = 'Up'
            }

            portfolioAlertMsg = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Buy: ${buyInstruments[0].ticker} ${buyInstruments[0].units} Sell: ${sellInstruments[0].ticker} ${sellInstruments[0].units}. Please reply y/n`



            /*(nexmoResponse) => {
            logger.log(`sent Message to ${clientMob}, Message : ${message}`);
            logger.log(nexmoResponse);

            this._executeTransaction(cif, portfolioId, true, stockEODData.adj_Close, buyInstruments[0])
            this._executeTransaction(cif, portfolioId, false, stockEODData.adj_Close, sellInstruments[0])
        });*/
        }

        let netInstrumentPositions = this._netInstrumentPositions(clientTransactionData, instrumentAbove, instrumentBelow, stockEODData)
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

        if (netInstrumentPositions.length > 0) {

            let instrumentAlertMsg = `Below Financial Instruments are above/below allowed limits.`
            for(let instTemp in netInstrumentPositions){
                let upDownMessage = 'Down'
                if (instTemp.netPosition > 0) {
                    upDownMessage = 'Up'
                }

                instrumentAlertMsg += ` ${instTemp.ticker} is UP by ${instTemp.netPosition}`
            }

            instrumentAlertMsg  += `Rebalance => Buy: ${netInstrumentPositions[0].ticker} Units: ${100} `



        }

        if(instrumentAlertMsg.length > 0) {
            await nexmo.message.sendSms('601117000807', clientMob, instrumentAlertMsg, {}, (nexmoResponse) => {
                logger.log(`sent Message to ${clientMob}, Message portfolio transaction : ${instrumentAlertMsg}, response: ${nexmoResponse}`);

            });
        }

        if(portfolioAlertMsg.length > 0) {
            await nexmo.message.sendSms('601117000807', clientMob, portfolioAlertMsg, {}, (nexmoResponse) => {
                logger.log(`sent Message to ${clientMob}, Message instrument transaction: ${portfolioAlertMsg}, response: ${nexmoResponse}`);

            });
        }

        //this._executeTransaction(cif, portfolioId, true, stockEODData.adj_Close, buyInstruments[0])
        //this._executeTransaction(cif, portfolioId, false, stockEODData.adj_Close, sellInstruments[0])
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

    _netInstrumentPositions(clientTransactionData, above, below, stockEODData){

        let netPositionsToNotify = []
        for(let clientTransact in clientTransactionData) {
            let clientTrans = clientTransactionData[clientTransact]
            let ticker = clientTrans.ticker
            let eodPrice = this._getEODPriceForTicker(ticker, stockEODData)
            if(eodPrice > 0) {
                let absDiff = parseFloat(eodPrice) - parseFloat(clientTrans.unitPrice)
                let diff = Math.abs(parseFloat(eodPrice) - parseFloat(clientTrans.unitPrice))
                if(diff > above || diff > below) {
                    netPositionsToNotify.push({ticker: ticker, netPosition: absDiff})
                }
            }

        }

        return netPositionsToNotify;
    }


}

