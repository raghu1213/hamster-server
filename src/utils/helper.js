export default function getRiskCategory(riskScore) {
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

export default function formatPortfolio(suggestedPortfolio) {
    let arr = [];
    arr.push({ STOCK: suggestedPortfolio.stockPercent })
    arr.push({ ETF: suggestedPortfolio.etfPercent })
    arr.push({ MFEQ: suggestedPortfolio.mfEqPercent })
    arr.push({ BOND: suggestedPortfolio.bondPercent })
    arr.push({ MFFI: suggestedPortfolio.mfFIPercent })
    arr.push({ MFMIX: suggestedPortfolio.mfMixedPercent })
    arr.push({ CASH: suggestedPortfolio.cash })
    return ({ profile: suggestedPortfolio.profile, distribution: arr });

}