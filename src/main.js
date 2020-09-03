import Vue from 'vue'
import Antd from 'ant-design-vue';
import App from './App';
import 'ant-design-vue/dist/antd.css';
import router from './router/router';
import axios from 'axios'
import mt from './utils/mt'
import store from './store'
import 'animate.css/source/animate.css'

Vue.prototype.$http = axios;
Vue.prototype.$mt = mt;
Vue.config.productionTip = false;
Vue.use(Antd);
// axios.defaults.baseURL = "http://localhost:9700";
axios.defaults.withCredentials = true;
axios.interceptors.response.use(response => {
    // Vue.prototype.$message.error("登录过期")
    // router.replace({
    //     path:'/login'
    // })
    if (response.data.status !== 'ok') {
        Vue.prototype.$message.error(response.data.message);
        throw response.data.message;
    }
    return response;
})

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app')
