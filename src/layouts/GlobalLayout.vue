<template>
	<a-config-provider :locale="locale">
		<a-layout class="global-layout">
			<drawer v-if="isMobile" :openDrawer="collapsed" @change="onDrawerChange">
				<sider-menu :theme="theme" :menuData="menuData" :collapsed="false" :collapsible="false"
							@menuSelect="onMenuSelect"/>
			</drawer>
			<sider-menu :theme="theme" v-else-if="layout === 'side'" :menuData="menuData" :collapsed="collapsed"
						:collapsible="true"/>
<!--			    <drawer :open-drawer="showSetting" placement="right"  @change="onSettingDrawerChange">-->
<!--			      <div class="setting" slot="handler">-->
<!--			        <a-icon :type="showSetting ? 'close' : 'setting'" />-->
<!--			      </div>-->
<!--			      <setting />-->
<!--			    </drawer>-->
			<a-layout class="global-layout-main">
				<global-header :menuData="menuData" :collapsed="collapsed" @toggleCollapse="toggleCollapse"/>
				<a-layout-content class="global-layout-content"
								  :style="{minHeight: minHeight, padding: '10px 0px 0', position: 'relative'}">
					<slot></slot>
				</a-layout-content>
<!--				<a-layout-footer style="padding: 0px">-->
<!--					<global-footer :link-list="linkList" :copyright="copyright"/>-->
<!--				</a-layout-footer>-->
			</a-layout>
		</a-layout>
	</a-config-provider>
</template>

<script>
    import GlobalHeader from './GlobalHeader'
    import GlobalFooter from './GlobalFooter'
    import zhCN from 'ant-design-vue/es/locale/zh_CN';
    // import Drawer from '../components/tool/Drawer'
    import SiderMenu from '../components/menu/SiderMenu'
    import Setting from '../components/setting/Setting'

    const minHeight = window.innerHeight - 64 - 122

    let menuData = []

    export default {
        name: 'GlobalLayout',
        components: {
            // Setting,
            SiderMenu,
            // Drawer,
            // GlobalFooter,
			GlobalHeader
        },
        data() {
            return {
                locale: zhCN,
                minHeight: minHeight + 'px',
                collapsed: false,
                menuData: menuData,
                showSetting: false
            }
        },
        provide() {
            return {
                layoutMinHeight: minHeight,
            }
        },
        computed: {
            isMobile() {
                return this.$store.state.setting.isMobile
            },
            theme() {
                return this.$store.state.setting.theme
            },
            layout() {
                return this.$store.state.setting.layout
            },
            linkList() {
                return this.$store.state.setting.footerLinks
            },
            copyright() {
                return this.$store.state.setting.copyright
            }
        },
        methods: {
            toggleCollapse() {
                this.collapsed = !this.collapsed
            },
            onDrawerChange(show) {
                this.collapsed = show
            },
            onMenuSelect() {
                this.toggleCollapse()
            },
            onSettingDrawerChange(val) {
                this.showSetting = val
            }
        },
        beforeCreate() {
            menuData = this.$router.options.routes.find((item) => item.path === '/').children
        }
    }
</script>

<style lang="less" scoped>
	.global-layout {
		height: 100vh;
		
		.global-layout-main {
			height: 100vh;
			overflow-y: auto;
			scrollbar-width: thin;
			-ms-overflow-style: none;
			
			&::-webkit-scrollbar {
				width: 3px;
				height: 1px;
			}
			
			&::-webkit-scrollbar-thumb {
				border-radius: 3px;
			}
			
			&::-webkit-scrollbar-track {
				-webkit-box-shadow: inset 0 0 1px rgba(0, 0, 0, 0);
				border-radius: 3px;
			}
		}
		
		.global-layout-content {
		}
		
		.setting {
			background-color: #1890ff;
			color: #fff;
			border-radius: 5px 0 0 5px;
			line-height: 40px;
			font-size: 22px;
			width: 40px;
			height: 40px;
			box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
		}
	}
</style>
