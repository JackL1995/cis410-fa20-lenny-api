const express = require('express');

const db = require('./dbConnectExec.js');

const app = express();

app.get("/hi",(req, res)=>{ // first provided with path, then function
    res.send("hello world")
}) // route, request, response

// app.host()
// app.put()
// app.delete()

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

