/**
 * Route: GET /note/n/{device_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const escalatedDeviceTable = process.env.ESCALATION_TABLE;


exports.handler = async (event) => {
    try {
        let userName = util.getUserName(event.headers);
        let deviceEscalationLevel = decodeURIComponent(event.pathParameters.level);
        console.log(deviceEscalationLevel);
        let params = {
            TableName: escalatedDeviceTable,
            IndexName: "gsi_user",
            KeyConditionExpression: "userName = :userName and escalation = :level",
            ExpressionAttributeValues: {
                ":userName": userName,
                ":level": Number(deviceEscalationLevel)
            }
        };


        let isEscalation = await dynamodb.query(params).promise();
        if (isEscalation.Count == 0){
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: false,
                                      level: deviceEscalationLevel,
                                      error:util.user_error.NO_ESCALATED_DEVICES}),
            };
        }
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({Success: true,
                                      level: deviceEscalationLevel,
                                      data:isEscalation.Items})
            };
        
    } catch (err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        };
    }
}