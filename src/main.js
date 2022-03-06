import Vue from 'vue'
import Antd from 'ant-design-vue';
import App from './App';
import 'ant-design-vue/dist/antd.css';
import router from './router/router';
import axios from 'axios'
import mt from './utils/mt'
import store from './store'
import 'animate.css/source/animate.css'

import 'viewerjs/dist/viewer.css'
import Viewer from 'v-viewer'

Vue.use(Viewer, {
    defaultOptions: {
        zIndex: 9999,
        inline: false,
        toolbar: true,//显示工具栏
        tooltip: true,//显示缩放百分比
        movable: true,//是否可移动
        zoomable: true,//是否可缩放
        rotatable: false,//是否可旋转
        scalable: false,//是否可翻转
        transition: true,
        fullscreen: false,
        keyboard: true,
        url: 'origin'
    }
});

Vue.prototype.$http = axios;
Vue.prototype.$mt = mt;
Vue.config.productionTip = false;
Vue.use(Antd);
axios.defaults.withCredentials = true;
axios.interceptors.response.use(response => {
    if (response.data.status !== undefined && response.data.status !== 'ok') {
        Vue.prototype.$message.error(response.data.message);
        throw response.data.message;
    }
    return response;
}, error => {
    const response = error.response;
    const $message = Vue.prototype.$message;
    const url = error.request.responseURL;
    if (url.endsWith("/signin")) {
        $message.error("登录已过期");
        setTimeout(function () {
            router.replace({
                name: '登录'
            });
        }, 1500);
    } else if (response.status === 403) {
        Vue.prototype.$notification.error({
            message: '没有权限访问',
            description: url,
            style: 'word-wrap: break-word;word-break: break-all;width: 100%;'
        });
    }
    return Promise.reject(error);
});

router.beforeEach((to, from, next) => {
    router.options.routes = router.options.getRoutes();
    next();
})
let $perms = [];
Vue.prototype.hasPerm = function (bucketName, perm) {
    let ownPerms = $perms[bucketName];
    if (ownPerms) {
        for (let p of ownPerms) {
            if (p === perm.toUpperCase()) {
                return true;
            }
        }
    }
    return false;
}
Vue.prototype.refreshPerm = function () {
    this.$http.get('/member/bucket/grant/perms/own').then(response => {
        let arr = response.data.result;
        $perms = {};
        for (let vo of arr) {
            $perms[vo.bucketName] = vo.perms;
        }
    });
}

new Vue({
    router,
    store,
    render: h => h(App),
    mounted() {
        if (this.$route.path !== '/signin') {
            this.refreshPerm();
        }
    }
}).$mount('#app')
