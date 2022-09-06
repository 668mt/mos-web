import Vue from 'vue'
import Router from 'vue-router'
import Login from "../pages/login/Login";
import MenuView from "../layouts/MenuView";
// import PageView from "../layouts/PageView";
import User from "../pages/user/User";
import Bucket from "../pages/bucket/Bucket";
import Resource from "../pages/resource/Resource.vue";
import Client from "../pages/client/Client";
import Home from "../pages/home/Home";
import Trash from "../pages/resource/Trash";
import RouteView from "../layouts/RouteView";

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
            children: [
                {
                    path: '/home',
                    name: '总览',
                    component: Home,
                    icon: 'area-chart',
                },
                {
                    path: '/resource',
                    name: '文件中心',
                    component: RouteView,
                    icon: 'folder-open',
                    children: [
                        {
                            path: '/resource',
                            name: '文件管理',
                            component: Resource,
                            icon: 'none'
                        },
                        {
                            path: '/trash',
                            name: '回收站',
                            component: Trash,
                            icon: 'none'
                        },
                    ]
                },
                {
                    path: '/bucket',
                    name: '桶管理',
                    component: Bucket,
                    icon: 'shop'
                },
                {
                    path: '/manage',
                    name: '管理中心',
                    component: RouteView,
                    icon: 'desktop',
                    invisible: !user.isAdmin,
                    children: [
                        {
                            path: '/manage/client',
                            name: '服务器管理',
                            component: Client,
                            icon: 'none',
                            invisible: !user.isAdmin
                        },
                        {
                            path: '/manage/user',
                            name: '用户管理',
                            component: User,
                            icon: 'none',
                            invisible: !user.isAdmin
                        },
                    ]
                },
            ]
        },
        {
            name: '资源可视',
            path: '/viewer',
            component: () => import('../layouts/RouteView'),
            children: [{
                name: '视频',
                path: '/viewer/video',
                component: () => import('../pages/viewer/VideoViewer.vue')
            }, {
                name: '图库',
                path: '/viewer/gallery',
                component: () => import('../pages/viewer/GalleryViewer.vue')
            }]
        }
    ];
}

export default new Router({
    routes: getRoutes(),
    mode: 'history',
    getRoutes
})
