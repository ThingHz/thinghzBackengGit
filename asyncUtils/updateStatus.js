const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
AWS.config.correctClockSkew = true;
const _ = require('underscore');
//const util = require('./util');
const moment = require('moment');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.DEVICE_TABLE;
const secMultiply = 60;
const minMultiple = 90;
let nowTimestamp = moment().unix();

exports.handler  = async(event)=>{
    console.log("stepFunctionExecution");
    var timeDifference =  minMultiple*secMultiply;
    var expectedTimeStamp = nowTimestamp - timeDifference;
    var paramsDeviceTime = {
        TableName: deviceTableName,
        FilterExpression: '#timestamp < :expect_time',
        ExpressionAttributeValues: {':expect_time':expectedTimeStamp},
        ExpressionAttributeNames: {
            "#timestamp": "timestamp"
          }
    };
    let isOffline = await dynamoDB.scan(paramsDeviceTime).promise();
    if(isOffline.Count=0){
        return;
    }

    var userDeviceMap = _.map(isOffline.Items, (collection)=>{
        return{device:collection.device_id,user:collection.userName};
    });

    await updateDeviceStatus(userDeviceMap);
}

const updateDeviceStatus = async(deviceMap)=>{
    for (i=0; i<deviceMap.length;i++){
        let paramMap = {
            TableName: deviceTableName,
            Key: {"userName": deviceMap[i].user, "device_id":deviceMap[i].device},
            ConditionExpression: '#d = :d',
            UpdateExpression: 'set #s = :s',
            ExpressionAttributeNames: {
                '#s': 'device_status',
                '#d': 'device_id'
            },
            ExpressionAttributeValues: {
                ':s': 'offline',
                ':d': deviceMap[i].device
            }
        } 
        await dynamoDB.update(paramMap,(err,data)=>{
            if(err){
              console.error("Unable to update device Status. Error JSON:", JSON.stringify(err, null, 2));
            }else{
                console.error("Successful update device Status.", JSON.stringify(data, null, 2));
            }
        }).promise();
    }   
}

    