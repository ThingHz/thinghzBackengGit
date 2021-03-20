
    const axios = require('axios');

    const url = 'http://awsdevices.qualix.ai:9933/api/data'
    
    var arrId = ['AGNEXTSN00080',
                'AGNEXTSN00092',
               'AGNEXTSN00081',
               'AGNEXTSN00310','AGNEXTSN00338',
               'AGNEXTSN00142','AGNEXTSN00129','AGNEXTSN00027',
               'AGNEXTSN00311','AGNEXTSN00307'];
    
    var arrBat = ['70','74',
                  '71','70','73','70','71','72','67','68'];           
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
    
    