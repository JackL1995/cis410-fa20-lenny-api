const express = require('express');

const app = express();

app.get("/hi",(req, res)=>{ // first provided with path, then function
    res.send("hello world")
}) // route, request, response

app.host()
app.put()
app.delete()

app.listen(5000, ()=>{console.log("app is running on port 5000")}) // == the port num, what to do when server running

