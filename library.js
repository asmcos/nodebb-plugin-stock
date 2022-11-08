
const async = require('async');
const axios = require('axios');

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


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
            //return [[0,0,0]]
            return [0,0]
        }
        
        for (i=0;i<lines.length-1;i++){
            line = lines[i].split('"')[1]
            rets.push(parsedatas(line.split(',')))
        }
        //rets[0][0] = name

        console.log(rets[0][1])
        return rets[0]
}

async function getPriceString(match, code) {

    if (code === "") {

        return match;
    }
    code1 = code.replace(".","")
    rets = await getstockinfo(code1)
    price = rets[1]
    rise  = rets[2]
    if (price == 0) return code

    d = new Date()
    d = d.toLocaleDateString()
    return code + "[时间:"+ d +",价格:"+price+"]";
}



async function getUrlString(match, code) {

    if (code === "") {

        return match;
    }
    code1 = code.replace(".","")
    rets = await getstockinfo(code1)
    price = rets[1]
    rise  = rets[2]

    return "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"["+price+":"+rise+"]</a>";
}

async function replaceContent(data,getString,callback) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;

    var newData = data;

    newData = await replaceAsync(newData, codeRegex, getString);

    callback(newData)

}
async function replacePosts(posts,getString,callback) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;
    var i = 0;
    for (i = 0 ;i < posts.length;i++){
        posts[i].content = await replaceAsync(posts[i].content, codeRegex, getString);
    }
    callback(posts)
}


var StockCode = {

    getPosts: function(data,callback){
       
       if (data) {
            console.log(data)
            callback(null, data);
        } else {
            callback(null, data);
        }
    },
   stockprice: function(data,callback){

       if (data && data.post && data.post.content) {

            replaceContent(data.post.content,getPriceString,function(newcontent){
                console.log(newcontent)
                data.post.content = newcontent
                data.data.content = newcontent
                callback(null, data);
            });
        } else {
            callback(null, data);
        }
    },


    stockurl: function(data, callback) {

        //if (data && data.postData && data.postData.content) {
        if (data && data.posts ) {

            replacePosts(data.posts,getUrlString,function(newposts){
                data.posts = newposts
                callback(null, data);
                
            });
        } else{

            callback(null, data);

        }


    },

    stockurlPreview: function(data, callback) {
        if (data) {

            replaceContent(data,getUrlString,function(newdata){
                callback(null, newdata);
            });
        }else{
            
            callback(null, data);
        }

    }
};

module.exports = StockCode;
