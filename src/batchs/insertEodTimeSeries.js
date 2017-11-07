import QuandlQuery from './quandl'
import EodSchema from '../db/mongo/stockTimeSeries';
var mongoose = require('mongoose')
//let mongoURL = "mongodb://127.0.0.1:27017/hamsterdb";
//let mongoURL = Env.mongoDB;

module.exports = async function insertEod(date) {
    //mongoose.connect(mongoURL, { useMongoClient: true })
    let qQuery = new QuandlQuery(date)
    let tickersToFetch = "A,AA,AAL,AAP,AAPL,ABBV,ABC,ABT,ACN,ADBE,ADI,ADM,ADP,ADS,ADSK,AEE,AEP,AES,AET,AFL,AGN,AIG,AIV,AIZ,AKAM,ALB,ALGN,ALK,ALL,ALLE,ALXN,AMAT,AME,AMG,AMGN,AMP,AMT,AMZN,ANDV,ANSS,ANTM,AON,AOS,APA,APC,APD,APH,ATVI,AVB,AVGO,AVY,AWK,AXP,AYI,AZO,BA,BAC,BAX,BBT,BBY,BCR,BDX,BEN,BHF,BHGE,BIIB,BK,BLK,BLL,BMY,BSX,BWA,BXP,C,CA,CAG,CAH,CAT,CBG,CBOE,CBS,CCE,CCI,CCL,CDNS,CELG,CERN,CF,CFG,CHD,CHK,CHRW,CHTR,CI,CINF,CL,CLX,CMA,CMCSA,CME,CMG,CMI,CMS,CNC,CNP,COF,COG,COH,COL,COO,COP,COST,CPB,CRM,CSCO,CSRA,CSX,CTAS,CTL,CTSH,CTXS,CVS,CVX,CXO,D,DAL,DE,DFS,DG,DGX,DHI,DHR,DIS,DISCA,DISCK,DISH,DLPH,DLR,DLTR,DNB,DO,DOV,DPS,DRE,DRI,DTE,DUK,DVA,DVN,DWDP,EA,EBAY,ECL,ED,EFX,EIX,EL,EMN,EMR,EOG,EQIX,EQR,EQT,ES,ESRX,ESS,ETFC,ETN,ETR,EW,EXC,EXPD,EXPE,EXR,F,FAST,FB,FBHS,FCX,FDX,FE,FFIV,FIS,FISV,FITB,FL,FLIR,FLR,FLS,FMC,FOSL,FOX,FOXA,FRT,FSLR,FTI,FTR,FTV,GD,GE,GGP,GILD,GIS,GLW,GM,GOOG,GOOGL,GPC,GPN,GPS,GRMN,GS,GT,GWW,HAL,HAS,HBAN,HBI,HCA,HCN,HCP,HD,HES,HIG,HLT,HOG,HOLX,HON,HP,HPE,HPQ,HRB,HRL,HRS,HSIC,HST,HSY,HUM,IBM,ICE,IDXX,IFF,ILMN,INCY,INFO,INTC,INTU,IP,IPG,IR,IRM,ISRG,ITW,IVZ,JBHT,JCI,JEC,JNJ,JNPR,JPM,JWN,K,KEY,KHC,KIM,KLAC,KMB,KMI,KMX,KO,KORS,KR,KSS,KSU,L,LB,LEG,LEN,LH,LKQ,LLL,LLY,LM,LMT,LNC,LNT,LOW,LRCX,LUK,LUV,LVLT,LYB,M,MA,MAC,MAR,MAS,MAT,MCD,MCHP,MCK,MCO,MDLZ,MDT,MET,MGM,MHK,MKC,MLM,MMC,MMM,MNST,MO,MON,MOS,MPC,MRK,MRO,MS,MSFT,MSI,MTB,MTD,MU,MYL,NAVI,NBL,NDAQ,NEE,NEM,NFLX,NFX,NI,NKE,NLSN,NOC,NOV,NRG,NSC,NTAP,NTRS,NUE,NVDA,NWL,NWS,NWSA,O,OI,OKE,OMC,ORCL,ORLY,OXY,PAYX,PBCT,PCAR,PCG,PCLN,PDCO,PEG,PEP,PFE,PFG,PG,PGR,PH,PHM,PKG,PKI,PLD,PM,PNC,PNR,PNW,PPG,PPL,PRGO,PRU,PSA,PSX,PVH,PWR,PX,PXD,PYPL,Q,QCOM,QRVO,RCL,RE,REG,REGN,RF,RHI,RHT,RL,RMD,ROK,ROP,ROST,RRC,RSG,RTN,SBAC,SBUX,SCG,SCHW,SEE,SHW,SIG,SJM,SLB,SLG,SNA,SNI,SNPS,SO,SPG,SPGI,SRCL,SRE,STI,STT,STX,STZ,SWK,SWKS,SWN,SYF,SYK,SYMC,SYY,T,TAP,TDG,TEL,TGT,TIF,TJX,TMK,TMO,TRIP,TROW,TRV,TSCO,TSN,TSS,TWX,TXN,TXT,UA,UAA,UAL,UDR,UHS,ULTA,UNH,UNM,UNP,UPS,URBN,URI,USB,UTX,V,VAR,VFC,VIAB,VLO,VMC,VNO,VRSK,VRSN,VRTX,VTR,VZ,WAT,WBA,WDC,WEC,WFC,WHR,WLTW,WM,WMB,WMT,WRK,WU,WY,WYN,WYNN,XEC,XEL,XL,XLNX,XOM,XRAY,XRX,XYL,YUM,ZBH,ZION,ZTS".split(",")
    for (let symbol of tickersToFetch) {
        let data = await qQuery.get("WIKI", symbol);
        if (data.dataset.dataset_code === undefined) {
            console.log('Data not found for -->' + symbol)
            continue;
        }
        let header = data.dataset.column_names;
        let ticker = data.dataset.dataset_code;

        let dateIdx = header.indexOf("Date");
        let openIdx = header.indexOf("Open");
        let highIdx = header.indexOf("High");
        let lowIdx = header.indexOf("Low");
        let closeIdx = header.indexOf("Close");
        let volumeIdx = header.indexOf("Volume");
        let dividentIdx = header.indexOf("Ex-Dividend");
        let splitIdx = header.indexOf("Split Ratio");
        let adj_openIdx = header.indexOf("Adj. Open");
        let adj_highIdx = header.indexOf("Adj. High");
        let adj_lowIdx = header.indexOf("Adj. Low");
        let adj_closeIdx = header.indexOf("Adj.Close");
        let adj_volumeIdx = header.indexOf("Adj. Volume");

        let dataArray = data.dataset.data;
        for (let row of dataArray) {
            let date = row[dateIdx]

            let eodData = new EodSchema({
                ticker: ticker,
                date: row[dateIdx],
                open: row[openIdx],
                high: row[highIdx],
                low: row[lowIdx],
                close: row[closeIdx],
                volume: row[volumeIdx],
                dividend: row[dividentIdx],
                split: row[splitIdx],
                adj_Open: row[adj_openIdx],
                adj_High: row[adj_highIdx],
                adj_Low: row[adj_lowIdx],
                adj_Close: row[adj_closeIdx],
                adj_Volume: row[adj_volumeIdx]
            })
            eodData.save();
            console.log(ticker + '-->' + symbol + ":Date-->" + row[dateIdx])
        }
    }
}

