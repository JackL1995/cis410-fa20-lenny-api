const express = require('express'); // Import others' node modules first
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const db = require('./dbConnectExec.js');
const config = require('./config.js')

const app = express();
app.use(express.json())

app.get("/hi",(req, res)=>{ // first provided with path, then function
    res.send("hello world")
}) // route, request, response

// app.host()
// app.put()
// app.delete()

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

    //var result = await db.executeQuery(query);

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
app.listen(5000, ()=>{console.log("app is running on port 5000")}) // == the port num, what to do when server running

