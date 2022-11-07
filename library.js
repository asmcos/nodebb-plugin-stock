
const async = require('async');
const axios = require('axios');


function parsedatas(datas){

            var name = datas[0]
            var close1 = datas[2]
            var close = datas[3]


            //开盘前价格为零
            if (close == 0){
                close = close1
            } 

            var rise = 100 * (close - close1) / close1
            if (String(parseFloat(rise)) != "NaN"){ //NaN 是无法直接比较的
                rise = parseFloat(rise).toFixed(2)
            } else {
                rise = 0.000
            }
            close = parseFloat(close).toFixed(2)

            console.log(name,close,rise)
            return [name,close,rise]
}

async function getstockinfo(code){
        
        apihost = "https://api.klang.org.cn/"
        response = await axios.get(apihost+"?list="+code)
        datas = response.data
        lines = datas.split(';')
        var rets = []

        line = lines[0].split('"')[1]
        if (line =='FAILED'){
            alert('股票代码错误，请重新输入')
            return [[0,0,0]]
        }
        
        for (i=0;i<lines.length-1;i++){
            line = lines[i].split('"')[1]
            rets.push(parsedatas(line.split(',')))
        }
        console.log(rets)
        //rets[0][0] = name
        return rets[0][1]
}

async function getPriceString(match, code) {

    if (code === "") {

        return match;
    }
    code1 = code.replace(".","")
    price = await getstockinfo(code1)
    console.log(price)
    d = new Date()
    d = d.toLocaleDateString()
    return "code" + "[时间:"+ d +",价格:"+price+"]";
}



async function getUrlString(match, code) {

    if (code === "") {

        return match;
    }
    code1 = code.replace(".","")
    await getstockinfo(code1)

    return "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"</a>";
}

function replaceContent(data,getString) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;

    var newData = data;

    newData = newData.replace(codeRegex, getString);

    return newData;
}




var StockCode = {

    stockprice:function(data,callback){
       if (data && data.postData && data.postData.content) {

            data.postData.content = replaceContent(data.postData.content,getPriceString);
        }


        callback(null, data);

    },

    stockurl: function(data, callback) {

        if (data && data.postData && data.postData.content) {

            data.postData.content = replaceContent(data.postData.content,getUrlString);
        }


        callback(null, data);
    },

    stockurlPreview: function(data, callback) {

        if (data) {

            data = replaceContent(data,getUrlString);
        }

        callback(null, data);
    }
};

module.exports = StockCode;
