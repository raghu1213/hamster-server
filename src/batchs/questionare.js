var Questionare = []
Questionare.push({
    question: "age",
    options: [
        { option: "20-30", weight: 10 },
        { option: "30-40", weight: 8 },
        { option: "40-50", weight: 7 },
        { option: "50-60", weight: 6 },
        { option: "60-70", weight: 5 },
        { option: "70-200", weight: 3 },
    ]
})
Questionare.push({
    question: "investmentKnowledge",
    options: [
        { option: "none", weight: 1 },
        { option: "average", weight: 3 },
        { option: "extensive", weight: 5 }
    ]
})

Questionare.push({
    question: "investmentExperience",
    options: [
        { option: "none", weight: 1 },
        { option: "average", weight: 3 },
        { option: "extensive", weight: 5 }
    ]
})

Questionare.push({
    question: "expectedReturn",
    options: [
        { option: "conservative", weight: 1 },
        { option: "moderate", weight: 5 },
        { option: "aggressive", weight: 10 }
    ]
})
Questionare.push({
    question: "investmentHorizon",
    options: [
        { option: "0-5", weight: 1 },
        { option: "5-10", weight: 5 },
        { option: "10-200", weight: 10 }
    ]
})

Questionare.push({
    question: "reactionToFluctuation",
    options: [
        { option: "nervous", weight: 1 },
        { option: "concerned", weight: 5 },
        { option: "ignore", weight: 10 },

    ]
})

module.exports = Questionare