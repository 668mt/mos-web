import configs from '@/config'

export default {
    namespaced: true,
    state: {
        isMobile: false,
        // theme: 'dark',
        theme: 'light',
        // layout: 'side',
        layout: 'head',
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
        bucket:undefined
    },
    getters:{
        getConfigs(state){
            return state.configs;
        },
        getBucket(state){
            return state.bucket;
        }
    },
    mutations: {
        setBucket(state,bucket){
            state.bucket = bucket;
        },
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
