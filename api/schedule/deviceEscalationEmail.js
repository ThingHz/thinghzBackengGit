const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
AWS.config.correctClockSkew = true;
const _ = require('underscore');
const moment = require('moment');
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
        ":s": util.device_status.ONLINE
    },
    ExpressionAttributeNames: {
        "#device_status": "device_status"
      }
}

exports.handler = async (event) => {
    
    let isOnline = await dynamoDB.scan(paramStatus).promise();
    await emailEscalation(isOnline);
    }
    
    const emailEscalation = async(isOnline)=>{

        for(var i=0; i<=isOnline.Items.length; i++){
            console.log(i);
            var userItems = isOnline.Items[i];
            console.log(userItems);
            if(userItems.isAdmin == util.admin_enum.IS_OPERATOR && userItems.escalation > 0){
                let paramsChildUser = {
                    TableName: childUser,
                    KeyConditionExpression: "userName = :userName",
                    ExpressionAttributeValues: {
                        ":userName": userItems.userName
                    }
                  };
                  var childUserData = await dynamoDB.query(paramsChildUser).promise();
                  await emailChildUser(childUserData.Items[0],userItems);
            }else if(userItems.escalation > 0){
                let paramParentUser = {
                    TableName: userTable,
                    KeyConditionExpression: "userName = :userName",
                    ExpressionAttributeValues: {
                        ":userName": userItems.userName
                    }
                  };
                    var parentUserData = await dynamoDB.query(paramParentUser).promise();
                    await emailParentUser(parentUserData.Items[0],userItems);
            }
                   
        }
    }

    var emailChildUser = async (childUserData,userItems)=>{
        const emailAttr = {
            Destination: {
                ToAddresses: [childUserData.email_id]
            },
            Message: {
               Body: {
                Text: { Data:  `Hi! ${childUserData.userName},\n${userItems.device_name}(${userItems.device_id}) at location ${childUserData.location} is showing escalation level ${userItems.escalation}.Check the chiller/freezer and maintain sustainable temp and humid`},
                },
                Subject: {Data: `${userItems.device_name}-escalation-level ${userItems.escalation}`}
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


    var emailParentUser = async (parentUserData,userItems)=>{
        const emailAttr = {
            Destination: {
                ToAddresses: [parentUserData.email_id]
            },
            Message: {
               Body: {
                Text: { Data:  `Hi! ${parentUserData.userName},\n${userItems.device_name}(${userItems.deviceId}) at location {childUserData.location} is showing escalation level ${escalation}.\nCheck the chiller/freezer and maintain sustainable temp and humid`},
                },
                Subject: {Data: `${userItems.device_name}-escalation-level ${userItems.escalation}`}
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
       
    


