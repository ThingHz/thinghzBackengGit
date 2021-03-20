const axios = require('axios');

const url = 'http://awsdevices.qualix.ai:9933/api/data'

var arrId = ['AGNEXTSN00308','AGNEXTSN00304','AGNEXTSN00130',
           'AGNEXTSN00344','AGNEXTSN00353','AGNEXTSN00102',
           'AGNEXTSN00325','AGNEXTSN00356',
           'AGNEXTSN00052','AGNEXTSN00083','AGNEXTSN00034',
           'AGNEXTSN00333','AGNEXTSN00045',
           'AGNEXTSN00123','AGNEXTSN00132','AGNEXTSN00107',
           'AGNEXTSN00144','AGNEXTSN00337'];

var arrBat = ['70','77','78','79','80','81','82','83','64',
              '65','66','68','69','70','71','71','71','69'];           
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

