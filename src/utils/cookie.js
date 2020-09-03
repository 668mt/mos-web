// /**
//      * 设置cookie
//      * name cookie的名称
//      * value cookie的值
//      * day cookie的过期时间
//      */
// let setCookie = function (name, value, day) {
//     if (day !== 0) { //当设置的时间等于0时，不设置expires属性，cookie在浏览器关闭后删除
//         let curDate = new Date();
//         let curTamp = curDate.getTime();
//         let curWeeHours = new Date(curDate.toLocaleDateString()).getTime() - 1;
//         let passedTamp = curTamp - curWeeHours;
//         let leftTamp = 24 * 60 * 60 * 1000 - passedTamp;
//         let leftTime = new Date();
//         leftTime.setTime(leftTamp + curTamp);
//         document.cookie = name + "=" + escape(value) + ";expires=" + leftTime.toGMTString();
//     } else {
//         document.cookie = name + "=" + escape(value);
//     }
// }
//
// let getCookie = function (name) {
//     let arr;
//     let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
//     if (arr = document.cookie.match(reg)) {
//         return unescape(arr[2]);
//     } else {
//         return null;
//     }
// }

export default {
    getCookie: function (name) {
        let arr;
        let reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = document.cookie.match(reg)) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    }
}