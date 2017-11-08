
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
        let clientMob =  clientDetails[0].mobileNumber
        let cif = clientDetails[0].cif;
        let portfolioId = clientDetails[0].portfolioId
        let expectedReturn = clientDetails[0].expectedReturn;

        let netPortfolioPosition = this._netPortfolioPosition(initialPosition, clientTransactionData, stockEODData)
        let netInstrumentPositions = this._netInstrumentPositions(clientTransactionData, instrumentAbove, instrumentBelow, stockEODData)
        let portfolioAlertMsg = ''
        let instrumentAlertMsg = ''

        logger.log(`net portfolio position : ${netPortfolioPosition}`)

        if ((netPortfolioPosition > 0 && netPortfolioPosition >= portfolioAbove) ||
            (netPortfolioPosition < 0 && Math.abs(netPortfolioPosition) > portfolioBelow)) {

            let upDownMessage = 'Down'
            if (netPortfolioPosition > 0) {
                upDownMessage = 'Up'
            }

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


            //nervous // concerned // conservative
            if(expectedReturn === 'aggressive') {
                if(netPortfolioPosition < 0) {
                    // Buy Worst
                    let unitsToBuy = 0
                    if(worstInstrument.diffPercentage <= .1){
                        unitsToBuy = Math.floor(worstInstrument.units * worstInstrument.diffPercentage)
                    }
                    else{
                        unitsToBuy = Math.floor(worstInstrument.units * .1)
                    }
                    if(unitsToBuy > 0) {
                        this._executeTransaction(cif, portfolioId, clientMob, 'B', worstInstrument.eod, 'stock', worstInstrument.ticker, unitsToBuy)
                        portfolioAlertMsg = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Buy: ${worstInstrument.ticker} ${unitsToBuy}. Please reply y/n`
                        logger.log(`sending sms : ${portfolioAlertMsg}`)
                    }
                }
            }

            if(expectedReturn === 'conservative') {
                if(netPortfolioPosition < 0) {
                    //sell worst
                    let unitsToBuy = 0
                    if(worstInstrument.diffPercentage <= .1){
                        unitsToBuy = Math.floor(worstInstrument.units * worstInstrument.diffPercentage)
                    }
                    else{
                        unitsToBuy = Math.floor(worstInstrument.units * .1)
                    }
                    if(unitsToBuy > 0) {
                        this._executeTransaction(cif, portfolioId, clientMob, 'S', worstInstrument.eod, 'stock', worstInstrument.ticker, unitsToBuy)
                        portfolioAlertMsg = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Sell: ${worstInstrument.ticker} ${unitsToBuy}. Please reply y/n`
                        logger.log(`sending sms : ${portfolioAlertMsg}`)
                    }

                }
                else {
                    // sell best
                    let unitsToBuy = 0
                    if(bestInstrument.diffPercentage <= .1){
                        unitsToBuy = Math.floor(bestInstrument.units * bestInstrument.diffPercentage)
                    }
                    else{
                        unitsToBuy = Math.floor(worstInstrument.units * .1)
                    }
                    if(unitsToBuy > 0) {
                        this._executeTransaction(cif, portfolioId, clientMob, 'S', bestInstrument.eod, 'stock', bestInstrument.ticker, unitsToBuy)
                        portfolioAlertMsg = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Sell: ${bestInstrument.ticker} ${unitsToBuy}. Please reply y/n`
                        logger.log(`sending sms : ${portfolioAlertMsg}`)
                    }
                }

            }

            if(expectedReturn === 'moderate') {
                if(netPortfolioPosition > 0) {
                    //sell best
                    let unitsToBuy = 0
                    if(bestInstrument.diffPercentage <= .1){
                        unitsToBuy = Math.floor(bestInstrument.units * bestInstrument.diffPercentage)
                    }
                    else{
                        unitsToBuy = Math.floor(worstInstrument.units * .1)
                    }
                    if(unitsToBuy > 0) {
                        this._executeTransaction(cif, portfolioId, clientMob, 'S', bestInstrument.eod, 'stock', bestInstrument.ticker, unitsToBuy)
                        portfolioAlertMsg = `Your Portolfio ${upDownMessage} by ${Math.abs(netPortfolioPosition) + '%'}.Rebalance : Sell: ${bestInstrument.ticker} ${unitsToBuy}. Please reply y/n`
                        logger.log(`sending sms : ${portfolioAlertMsg}`)
                    }
                }
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
                let diff = parseFloat(eodPrice) - parseFloat(clientTrans.unitPrice)
                let absDiff = Math.abs(parseFloat(eodPrice) - parseFloat(clientTrans.unitPrice))
                let percentageDiff = (absDiff)/parseFloat(clientTrans.unitPrice)
                if(absDiff > above || absDiff > below) {
                    netPositionsToNotify.push({ticker: ticker, units: clientTrans.unitPrice, netPosition: diff, diffPercentage:percentageDiff, eod: eodPrice})
                }
            }

        }

        return netPositionsToNotify;
    }

    _executeTransaction(cif, portfolioId, mobileNumber, buySell, closePrice, assetType, ticker, units){


        let transaction = new ClientTranasctionSchema({
            cif: cif,
            portfolioId: portfolioId,
            AssetType: assetType,
            ticker: ticker,
            BuySell: buySell,
            unitPrice: closePrice,
            numberOfUnits: units,
            amount: parseInt(units) * parseFloat(closePrice),
            txnStatus:'pending',
            mobileNumber: mobileNumber
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

