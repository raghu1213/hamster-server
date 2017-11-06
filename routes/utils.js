
export default class Utils {
    constructor() { }

    errorRespose(res, err) {
        console.log(err);
        res.status(400);
        return res.send({ message: "Error!" + err });
    }
}