/**
 * Route: POST /device 
 */

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const util = require('./util.js');
const moment = require('moment');

 const dynamoDB = new AWS.DynamoDB.DocumentClient();
 const tableName = process.env.DEVICE_TABLE;
 const tableNameCheck = process.env.USER_TABLE;
 const escalationTable = process.env.ESCALATION_TABLE;

 exports.handler  = async(event)=>{
    try{
        let item = JSON.parse(event.body);
        let inDeviceTable = {};
        let inEscalationTable = {};
        let authData = util.varifyToken(event.headers);
        const decoded = jwt.verify(authData, process.env.JWT_SECRET); 
        if(decoded.user.isAdmin === 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.NO_AUTH}),
            };
        }
        
        item.userName = decoded.user.userName;  
        inDeviceTable.userName = item.userName;
        item.timestamp = moment().unix();
        inDeviceTable.timestamp = item.timestamp
        item.device_status = util.device_status.OFFLINE
        inDeviceTable.device_status = item.device_status;
        inDeviceTable.sensor_profile = item.sensor_profile;
        inDeviceTable.device_id = item.device_id;
        inDeviceTable.device_name = item.device_name;

        inEscalationTable.userName =  item.userName;
        inEscalationTable.escalation = 0;
        inEscalationTable.device_id = item.device_id;

        let paramsUser = {
            TableName: tableNameCheck,
            KeyConditionExpression: "userName = :userName",
            ExpressionAttributeValues: {
                ":userName":  inDeviceTable.userName
            },
           };
        let isUserExists = await dynamoDB.query(paramsUser).promise();
        if(isUserExists.Count === 0){
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.USER_NAME}),
            }
        }

        let paramsDevice = {
            TableName: tableName,
            KeyConditionExpression: "device_id = :device_id AND userName = :userName",
            ExpressionAttributeValues: {
                ":device_id": inDeviceTable.device_id,
                ":userName" : inDeviceTable.userName
            },
           };
        let isDeviceExists = await dynamoDB.query(paramsDevice).promise();
        
        if (isDeviceExists.Count>0) {
            return{
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      error:util.user_error.DEVICE_EXISTS}),
            }
        }
        
        
        let data = await dynamoDB.put({
            TableName: tableName,
            Item: inDeviceTable
        }).promise();

        switch (item.sensor_profile){
            case util.sensor_profile_enum.SENSOR_NONE:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: false,
                        error: util.user_error.SENSOR_PROFILE
                    })
                };
            case util.sensor_profile_enum.SENSOR_T:
                inEscalationTable.minTemp = item.minTemp;
                inEscalationTable.maxTemp = item.maxTemp;
                let isEscalationT = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();
                
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'temperature sensor',
                              item  
                            }
                        })
                    };
            case util.sensor_profile_enum.SENSOR_TH:
                inEscalationTable.minTemp = item.minTemp;
                inEscalationTable.maxTemp = item.maxTemp;
                inEscalationTable.minHumid = item.minHumid;
                inEscalationTable.maxHumid = item.maxHumid;
                
                let isEscalationTH = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();

            
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:item
                        })
                    };
            case util.sensor_profile_enum.SENSOR_THM:
                inEscalationTable.minTemp = item.minTemp;
                inEscalationTable.maxTemp = item.maxTemp;
                inEscalationTable.minHumid = item.minHumid;
                inEscalationTable.maxHumid = item.maxHumid;
                inEscalationTable.minMoist = item.minMoist;
                inEscalationTable.maxMoist = item.maxMoist;
                
                let isEscalationTHM = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();
                
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'temperature, humidity and moisture sensor',
                              item}
                        })
                    };
                    
            case util.sensor_profile_enum.SENSOR_GAS:
                inEscalationTable.minGas = item.minGas;
                inEscalationTable.maxGas = item.maxGas;
                
                let isEscalationG = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();
                
                
                
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'gas Sensor',
                              item}
                        })
                    };

            case util.sensor_profile_enum.SENSOR_CTRL:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'sensor control',
                              item}
                        })
                    };
                    
            case util.sensor_profile_enum.SENSOR_GYRO:
                inEscalationTable.minGyro = item.minGyro;
                inEscalationTable.maxGyro = item.maxGyro;
                inEscalationTable.minAccel = item.minAccel;
                inEscalationTable.maxAccel = item.maxAccel;
                
                let isEscalationG_A = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'gyro and accelerometre sensor',
                              item}
                        })
                    };

            case util.sensor_profile_enum.SENSOR_THC:
                inEscalationTable.minTemp = item.minTemp;
                inEscalationTable.maxTemp = item.maxTemp;
                inEscalationTable.minHumid = item.minHumid;
                inEscalationTable.maxHumid = item.maxHumid;
                inEscalationTable.minCap = item.minCap;
                inEscalationTable.maxCap = item.maxCap;
                
                let isEscalationTHC = await dynamoDB.put({
                    TableName: escalationTable,
                    Item: inEscalationTable
                }).promise();
                
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: true,
                        data:{sensor_profile:'temperature, humidity and capacitance sensor',
                                item}
                        })
                    };
            default:
                return {
                    statusCode: 200,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        Success: false,
                        error: util.user_error.SENSOR_PROFILE
                    })
                };
        }

    }catch(err){
        console.log("Error",err);
        return{
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        }
    }
 }