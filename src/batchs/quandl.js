require('fetch-retry')



export default class QuandlQuery {
    constructor(date) {
        this.query = "?api_key=c-LWekLJ1yK23yk4WXAQ&start_date=" + date;
    }


    /**
     * gets results from quandl
     * 
     * @param {string} dbCode quandl dabase code
     * @param {string} dsCode quandl dataset code
     * @returns results promise
     * @memberof QuandlQuery
     */
    get(dbCode, dsCode) {
        var url = "https://www.quandl.com/api/v3/datasets/" + dbCode + '/' + dsCode + '.json' + this.query;
        console.log('Fetcing from :' + url)
        return fetch(url, {
            retries: 2,
            retryDelay: 5000,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(o => { return o.json() });

    }
}    
