<template>
	<a-layout id="components-layout-demo-custom-trigger" style="height:100%;">
		<a-layout-sider v-model="collapsed" :trigger="null" collapsible>
			<div class="logo"/>
			<a-menu theme="dark" mode="inline" :default-selected-keys="['/table']" :selectedKeys="selectedKeys"
					@select="menuSelect">
				<a-sub-menu :key="menu.path" v-for="menu in menus">
					<span slot="title"><a-icon type="mail"/><span>oss</span></span>
					<a-menu-item v-for="item in menu.children" :key="item.path">
						<router-link :to="item.path">
							<a-icon v-if="item.icon != null" :type="item.icon"/>
							<span>{{item.name}}</span>
						</router-link>
					</a-menu-item>
				</a-sub-menu>
			</a-menu>
		</a-layout-sider>
		<a-layout>
			<a-layout-header style="background: #fff; padding: 0">
				<a-icon
						class="trigger"
						:type="collapsed ? 'menu-unfold' : 'menu-fold'"
						@click="() => (collapsed = !collapsed)"
				/>
			</a-layout-header>
			<a-layout-content
					:style="{ margin: '24px 16px', padding: '24px', background: '#fff', minHeight: '280px' }"
			>
				<router-view/>
			</a-layout-content>
		</a-layout>
	</a-layout>
</template>
<script>
    const menus = [{
        name: 'oss',
        icon: 'user',
        path: '/oss',
        children: [{
            name: 'Home',
            path: '/home',
            icon: 'user'
        }, {
            name: 'About',
            path: '/about',
            icon: 'user'
        }, {
            name: 'Table',
            path: '/table',
            icon: 'user'
        }]
    }];
    export default {
        name: "MenuView",
        data() {
            return {
                menus: menus,
                collapsed: false,
                selectedKeys: []
            };
        },
        mounted() {
            this.selectedKeys = [this.$route.path]
        },
        methods: {
            menuSelect({item, key, selectedKeys}) {
                this.selectedKeys = [key]
            }
        }

    };
</script>
<style>
	#components-layout-demo-custom-trigger .trigger {
		font-size: 18px;
		line-height: 64px;
		padding: 0 24px;
		cursor: pointer;
		transition: color 0.3s;
	}
	
	#components-layout-demo-custom-trigger .trigger:hover {
		color: #1890ff;
	}
	
	#components-layout-demo-custom-trigger .logo {
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
		margin: 16px;
	}
</style>