<template>
    <div style="padding: 10px">
        <a-spin :spinning="true" style="width: 100%" v-if="fetching && images.length === 0"/>
        <a-row v-else>
            <a-col :span="16" :offset="4" v-for="img in images" :key="img.id"
                   style="margin-bottom: 10px;background: #eee;">
                <img v-lazy="img.signUrl">
            </a-col>
        </a-row>
    </div>
</template>

<script>
    export default {
        name: "GalleryViewer",
        data() {
            return {
                images: [],
                fetching: false
            }
        },
        mounted() {
            this.fetchImages();
        },
        methods: {
            fetchImages(pageNum = 1, pageSize = 100) {
                let query = this.$route.query;
                let path = query.path;
                let bucket = query.bucket;
                let sign = query.sign;

                this.fetching = true;
                this.$http.get(`/open/resource/${bucket}/list`, {
                    params: {
                        isFile: true,
                        suffixs: ['.jpg', '.gif', '.jpeg', '.png'].join(','),
                        path,
                        sign,
                        pageNum,
                        pageSize
                    }
                }).then(value => {
                    let page = value.data.result;
                    console.log(page)
                    this.images.push(...page.list);
                    if (page.hasNextPage) {
                        this.fetchImages(pageNum + 1, pageSize);
                    } else {
                        this.fetching = false;
                    }
                }, reason => this.fetching = false);
            }
        }
    }
</script>
<style>
    img[lazy=loading] {
        width:200px!important;
        height:200px!important;
        margin-left: 50%;
        transform: translateX(-50%);
    }
</style>
<style scoped>
    img {
        width: 100%;
    }
</style>