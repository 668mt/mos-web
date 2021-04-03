import Vue from 'vue'
import Router from 'vue-router'
import Login from "../pages/login/Login";
import MenuView from "../layouts/MenuView";
import PageView from "../layouts/PageView";
import User from "../pages/user/User";
import Bucket from "../pages/bucket/Bucket";
import Resource from "../pages/resource/Resource.vue";
import Client from "../pages/client/Client";
import Home from "../pages/home/Home";
import Trash from "../pages/resource/Trash";

Vue.use(Router);

let getRoutes = function () {
    let user = JSON.parse(window.localStorage.getItem("currentUser"));
    user = user || {};
    return [
        {
            path: '/signin',
            name: '登录',
            component: Login
        },
        {
            path: '*',
            redirect: '/signin'
        },
        {
            path: '/',
            component: MenuView,
            redirect: '/signin',
            children: [{
                path: '/content',
                name: 'MOS',
                icon: 'inbox',
                component: PageView,
                children: [{
                    path: '/home',
                    name: '主页',
                    component: Home,
                    icon: 'none'
                }, {
                    path: '/client',
                    name: '服务器管理',
                    component: Client,
                    icon: 'none',
                    invisible: !user.isAdmin
                }, {
                    path: '/user',
                    name: '用户管理',
                    component: User,
                    icon: 'none',
                    invisible: !user.isAdmin
                }, {
                    path: '/bucket',
                    name: '桶管理',
                    component: Bucket,
                    icon: 'none'
                }, {
                    path: '/trash',
                    name: '回收站',
                    component: Trash,
                    icon: 'none'
                }, {
                    path: '/resource',
                    name: '资源管理',
                    component: Resource,
                    icon: 'none'
                },]
            },]
        },
    ];
}

export default new Router({
    routes: getRoutes(),
    mode: 'history',
    getRoutes
})
