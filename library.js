function getSetString(match, src, width, height) {

    if (width === "" && height === "") {

        return match;
    }

    return "<img src=\"" + src + "\" width=\"" + width + "\" height=\"" + height + "\"" + " style=\"height:" + height + "px;\"";
}

function getPercentString(match, src, percent) {
    return "<img src=\"" + src + "\" width=\"" + percent + "%\"" + " height=\"" + 'auto' + "\"";
}

function getWidthString(match, src, width) {

    if (width === "") {

        return match;
    }

    return "<img src=\"" + src + "\" width=\"" + width + "\" height=\"" + 'auto' + "\"";
}

function replaceContent(data) {

    percentRegex = /<img src="([^@]*)@([0-9]+)%(25)?"/g;
    absoluteRegex = /<img src="([^@]*)@([0-9]*)x([0-9]*)"/g;
    multiplyRegex = /<img src="([^@]*)@([0-9]*\.?[0-9]*)"/g;
    var newData = data;

    newData = newData.replace(percentRegex, getPercentString);
    newData = newData.replace(multiplyRegex, getWidthString);
    newData = newData.replace(absoluteRegex, getSetString);

    return newData;
}

var ImageSizer = {

    sizeImages: function(data, callback) {

        if (data && data.postData && data.postData.content) {

            data.postData.content = replaceContent(data.postData.content);
        }


        callback(null, data);
    },

    sizeImagesInComposerPreview: function(data, callback) {

        if (data) {

            data = replaceContent(data);
        }

        callback(null, data);
    }
};

module.exports = ImageSizer;
