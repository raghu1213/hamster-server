let portfolioWeight = []

portfolioWeight.push({
    profile: "conservative",
    stockPercent: 5,
    bondPercent: 70,
    etfPercent: 5,
    mfPercent: 10,
    cash: 10
})


portfolioWeight.push({
    profile: "balanced",
    stockPercent: 30,
    bondPercent: 30,
    etfPercent: 10,
    mfPercent: 20,
    cash: 10
})
// pw2.save()
// console.log("balanced")

portfolioWeight.push({
    profile: "aggressive",
    stockPercent: 45,
    bondPercent: 15,
    etfPercent: 25,
    mfPercent: 10,
    cash: 5
})
// pw3.save()
// console.log("balanced")
// console.log('----------------------------')
// console.log('COMPLETED')

module.exports = portfolioWeight;