import Vue from 'vue'
import Router from 'vue-router'
import Login from "../pages/login/Login";
import MenuView from "../layouts/MenuView";
import PageView from "../layouts/PageView";
import Bucket from "../pages/bucket/Bucket";
import User from "../pages/user/User";
import Resource from "../pages/resource/Resource";

Vue.use(Router);
let user = JSON.parse(window.localStorage.getItem("currentUser"));
user = user || {};

export default new Router({
    routes: [
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
                name: 'mos',
                icon: 'inbox',
                component: PageView,
                children: [{
                    path: '/user',
                    name: '用户管理',
                    component: User,
                    icon: 'none',
                    invisible:user.isAdmin === false
                }, {
                    path: '/bucket',
                    name: 'bucket管理',
                    component: Bucket,
                    icon: 'none'
                }, {
                    path: '/resource',
                    name: '资源管理',
                    component: Resource,
                    icon: 'none'
                },]
            },]
        },
    ],
    mode: 'history'
})
