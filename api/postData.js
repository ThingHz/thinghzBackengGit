/**
 * Route: POST /data 
 */

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const _ = require('underscore');
const util = require('./util');
const moment = require('moment');
//const stepfunctions = new AWS.StepFunctions();

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DATA_TABLE;
const deviceTableName = process.env.DEVICE_TABLE;
const escalationTable = process.env.ESCALATION_TABLE;



exports.handler  = async(event)=>{
    
   try{
       
       let item = JSON.parse(event.body);
       item.timestamp = moment().unix();

       let paramsDevice = {
        TableName: escalationTable,
        KeyConditionExpression: "device_id = :device_id",
        ExpressionAttributeValues: {
            ":device_id": item.device_id
        },
       }

       let deviceData  = await dynamoDB.query(paramsDevice).promise();
       if(deviceData.Count===0){
           return{
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                Success: false,
                error: util.user_error.DEVICE_ERROR
                })
           }
       }

       let escalation = deviceData.Items[0].escalation;

       await dynamoDB.put({
           TableName: tableName,
           Item: item
       },(err,data)=>{
           
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
            var tempMin = Number(deviceData.Items[0].minTemp);
            var tempMax = Number(deviceData.Items[0].maxTemp);
            if (escalation<=5 && (item.temp>tempMax || item.temp<tempMin)) {
                escalation ++;
                await isEscalation(deviceData,escalation);
            }else if (escalation > 0 &&
                     (item.temp<=tempMax || item.temp>=tempMin)){
                       escalation = 0;
                       await isEscalation(deviceData,escalation);        
            }
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);

            let paramT = {device_id:item.device_id,
                          sensor_profile: util.sensor_profile_enum.SENSOR_T,
                          temp:item.temp,
                          battery:item.battery,
                          escalation: escalation,
                          timestamp: item.timestamp,
                          range:{tempMin:deviceData.Items[0].minTemp,
                                 tempMax:deviceData.Items[0].maxTemp}};
            
            //await callStepFunction(paramT,deviceData.Items[0].userName);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    deviceStatus: util.device_status.ONLINE,
                    data:paramT})
                };
        case util.sensor_profile_enum.SENSOR_TH:

            var tempMin = Number(deviceData.Items[0].minTemp);
            var tempMax = Number(deviceData.Items[0].maxTemp);
            var humidMin = Number(deviceData.Items[0].minHumid);
            var humidMax = Number(deviceData.Items[0].maxHumid);
            if (escalation<=5 &&
                (item.temp>tempMax || item.temp<tempMin) && 
                (item.humid>humidMax || item.humid<humidMin)) {
                 escalation ++;
                 await isEscalation(deviceData,escalation);   
            }else if (escalation > 0 &&
                     (item.temp<=tempMax || item.temp>=tempMin) && 
                     (item.humid<=humidMax || item.humid>=humidMin)){
                       escalation = 0;
                       await isEscalation(deviceData,escalation); 
            }
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramTH = {device_id:item.device_id,
                sensor_profile:util.sensor_profile_enum.SENSOR_TH,
                temp:item.temp,
                humid:item.humid,
                battery:item.battery,
                timestamp: item.timestamp,
                range:{tempMin:deviceData.Items[0].minTemp,
                       tempMax:deviceData.Items[0].maxTemp,
                       humidMax:deviceData.Items[0].maxHumid,
                       humidMin:deviceData.Items[0].minHumid}};
            
            //await callStepFunction(paramTH,deviceData.Items[0].userName)
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramTH
                    })
                };
        case util.sensor_profile_enum.SENSOR_THM:
            var tempMin = Number(deviceData.Items[0].minTemp);
            var tempMax = Number(deviceData.Items[0].maxTemp);
            var humidMin = Number(deviceData.Items[0].minHumid);
            var humidMax = Number(deviceData.Items[0].maxHumid);
            var moistMin = Number(deviceData.Items[0].minMoist);
            var moistMax = Number(deviceData.Items[0].maxMoist);
            if (escalation<=5 && 
                (item.temp>tempMax || item.temp<tempMin) && 
                (item.humid>humidMax || item.humid<humidMin) && 
                (item.moist>moistMax || item.moist<moistMin)) {
                        escalation ++;
                        await isEscalation(deviceData,escalation);
            }else if (escalation > 0 &&
                     (item.temp<tempMax || item.temp>tempMin) && 
                     (item.humid<humidMax || item.humid>humidMin) && 
                     (item.moist<moistMax || item.moist>moistMin)){
                       escalation = 0;
                       await isEscalation(deviceData,escalation);
            } 
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramTHM = {device_id:item.device_id,
                deviceStatus:util.device_status.ONLINE,
                sensor_profile:util.sensor_profile_enum.SENSOR_THM,
                temp:item.temp,
                humid:item.humid,
                moist:item.moist,
                battery:item.battery,
                escalation: escalation,
                timestamp: item.timestamp,
                range:{tempMin:deviceData.Items[0].minTemp,
                       tempMax:deviceData.Items[0].maxTemp,
                       humidMax:deviceData.Items[0].maxHumid,
                       humidMin:deviceData.Items[0].minHumid,
                       moistMin:deviceData.Items[0].minMoist,
                       moistMax:deviceData.Items[0].maxMoist},
              };
              
            //await callStepFunction(paramTHM,deviceData.Items[0].userName);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramTHM
                    })
                };
                
        case util.sensor_profile_enum.SENSOR_GAS:
            var gasMin = Number(deviceData.Items[0].minGas);
            var gasMax = Number(deviceData.Items[0].maxGas);
            if (escalation<=5 && 
               (item.gas>gasMax || item.gas<gasMin)) {
                        escalation ++;
                        await isEscalation(deviceData,escalation);
            }else if (escalation > 0 &&
                     (item.gas<gasMax || item.gas>gasMin)){
                       escalation = 0;
                       await isEscalation(deviceData,escalation);
            } 
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramGas = {device_id:item.device_id,
                device_status:util.device_status.ONLINE,
                sensor_profile:util.sensor_profile_enum.SENSOR_GAS,
                gas:item.gas,
                battery:item.battery,
                escalation: escalation,
                timestamp: item.timestamp,
                range:{gasMin:deviceData.Items[0].gasMin,
                       gasMax:deviceData.Items[0].gasMax}};
            
            //await callStepFunction(paramGas,deviceData.Items[0].userName);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramGas
                    })
                };

        case util.sensor_profile_enum.SENSOR_CTRL:
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramCtrl = {device_id:item.device_id,
                device_status:util.device_status.ONLINE,
                sensor_profile:util.sensor_profile_enum.SENSOR_CTRL,
                ctrl:item.ctrl,
                battery:item.battery,
                timestamp: item.timestamp};
          
            //await callStepFunction(paramCtrl,deviceData.Items[0].userName);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramCtrl
                    })
                };
                
        case util.sensor_profile_enum.SENSOR_GYRO:
            var gyroMin = Number(deviceData.Items[0].minGyro);
            var gyroMax = Number(deviceData.Items[0].maxGyro);
            var accelMin = Number(deviceData.Items[0].minAccel);
            var accelMax = Number(deviceData.Items[0].maxAccel);
            if (escalation<=5 && 
                (item.gyro>gyroMax || item.gyro<gyroMin) &&
                (item.accel>accelMax || item.accel<accelMin)) {
                        escalation ++;
                        await isEscalation(deviceData,escalation);
            }else if (escalation > 0 &&
                     (item.gyro<gyroMax || item.gyro>gyroMin) &&
                     (item.accel<accelMax || item.accel>accelMin)
                     ){
                       escalation = 0;
                       await isEscalation(deviceData,escalation);
            } 
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramGyro = {device_id:item.device_id,
                deviceStatus:util.device_status.ONLINE,
                sensor_profile:util.sensor_profile_enum.SENSOR_GYRO,
                gyro: item.gyro,
                accel:item.accel,
                timestamp: item.timestamp,
                escalation: escalation,
                range:{gyroMin:deviceData.Items[0].gyroMin,
                       gyroMax:deviceData.Items[0].gyroMax,
                       accelMax:deviceData.Items[0].accelMax,
                       accelMin:deviceData.Items[0].accelMin}
              };

            
            //await callStepFunction(paramGyro,deviceData.Items[0].userName);

            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramGyro
                    })
                };

        case util.sensor_profile_enum.SENSOR_THC:
            var tempMin = Number(deviceData.Items[0].minTemp);
            var tempMax = Number(deviceData.Items[0].maxTemp);
            var humidMin = Number(deviceData.Items[0].minHumid);
            var humidMax = Number(deviceData.Items[0].maxHumid);
            var capMin = Number(deviceData.Items[0].minCap);
            var capMax = Number(deviceData.Items[0].maxCap);
            if (escalation<=5 && 
                (item.temp>tempMax || item.temp<tempMin) && 
                (item.humid>humidMax || item.humid<humidMin) && 
                (item.cap>capMax || item.cap<capMin)) {
                        escalation ++;
                        await isEscalation(deviceData,escalation);
            }else if (escalation > 0 &&
                    (item.temp<tempMax || item.temp>tempMin) && 
                    (item.humid<humidMax || item.humid>humidMin) && 
                    (item.cap<capMax || item.cap>capMin)){
                    escalation = 0;
                    await isEscalation(deviceData,escalation);
            } 
            await updateDeviceStatus(util.device_status.ONLINE,deviceData.Items[0],item);
            let paramTHC = {device_id:item.device_id,
                deviceStatus:util.device_status.ONLINE,
                sensor_profile:util.sensor_profile_enum.SENSOR_THC,
                temp:item.temp,
                humid:item.humid,
                cap:item.cap,
                battery:item.battery,
                escalation: escalation,
                timestamp: item.timestamp,
                range:{tempMin:deviceData.Items[0].minTemp,
                    tempMax:deviceData.Items[0].maxTemp,
                    humidMax:deviceData.Items[0].maxHumid,
                    humidMin:deviceData.Items[0].minHumid,
                    capMin:deviceData.Items[0].minCap,
                    capMax:deviceData.Items[0].maxCap},
            };
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    Success: true,
                    data:paramTHC
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

const isEscalation = async(deviceData,escalation)=>{
        await dynamoDB.delete({
            TableName:escalationTable,
            Key:{
            "device_id": deviceData.Items[0].device_id,
            "escalation": deviceData.Items[0].escalation
            }
            }, (err,data)=>{
            if (err) {
                console.error("Unable to delete escalation. Error JSON:", JSON.stringify(err, null, 2));
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }
            }
        }).promise();
        deviceData.Items[0].escalation = escalation;
        await dynamoDB.put({
            TableName: escalationTable,
            Item:deviceData.Items[0]
         }, (err,data)=>{
            if (err) {
                console.error("Unable to update escalation. Error JSON:", JSON.stringify(err, null, 2));
                return{
                    statusCode: err.statusCode ? err.statusCode : 500,
                    headers: util.getResponseHeaders(),
                    body: JSON.stringify({
                        error: err.name ? err.name : "Exception",
                        message: err.message ? err.message : "Unknown error"
                    })
                }
            }
        }).promise();
    }


const updateDeviceStatus = async(device_status,device,items)=>{
    let params = {};
    switch(items.sensor_profile){
        case util.sensor_profile_enum.SENSOR_T:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #bat = :bat, #e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#t':   'temp',
                    '#e': 'escalation',
                    '#bat': 'battery'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device.device_id,
                    ':time': moment().unix(),
                    ':t': items.temp,
                    ':e': device.escalation,
                    ':bat': items.battery
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_TH:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #h = :h, #bat = :bat,#e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#t':   'temp',
                    '#h': 'humid',
                    '#e': 'escalation',
                    '#bat': 'battery'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device.device_id,
                    ':time': moment().unix(),
                    ':t': items.temp,
                    ':h': items.humid,
                    ':e': device.escalation,
                    ':bat': items.battery
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_THM:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #h = :h, #moist = :moist, #bat = :bat,#e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#t':   'temp',
                    '#h': 'humid',
                    '#moist': 'moist',
                    '#e': 'escalation',
                    '#bat': 'battery'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device.device_id,
                    ':time': moment().unix(),
                    ':t': items.temp,
                    ':h': items.humid,
                    ':moist': items.moist,
                    ':e': device.escalation,
                    ':bat': items.bat
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_GAS:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #bat = :bat, #gas = :gas,#e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#bat': 'battery',
                    '#e': 'escalation',
                    '#gas': 'gas'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device.device_id,
                    ':time': moment().unix(),
                    '#gas' : items.gas,
                    ':e': device.escalation,
                    ':bat': items.bat
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_GYRO:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #gyro = :gyro, #accel = :accel, #bat = :bat,#e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#bat': 'battery',
                    '#e': 'escalation',
                    '#gyro': 'gyro',
                    '#accel': 'accel'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device_id,
                    ':time': moment().unix(),
                    ':gyro' : items.gas,
                    ':e': device.escalation,
                    ':accel' : items.accel,
                    ':bat': items.bat
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_CTRL:
            params = {
                TableName: deviceTableName,
                Key:{
                    "device_id": device.device_id,
                    "userName": device.userName
                },
                ConditionExpression: '#d = :d',
                UpdateExpression: 'set #s = :s, #time = :time, #bat = :bat, #ctrl = :ctrl,#e = :e',
                ExpressionAttributeNames: {
                    '#s': 'device_status',
                    '#d': 'device_id',
                    '#time': 'timestamp',
                    '#e': 'escalation',
                    '#bat': 'battery',
                    '#ctrl': 'ctrl'
                },
                ExpressionAttributeValues: {
                    ':s': device_status,
                    ':d': device.device_id,
                    ':time': moment().unix(),
                    ':e': device.escalation,
                    ':bat': items.bat,
                    ':ctrl':items.ctrl
                }
            };
            break;
        case util.sensor_profile_enum.SENSOR_THC:
        params = {
            TableName: deviceTableName,
            Key:{
                "device_id": device.device_id,
                "userName": device.userName
            },
            ConditionExpression: '#d = :d',
            UpdateExpression: 'set #s = :s, #time = :time, #t = :t, #h = :h, #cap = :cap, #bat = :bat,#e = :e',
            ExpressionAttributeNames: {
                '#s': 'device_status',
                '#d': 'device_id',
                '#time': 'timestamp',
                '#t':   'temp',
                '#h': 'humid',
                '#cap': 'cap',
                '#e': 'escalation',
                '#bat': 'battery'
            },
            ExpressionAttributeValues: {
                ':s': device_status,
                ':d': device.device_id,
                ':time': moment().unix(),
                ':t': items.temp,
                ':h': items.humid,
                ':cap': items.cap,
                ':e': device.escalation,
                ':bat': items.battery
            }
            };
        default:
            console.log("no sensor found");
    }
    await dynamoDB.update(params,(err,data)=>{
          if(err){
            console.error("Unable to update data. Error JSON:", JSON.stringify(err, null, 2));
            return{
                statusCode: err.statusCode ? err.statusCode : 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    error: err.name ? err.name : "Exception",
                    message: err.message ? err.message : "Unknown error"
                })
            };
          }
      }).promise();
    }
        
    