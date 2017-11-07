export function getRiskCategory(riskScore) {
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

export function formatPortfolio(suggestedPortfolio) {
    let arr = {
        STOCK: suggestedPortfolio.stockPercent, ETF: suggestedPortfolio.etfPercent,
        BOND: suggestedPortfolio.bondPercent,
        MF: suggestedPortfolio.mfPercent,
        CASH: suggestedPortfolio.cash
    };
    return ({ profile: suggestedPortfolio.profile, distribution: arr });

}