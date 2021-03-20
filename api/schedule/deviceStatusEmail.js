const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
AWS.config.correctClockSkew = true;
const _ = require('underscore');
const util = require('../util.js');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SES = new AWS.SES();
const deviceTableName = process.env.DEVICE_TABLE;
const userTable = process.env.USER_TABLE;
const childUser = process.env.CHILD_USER_TABLE;

let paramStatus = {
    TableName: deviceTableName,
    FilterExpression: "#device_status = :s",
    ExpressionAttributeValues: {
        ":s": util.device_status.OFFLINE
    },
    ExpressionAttributeNames: {
        "#device_status": "device_status"
      }
}

exports.handler = async (event) => {
    
    let isOffline = await dynamoDB.scan(paramStatus).promise();
    if(isOffline.ScannedCount=0){
        return;
    }
    await emailStatus(isOffline);
    }
    

    const emailStatus = async(isOffline)=>{   
        for(var i=0; i<isOffline.Items.length; i++){
            var userItems = isOffline.Items[i];
            console.log(userItems);
            console.log(userItems.isAdmin);
            if(userItems.isAdmin == util.admin_enum.IS_OPERATOR){
                console.log("Child User");
                let paramsChildUser = {
                    TableName: childUser,
                    KeyConditionExpression: "userName = :userName",
                    ExpressionAttributeValues: {
                        ":userName": userItems.userName
                    }
                  };
                  var childUserData = await dynamoDB.query(paramsChildUser).promise();
                  await emailChildUser(childUserData.Items[0],userItems.device_id,userItems.device_name);
            }else{
                console.log("Parent User");
                let paramParentUser = {
                    TableName: userTable,
                    KeyConditionExpression: "userName = :userName",
                    ExpressionAttributeValues: {
                        ":userName": userItems.userName
                    }
                  };
                    var parentUserData = await dynamoDB.query(paramParentUser).promise();
                    await emailParentUser(parentUserData.Items[0],userItems.device_id,userItems.device_name);
            }
                   
        }
    }

    var emailChildUser = async (childUserData,deviceId,deviceName)=>{
        console.log(childUserData);
        const emailAttr = {
            Destination: {
                ToAddresses: [childUserData.email_id]
            },
            Message: {
               Body: {
                Text: { Data:  `Hi! ${childUserData.userName},\n${deviceName}(${deviceId}) at location ${childUserData.location} is offline. check internet connectivity or check the device power`},
                },
                Subject: {Data: `${deviceName}-offline`}
            },
            Source: process.env.EMAIL_ID
            };
        try {
        await SES.sendEmail(emailAttr,(err,data)=>{
            if(err){
                console.error("Unable to send mail. Error JSON:", JSON.stringify(err, null, 2));
              }else{
                  console.error("Successful sent mail", JSON.stringify(data, null, 2));
              }
        }).promise();
    } catch (error) {
        console.log('error sending email ', error);
    }
    }


    var emailParentUser = async (parentUserData,deviceId,deviceName)=>{
        console.log(parentUserData)
        const emailAttr = {
            Destination: {
                ToAddresses: [parentUserData.email_id]
            },
            Message: {
               Body: {
                Text: { Data:  `Hi! ${parentUserData.userName},\n${deviceName}(${deviceId}) is offline. check internet connectivity or check the device power`},
                },
                Subject: {Data: `${deviceName}-offline`}
            },
            Source: process.env.EMAIL_ID
            };
        try {
        await SES.sendEmail(emailAttr,(err,data)=>{
            if(err){
                console.error("Unable to send mail. Error JSON:", JSON.stringify(err, null, 2));
              }else{
                  console.error("Successful sent mail", JSON.stringify(data, null, 2));
              }
        }).promise();
    } catch (error) {
        console.log('error sending email ', error);
    }
    }
       
    


