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
        url: 'src'
    }
});

Vue.prototype.$http = axios;
Vue.prototype.$mt = mt;
Vue.config.productionTip = false;
Vue.use(Antd);
axios.defaults.withCredentials = true;
axios.interceptors.response.use(response => {
    if (response.data.status !== 'ok') {
        Vue.prototype.$message.error(response.data.message);
        throw response.data.message;
    }
    return response;
}, error => {
    if (error.request.responseURL.endsWith("/signin")) {
        Vue.prototype.$message.error("登录已过期");
        setTimeout(function () {
            router.replace({
                name: '登录'
            });
        }, 1500);
    }
});

router.beforeEach((to, from, next) => {
    router.options.routes = router.options.getRoutes();
    next();
})

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app')
