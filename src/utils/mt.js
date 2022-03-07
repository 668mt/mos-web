let transformFormData = function (data) {
    // Do whatever you want to transform the data
    let ret = ''
    for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
    }
    if (ret.length > 0) {
        ret = ret.substring(0, ret.length - 1);
    }
    return ret;
}

let getClass = function (o) { //判断数据类型
    return Object.prototype.toString.call(o).slice(8, -1);
}

let deepCopy = function (obj) {
    let result, oClass = getClass(obj);

    if (oClass === "Object") result = {}; //判断传入的如果是对象，继续遍历
    else if (oClass === "Array") result = []; //判断传入的如果是数组，继续遍历
    else return obj; //如果是基本数据类型就直接返回

    for (let i in obj) {
        let copy = obj[i];

        if (getClass(copy) === "Object") result[i] = deepCopy(copy); //递归方法 ，如果对象继续变量obj[i],下一级还是对象，就obj[i][i]
        else if (getClass(copy) === "Array") result[i] = deepCopy(copy); //递归方法 ，如果对象继续数组obj[i],下一级还是数组，就obj[i][i]
        else result[i] = copy; //基本数据类型则赋值给属性
    }
    return result;
}

let deepClone = function (data) {
    let type = getClass(data);
    let obj;
    if (type === 'array') {
        obj = [];
    } else if (type === 'object') {
        obj = {};
    } else {
        //不再具有下一层次
        return data;
    }
    if (type === 'array') {
        for (let i = 0, len = data.length; i < len; i++) {
            obj.push(deepClone(data[i]));
        }
    } else if (type === 'object') {
        for (let key in data) {
            obj[key] = deepClone(data[key]);
        }
    }
    return obj;
}

let contains = function (arr, item) {
    if (!arr) {
        return false;
    }
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === item) {
            return true;
        }
    }
    return false;
}

module.exports = {
    transformFormData, deepClone, deepCopy, contains,
    isMobile: function () {
        if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android|ios)/i)) {
            return true;
        }
        return false;
    },
    /**
         * 设置cookie
         * name cookie的名称
         * value cookie的值
         * day cookie的过期时间
         */
    setCookie(name, value, day) {
        if (day !== 0) { //当设置的时间等于0时，不设置expires属性，cookie在浏览器关闭后删除
            let curDate = new Date();
            let curTamp = curDate.getTime();
            let curWeeHours = new Date(curDate.toLocaleDateString()).getTime() - 1;
            let passedTamp = curTamp - curWeeHours;
            let leftTamp = 24 * 60 * 60 * 1000 - passedTamp;
            let leftTime = new Date();
            leftTime.setTime(leftTamp + curTamp);
            document.cookie = name + "=" + escape(value) + ";expires=" + leftTime.toGMTString();
        } else {
            document.cookie = name + "=" + escape(value);
        }
    }
    , getCookie(name) {
        let arr;
        let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    }
}