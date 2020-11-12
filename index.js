const express = require('express'); // Import others' node modules first
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const db = require('./dbConnectExec.js');
const config = require('./config.js');
const auth = require('./middleware/authenticate');

// azurewebsites.net, colostate.edu (front end)
const app = express();
app.use(express.json());
app.use(cors());

                // app.patch('/WorkOrder/:pk', auth, async(req,res)=>{
                //     let InvoiceID = req.customer.customerID;
                //     // Make sure that the user can only edit their own reviews
                // })

                // app.delete('/WorkOrder/:pk', auth, async(req,res)=>{
                //     let InvoiceID = req.customer.customerID;
                //     // Make sure that the user can only edit their own reviews
                // })

app.get("/", (req,res)=>{
    res.send("Here is the root directory.")
})

app.post('/customer/logout', auth, (req,res)=>{
    var logoutQuery = `UPDATE Customer
    SET Token = NULL
    WHERE CustomerID = ${req.customer.CustomerID}`

    db.executeQuery(logoutQuery)
    .then(()=>{res.status(200).send()})
    .catch((error)=>{console.log("Error in POST /customer/logout", error)
    res.status(500).send()
})
})

app.get('/WorkOrder/me', auth, async(req,res)=>{ 
    let customerID = req.customer.CustomerID;

    //Run db query to select all work orders for given customer
    try {
    
    let allWorkOrders = `SELECT * FROM WorkOrder
    WHERE CustomerID = ${req.customer.CustomerID}`

    console.log(allWorkOrders);

    let insertedQuery = await db.executeQuery(allWorkOrders)

    res.status(201).send(insertedQuery)

} catch(theNewFeature){
    console.log("Error in GET /WorkOrder/me", theNewFeature);
    res.status(500).send()
}

})

app.get('/customer/me', auth, (req,res)=>{
    res.send(req.customer)
})

app.get("/hi",(req, res)=>{ // first provided with path, then function
    res.send("hello world")
}) // route, request, response

                // app.host()
                // app.put()
                // app.delete()

app.post("/WorkOrder", auth, async (req, res)=>{ //Can insert auth middleware in routes

    try{
    var BeginDate = req.body.BeginDate;
    var ReturnDatePromised = req.body.ReturnDatePromised;
    var AdvisorID = req.body.AdvisorID;
    var ServiceRequested = req.body.ServiceRequested;
    var EstimatedCost = req.body.EstimatedCost;
    var CustomerID = req.body.CustomerID;
    var VehicleVIN = req.body.VehicleVIN;

    if(!BeginDate || !AdvisorID || !ServiceRequested || !CustomerID){   //Server side validation. Good to also do validation on client side
        res.status(400).send("bad request: information missing")
    }
    //var formattedDate = Date.parse(BeginDate)
    ServiceRequested = ServiceRequested.replace("'","''")

    let insertQuery = `INSERT INTO WorkOrder(BeginDate, ReturnDatePromised, AdvisorID, ServiceRequested, EstimatedCost, CustomerID, VehicleVIN)
    OUTPUT inserted.InvoiceID, inserted.BeginDate, inserted.AdvisorID, inserted.ServiceRequested, inserted.CustomerID
    VALUES ('${BeginDate}', '${ReturnDatePromised}', ${AdvisorID}, '${ServiceRequested}', '${EstimatedCost}', ${req.customer.CustomerID},${VehicleVIN})`

    console.log(insertQuery);                                                                   //Comment me out? 

    let insertedReview = await db.executeQuery(insertQuery)

    //console.log(insertedReview)
    res.status(201).send(insertedReview[0])

    //console.log("In /WorkOrder ... ", req.customer)
    //res.send("Here is the response")
} catch(theNewFeature){
    console.log("Error in POST /WorkOrder", theNewFeature);
    res.status(500).send()
}
})

app.post("/customer/login", async (req,res)=>{
    //console.log("/login called")
    //console.log(req.body)
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password){
        return res.status(400).send('bad request');
    }

    //1. Check that user email exists in db
    var query = `SELECT * 
    FROM Customer
    WHERE Email = '${email}'`

    let result;

    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log('error in /login', myError);
        return res.status(500).send()
    }

    //console.log(result)

    if(!result[0]){
        return res.status(400).send('invalid user credentials, yo')
    }

    //2. Check that password matches
    let user = result[0]
    //console.log(user)

    if(!bcrypt.compareSync(password,user.Password)){
        console.log("invalid password, yo");
        return res.status(400).send("invalid user credentials")
    }

    //3. Generate a token
    let token = jwt.sign({pk: user.CustomerID}, config.JWT, {expiresIn: '60 minutes'})

    //console.log(token);

    //4. Save the token in db and send token + user info back to user
    let setTokenQuery = `UPDATE Customer
    SET Token = '${token}'
    WHERE CustomerID = '${user.CustomerID}'`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                FirstName: user.FirstName,
                LastName: user.LastName,
                Email: user.Email,
                CustomerID: user.CustomerID //Don't need hashed password
            }
        })
    }
    catch(myError){
        console.log("error setting user token ", myError);
        res.status(500).send();
    }
})

app.post("/customer", async (req,res)=>{
    // res.send("creating user")
    // console.log("request body", req.body)

    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var password = req.body.password;
    var phone = req.body.phone;

    if(!firstName || !lastName || !email || !password){ // Or operator
        return res.status(400).send("bad request")
    }

    firstName = firstName.replace("'","''")
    lastName = lastName.replace("'","''")

    var emailCheckQuery = `SELECT email
    FROM customer
    WHERE email= '${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    console.log("existing user", existingUser)

    if(existingUser[0]){
        return res.status(409).send('Please enter a different email.')
    }

    var hashedPswd = bcrypt.hashSync(password)
    var insertQuery = `INSERT INTO Customer(FirstName, LastName, email, password, phone)
    VALUES('${firstName}', '${lastName}', '${email}', '${hashedPswd}', ${phone})`

    db.executeQuery(insertQuery)
    .then(()=>{
        res.status(201).send()
    })
    .catch((err)=>{
        console.log("error in POST /Customer", err)
        res.status(500).send()
    })
})

app.get("/vehicle", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT * 
    FROM VEHICLE
    LEFT JOIN VehicleMake
    ON VehicleMake.MakeID = Vehicle.MakeID`)
    .then((result)=>{
        res.status(200).send(result) // 200 = everything went okay
    })
    .catch((err)=>{
        console.log("Error in query", err);
        res.status(500).send()
    })
})

app.get("/vehicle/:pk", (req, res)=>{
    var pk = req.params.pk
    //console.log("my PK: ", pk)

    var myQuery = `SELECT *
    FROM Vehicle
    LEFT JOIN VehicleMake
    ON VehicleMake.MakeID = Vehicle.MakeID 
    WHERE VehicleVIN = ${pk}`

    db.executeQuery(myQuery)
        .then((vehicles)=>{
            //console.log("Vehicles: ", vehicles)

            if(vehicles[0]){
                res.send(vehicles[0])
            } else {
                res.status(404).send('bad request')

            }
        })
        .catch((err)=>{
            console.log("Error in /vehicles/pk", err)
            res.status(500).send()
        })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{console.log(`app is running on port ${PORT}`)}) // == the port num, what to do when server running

