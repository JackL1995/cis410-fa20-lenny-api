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
        console.log(err);
        res.status(500).send()
    })
})
app.listen(5000, ()=>{console.log("app is running on port 5000")}) // == the port num, what to do when server running

