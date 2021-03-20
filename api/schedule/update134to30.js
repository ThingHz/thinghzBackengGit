const axios = require('axios');

const url = 'http://awsdevices.qualix.ai:9933/api/data'

var arrId = ['AGNEXTSN00207','AGNEXTSN00327','AGNEXTSN00318','AGNEXTSN00314',
            'AGNEXTSN00319','AGNEXTSN00328','AGNEXTSN00332','AGNEXTSN00324','AGNEXTSN00097','AGNEXTSN00061',
           'AGNEXTSN00313','AGNEXTSN00306','AGNEXTSN00316',
           'AGNEXTSN00043'];

var arrBat = ['72','73','69','70','71','72','66','68',
              '69','70','74','74','74','69'];     
                    
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

