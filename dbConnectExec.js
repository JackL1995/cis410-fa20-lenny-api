const sql = require('mssql')    //'const' newer version of 'var'

const rockwellConfig = require('./config.js')

const config = {
    user: rockwellConfig.DB.user,
    password: rockwellConfig.DB.password,
    server: rockwellConfig.DB.server,
    database: rockwellConfig.DB.database,
}


async function executeQuery(aQuery){      //There will be some asynchronous code
    var connection = await sql.connect(config)  //Await when we want to pause and wait for async code to finish running
    var result = await connection.query(aQuery)

    myVehicles = result;
    
    //console.log(result)
    return result.recordset
} 

module.exports = {executeQuery: executeQuery}

// executeQuery(`SELECT * 
//     FROM VEHICLE
//     LEFT JOIN VehicleMake
//     ON VehicleMake.MakeID = Vehicle.MakeID`);   