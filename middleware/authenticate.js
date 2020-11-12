const jwt = require('jsonwebtoken');

const db = require('../dbConnectExec.js');

const config = require('../config.js');

const auth = async(req,res,next)=>{ //Middleware 
    //console.log(req.header('Authorization'))
    //next()
    try{
        //1. Decode token
        let myToken = req.header('Authorization').replace('Bearer ', '')
        //console.log(myToken)

        let decodedToken = jwt.verify(myToken, config.JWT)
        //console.log(decodedToken)

        let CustomerID = decodedToken.pk;
        console.log(CustomerID)

        //2. Compare token w/ db
        let query =   
        `SELECT CustomerID, FirstName, LastName, Email
        FROM Customer
        WHERE CustomerID = ${CustomerID} and Token = '${myToken}'`

        let returnedUser = await db.executeQuery(query);
        //console.log(returnedUser)

        //3. Save user info in req
        if(returnedUser[0]){
            req.customer = returnedUser[0];
            next();
        } else {
            res.status(401).send("Authentication failed. ")
        }

    } catch(myError){
        res.status(401).send("Authentication failed.")
    }
}

module.exports = auth