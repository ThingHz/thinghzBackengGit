const axios = require('axios');

const url = 'http://awsdevices.qualix.ai:9933/api/data'

var arrId = ['AGNEXTSN00101','AGNEXTSN00076',
           'AGNEXTSN00201','AGNEXTSN00033','AGNEXTSN00077',
           'AGNEXTSN00120','AGNEXTSN00104','AGNEXTSN00059',
           'AGNEXTSN00205','AGNEXTSN00149',
           'AGNEXTSN00153','AGNEXTSN00087','AGNEXTSN00082',
           'AGNEXTSN00055','AGNEXTSN00309'];

var arrBat = ['71','72','77','78','80','61','62','64','66',
              '66','68','70','71','72','73','70']           
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

