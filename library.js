
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

async function replaceAsync_list(str, regex, asyncFn) {
    const promises = [];
    let list = []
    str.replace(regex, (match, ...args) => {
        list.push(match)
    })
    if (list.length > 0){
        let allprice = await getstockinfo_list(list.join(','))
    }
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(allprice,match, ...args);
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

async function getstockinfo_list(code){

        let apihost = "https://api.klang.org.cn/"
        let response = await axios.get(apihost+"?list="+code)

        const regex =  /var hq_str_(\w+)="([^,]+?),([^,]+),([^,]+),([^,]+),/g;

        // 存储结果
        const result = {};

        // 匹配并提取
        let match;
        while ((match = regex.exec(response.data)) !== null) {
            const variableName = match[1];
            const value = parsedatas(match.slice(2,6));
            result[variableName] = value;
        }

        return result;
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

async function getPriceString(allprice,match, code) {

    if (code === "") {

        return match;
    }
    let code1 = code.replace(".","")
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
    let code1 = code.replace(".","")
    rets = await getstockinfo(code1)
    price = rets[1]
    rise  = rets[2]
    if (rise == 0){
        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":"+rise+" ]</a>";
    } else if (rise >0){
        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":<font color=#ff0000> +"+rise+"</font> ]</a>";
    } else{

        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":<font color=#00ff00>"+rise+"</font> ]</a>";
    }
    return template 
}


async function getUrlString_list(allprice,match, code) {

    if (code === "") {

        return match;
    }
    let code1 = code.replace(".","")
    rets = allprice[code1]
    price = rets[1]
    rise  = rets[2]
    if (rise == 0){
        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":"+rise+" ]</a>";
    } else if (rise >0){
        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":<font color=#ff0000> +"+rise+"</font> ]</a>";
    } else{

        template = "<a  href=https://klang.org.cn/kline.html?code=" + code1 +" target=_blank>"+code+"[ "+price+":<font color=#00ff00>"+rise+"</font> ]</a>";
    }
    return template 
}

async function replaceContent(data,getString,callback) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;

    var newData = data;

    newData = await replaceAsync(newData, codeRegex, getString);

    callback(newData)

}

async function replaceContent_list(data,getString,callback) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;

    var newData = data;

    newData = await replaceAsync_list(newData, codeRegex, getString);

    callback(newData)

}


async function replacePosts(posts,getString,callback) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;
    var i = 0;
    for (i = 0 ;i < posts.length;i++){
        posts[i].content = await replaceAsync_list(posts[i].content, codeRegex, getString);
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

            replacePosts(data.posts,getUrlString_list,function(newposts){
                data.posts = newposts
                callback(null, data);
                
            });
        } else{

            callback(null, data);

        }


    },

    stockurlPreview: function(data, callback) {
        if (data) {

            replaceContent_list(data,getUrlString_list,function(newdata){
                callback(null, newdata);
            });
        }else{
            
            callback(null, data);
        }

    }
};

module.exports = StockCode;
