
const async = require('async');
const axios = require('axios').default;

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
        return rets
}

function getPriceString(match, code) {

    if (code === "") {

        return match;
    }
    code1 = code.replace(".","")

    console.log(rets)
    return "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"</a>";
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
