<template>
    <div class="video-block">
        <a-row type="flex">
            <a-col :xs="{span:24}" :sm="{span:24}" :md="{span:16}" style="padding-right: 5px;">
                <VideoBox v-if="isMobile" :video="video" @delete="onDelete"/>
                <a-affix v-else>
                    <VideoBox :video="video" @ended="nextVideo" @delete="onDelete"/>
                </a-affix>
            </a-col>
            <a-col :xs="{span:24}" :sm="{span:24}" :md="{span:8}" style="color:#fff;">
                <div>
                    <div style="margin-bottom:10px;color:#000;background: #fff;position: sticky;top:0;z-index:9999;" class="video-container-header">
                        <span style="font-weight: 600;font-size: 14px;margin:0;">文件夹：{{ query.path }}</span>
                        <br/>
                        <span style="font-size: 12px;color:#999;">当前播放：{{ currentPlayIndex }}<span
                            style="margin:0 3px;">/</span>{{ maxTotal }}
								<a-icon type="environment" style="cursor:pointer;margin-left: 10px;"
                                        @click="scrollToPosition"/>
								</span>
                        <a-input-search placeholder="关键字搜索" style="margin-top:5px;" v-model="keyword"/>
                    </div>
                    <scroll-container style="border:1px solid #ccc;overflow-y: auto;overflow-x:hidden;"
                                      class="video-list-container video-list"
                                      ref="container"
                                      :offset="500"
                                      :has-more="hasNextPage"
                                      :load-more="handleInfiniteOnLoad">
                        <a-list item-layout="horizontal" :data-source="videos" :locale="{emptyText:'暂无数据'}">
                            <a-list-item slot="renderItem" slot-scope="item,index"
                                         @click="playChange(item)"
                                         :class="`list-item ${video && video.id === item.id ? 'active'  : ''}`">
                                <a-list-item-meta>
                                    <div slot="title" style="overflow: hidden;line-height: 20px;">
                                        <h4 style="word-break:break-all;overflow: hidden;-webkit-line-clamp: 2; -webkit-box-orient: vertical;display: -webkit-box;">
                                            <a-tag v-if="isDelete(item)">已删除</a-tag>
                                            {{ item.fileName }}
                                        </h4>
                                    </div>
                                    <div slot="description" style="line-height: 12px;">
                                        <div class="space">
                                            <span class="span-desc">{{ item.visits }}次观看</span>
                                            <span class="span-desc">{{ item.readableSize }}</span>
                                            <span class="span-desc">{{ item.createdDate }}</span>
                                        </div>
                                    </div>
                                    <div slot="avatar"
                                         style="padding-left: 25px;position: relative;font-size: 12px;">
                                        <div
                                            style="position: absolute;left: 0;font-size: 12px;width: 25px;text-align: center;line-height: 65px;color:#000;">
                                            {{ index + 1 }}
                                        </div>
                                        <Thumb style="width:110px;height:65px;"
                                               :video-length="item.videoLength"
                                               :src="`/mos/${query.bucket}${item.urlEncodePath}?thumb=true`"/>
                                    </div>
                                </a-list-item-meta>
                            </a-list-item>
                            <div v-if="loading && hasNextPage" class="demo-loading-container">
                                <a-spin/>
                            </div>
                        </a-list>
                    </scroll-container>
                </div>
            </a-col>
        </a-row>
    </div>
</template>
<script>
import Thumb from "../resource/components/Thumb";
import mt from '../../utils/mt';
// import infiniteScroll from 'vue-infinite-scroll';
import VideoBox from "@/pages/viewer/components/VideoBox.vue";
import Lock from "@/utils/lock";
import ScrollContainer from "@/pages/viewer/components/ScrollContainer.vue";

let player;
export default {
    name: "VideoViewer",
    // directives: {infiniteScroll},
    components: {
        ScrollContainer,
        VideoBox, Thumb
    },
    data() {
        return {
            query: {},
            pages: {},
            video: undefined,
            loading: false,
            pageNum: 1,
            pageSize: 100,
            hasNextPage: true,
            maxTotal: 0,
            // videos: [],
            pageVideos: {},
            lock: new Lock(),
            keyword:'',
            deleteVideos:[]
        }
    },
    mounted() {
        let query = this.$route.query;
        this.query = query;
        let id = query.id;
        let bucket = query.bucket;
        let path = query.path;
        if (!id || !bucket || !path) {
            this.$message.warn('参数错误!');
            return;
        }
        this.fetchResource();
        //初始化
        this.handleInfiniteOnLoad().then(value => {
            this.$nextTick().then(value => {
                this.scrollToPosition();
            });
        });
    },
    methods: {
        isDelete(video){
            for(let vid of this.deleteVideos){
                if(vid === video.id){
                    return true;
                }
            }
            return false;
        },
        onDelete(video){
            let currentPlayIndex = this.currentPlayIndex;
            this.deleteVideos.push(video.id);
            this.playVideoByIndex(currentPlayIndex - 1);
        },
        scrollToPosition() {
            this.scrollToIndex(this.currentPlayIndex);
        },
        async scrollToIndex(index) {
            let items = this.$el.getElementsByClassName('list-item');
            if (index > items.length) {
                await this.handleInfiniteOnLoad();
                setTimeout(() => this.scrollToIndex(index), 100);
                return;
            }
            let item = items[index - 1];
            // document.documentElement.scrollTop = item.offsetTop - 200;
            window.scrollTo({
                top: item.offsetTop - 200,
                behavior: 'smooth' // 平滑滚动
            });
        },
        nextVideo() {
            let nextIndex = this.currentPlayIndex;
            this.playVideoByIndex(nextIndex);
        },
        playVideoByIndex(index) {
            let list = this.videos;
            if (!list) {
                return;
            }
            if (list[index]) {
                this.playChange(list[index]);
            } else {
                this.playChange(list[0]);
            }
        },
        playChange(video) {
            this.setPlayUrl(video);
            this.video = video;
            history.replaceState({}, video.fileName, `/viewer/video?id=${video.id}&bucket=${this.query.bucket}&path=${encodeURIComponent(this.query.path)}`);
        },
        async handleInfiniteOnLoad() {
            if (!this.hasNextPage) {
                console.log('没有下一页了，当前页：', this.pageNum)
                return;
            }
            await this.fetchRecentResources(this.pageNum++);
        },
        async fetchRecentResources(pageNum) {
            console.log('fetchRecentResources:' + pageNum)
            let bucket = this.query.bucket;
            let path = this.query.path;
            this.loading = true;
            try {
                await this.$http.get(`/member/resource/${bucket}/files/video`, {
                    params: {
                        path,
                        pageNum: pageNum,
                        pageSize: this.pageSize
                    }
                }).then(value => {
                    let page = value.data;
                    this.hasNextPage = page.hasNextPage;
                    // if (page.list) {
                    //     for (let video of page.list) {
                    //         this.videos.push(video);
                    //     }
                    // }
                    // this.pageVideos[pageNum] = page.list;
                    for(let video of page.list){
                        video.isDelete = false;
                    }
                    this.$set(this.pageVideos, pageNum, page.list);
                    this.maxTotal = page.total;
                }, reason => this.loading = false);
            } finally {
                this.loading = false;
            }
        },
        fetchResource() {
            let bucket = this.query.bucket;
            let id = this.query.id;
            let path = this.query.path;
            this.$http.get(`/member/resource/${bucket}/file/video/${id}`, {
                params: {
                    path
                }
            }).then(value => {
                let data = value.data;
                this.setPlayUrl(data);
                this.video = data;
                // this.playResource(data);
            });
        },
        setPlayUrl(video) {
            let url = video.signUrl;
            url = url.replace('render=true', 'render=false');
            // url = url.replace('localhost', '192.168.3.47');
            video.signUrl = url;
        },
    },
    computed: {
        videos() {
            let pageVideos = this.pageVideos;
            let videos = [];
            for (let i = 1; i <= this.pageNum; i++) {
                if (pageVideos[i]) {
                    pageVideos[i].forEach(item => videos.push(item));
                }
            }
            return videos.filter(item => !this.keyword || item.fileName.indexOf(this.keyword) > -1)
                .filter(item => !this.isDelete(item));
        },
        isMobile() {
            return mt.isMobile();
        },
        currentPlayIndex() {
            if (!this.video) {
                return 0;
            }
            if (this.video.rowNum) {
                return this.video.rowNum;
            } else {
                let videos = this.videos;
                for (let i = 0; i < videos.length; i++) {
                    let item = videos[i];
                    if (this.video.id === item.id) {
                        return i + 1;
                    }
                }
            }
            return 0;
        }
    },
}

</script>

<style scoped type="less">
@import "index.less";

.border {
    border: 1px solid #000;
}

/*@media screen and (max-width: 575.98px) {*/
/*	.video-block {*/
/*		padding: 10px;*/
/*	}*/
/*}*/
/*@media screen and (min-width: 576px) {*/
/*	.video-block {*/
/*		padding: 20px;*/
/*	}*/
/*	.video-list .list-item:hover {*/
/*		background: #eee;*/
/*		cursor: pointer;*/
/*	}*/
/*}*/
</style>