const axios = require('axios');

const url = 'http://awsdevices.qualix.ai:9933/api/data'

var arrId = ['AGNEXTSN00148','AGNEXTSN00208',
           'AGNEXTSN00305','AGNEXTSN00351',
           'AGNEXTSN00035','AGNEXTSN00093','AGNEXTSN00354',
           'AGNEXTSN00106','AGNEXTSN00094','AGNEXTSN00018',
           'AGNEXTSN00303','AGNEXTSN00358',
           'AGNEXTSN00041','AGNEXTSN00096','AGNEXTSN00133','AGNEXTSN00159'];

var arrBat = ['68','69','66','67','75','74','77','70',
              '66','68','72','72','70','71','71','71'];           
exports.handler = async (event) => {
    for (var i=0; i<arrId.length; i++){
        var temp = generateTemp(60,50)
        let postData = {
            deviceId : arrId[i],
            macId : '2ef',
            temp : String(temp),
            batteryLevel : arrBat[i]
        }
        try{git
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

