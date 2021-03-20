const axios = require('axios');

const url = 'http://awsdevices.qualix.ai:9933/api/data'

var arrId = ['AGNEXTSN00152','AGNEXTSN00113','AGNEXTSN00057',
           'AGNEXTSN00146','AGNEXTSN00202',
           'AGNEXTSN00103',
           'AGNEXTSN00044','AGNEXTSN00341',
           'AGNEXTSN00315','AGNEXTSN00322',
           'AGNEXTSN00122','AGNEXTSN00136'];

var arrBat = ['70','72','73','69','71','72',
              '69','74','74','74','72','69'];           
exports.handler = async (event) => {
    for (var i=0; i<arrId.length; i++){
        var temp = generateTemp(60,50)
        let postData = {
            deviceId : arrId[i],
            macId : '2ef',
            temp : String(temp),
            batteryLevel : arrBat[i]
        }
        try{
            const resp = await axios.post(url, postData)
            console.log(resp.data.config);     
        }catch (err){
            console.log(err.response.data);
        }
    }
}

var generateTemp = (maxValue,minValue)=>{
    var randomFloat = ((Math.random()*(maxValue-minValue)+minValue)/10).toFixed(1);
    console.log(randomFloat);
    return randomFloat;
}

