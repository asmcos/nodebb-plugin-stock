
function getUrlString(match, code) {

    if (code === "") {

        return match;
    }

    return "<a  href=https://klang.org.cn/kline.html?code=" + code +">"+code+"</a>";
}

function replaceContent(data) {

    codeRegex = /((sh|sz|sh.|sz.)[0-9]{6})/g;

    var newData = data;

    newData = newData.replace(codeRegex, getUrlString);

    return newData;
}

var StockCode = {

    stockurl: function(data, callback) {

        if (data && data.postData && data.postData.content) {

            data.postData.content = replaceContent(data.postData.content);
        }


        callback(null, data);
    },

    stockurlPreview: function(data, callback) {

        if (data) {

            data = replaceContent(data);
        }

        callback(null, data);
    }
};

module.exports = StockCode;
