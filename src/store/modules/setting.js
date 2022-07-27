import configs from '@/config'

export default {
    namespaced: true,
    state: {
        isMobile: false,
        theme: 'dark',
        layout: 'side',
        systemName: 'MOS对象存储',
        copyright: '668mt',
        // footerLinks: footerLinks,
        multiPage: false,
        animates: configs.animates,
        configs,
        animate: {
            name: 'bounce',
            direction: 'left'
        },

    },
    getters:{
        getConfigs(state){
            return state.configs;
        }
    },
    mutations: {
        setDevice(state, isMobile) {
            state.isMobile = isMobile
        },
        setTheme(state, theme) {
            state.theme = theme
        },
        setLayout(state, layout) {
            state.layout = layout
        },
        setMultiPage(state, multiPage) {
            state.multiPage = multiPage
        },
        setAnimate(state, animate) {
            state.animate = animate
        }
    }
}
