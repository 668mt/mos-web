module.exports = {
    devServer:{
        host:'0.0.0.0',
        port:8080,
        https:false,
        proxy:{
            '/member|/admin|/login|/oss|/upload':{
                target:'http://localhost:9700/',
                changeOrigin: true,
                // pathRewrite:{
                // }
            },
        }
    }
}