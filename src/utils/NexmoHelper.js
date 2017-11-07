import Nexmo from 'nexmo'
let nexmo = new Nexmo({
    apiKey: '1424594a',
    apiSecret: '6513db48610e6a78',
    applicationId: 'HRobo'
}, {});

nexmo.calls.create({
    answer_url: 'https://hamster-server.herokuapp.com/events/confirmation'
})

export default function SendMessage(callback){

}