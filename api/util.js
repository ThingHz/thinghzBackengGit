var contentType = require('content-type')

const getUserId = (headers) => {
    return headers.app_user_id;
}

const getUserName = (headers) => {
    return headers.app_user_name;
}

const getContentType = (headers) => {
    var content_type = headers['Content-Type'];
    return content_type;
}

const varifyToken = (headers) => {
    var bearerToken = headers.Authorization;
    const token = bearerToken.replace('Bearer ', '')
    return token;
} 

const getResponseHeaders = () => {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Origin': '*'
    }
}

let postErrorResponse =(err)=>{ 
    return {
    statusCode: err.statusCode ? err.statusCode : 500,
    headers: util.getResponseHeaders(),
    body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error"
    })
}};

const user_error = {
    DEVICE_ERROR : 'device not available. Add the device first',
    NO_DEVICE_AT_TIME: 'no device data on following date',
    NO_AUTH: 'Not authorized user',
    NO_OFFLINE: 'No offline devices',
    NO_ONLINE: 'No online devices',
    NO_ESCALATION: 'No escalation yet',
    NO_ESCALATED_DEVICES: 'No escalated devices',
    USER_NAME: 'user doesnot exixts',
    EMAIL: 'email is already register',
    SENSOR_PROFILE: 'this sensor does not exist',
    DEVICE_EXISTS : 'deviceId already exixts',
    No_USER: 'invalid username/password',
    INTERNAL: 'internal error',
    BAD_PASS: 'invalid password',
    EXPIRE:   'user expired',
    USER_EXISTS:'username already taken', 
    NO_CHILD_USER: 'no user assigned to admin'
  }

const device_status = {
    ONLINE: 'online',
    OFFLINE: 'offline'
}

const sensor_profile_enum = {
    SENSOR_NONE :  1,
    SENSOR_T    :  2,
    SENSOR_TH   :  3,
    SENSOR_GAS  :  4,
    SENSOR_GYRO :  5,
    SENSOR_THM  :  6,
    SENSOR_CTRL :  7,
    SENSOR_THC :   8
}

const admin_enum = {
    IS_OPERATOR : 0,
    IS_ADMIN : 1  
}

module.exports = {
    getUserId,
    getUserName,
    getResponseHeaders,
    user_error,
    device_status,
    sensor_profile_enum,
    getContentType,
    postErrorResponse,
    admin_enum,
    varifyToken
}