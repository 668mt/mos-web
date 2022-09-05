module.exports = {
    // assetsPublicPath: '/',
    devServer:{
        host:'0.0.0.0',
        port:8080,
        https:false,
        disableHostCheck: true,
        proxy:{
            '/member|/admin|/open|/login|/mos|/upload|/js|/kaptcha|/css|/ckplayer|/gallary|/render|/layui|/img':{
                target:'http://localhost:9700/',
                changeOrigin: true,
                // pathRewrite:{
                // }
            },
        }
    }
}