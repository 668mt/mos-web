<!--suppress XmlDuplicatedId -->
<template>
	<div class="video-block">
		<a-row type="flex">
			<a-col :xs="{span:24}" :sm="{span:24}" :md="{span:16}" style="padding-right: 5px;">
				<a-affix v-if="isMobile">
					<div id="videoContainer" style="width: 100%;height:100%;" class="player">
						<video></video>
					</div>
				</a-affix>
				<div v-else id="videoContainer" style="width: 100%;height:100%;" class="player">
					<video></video>
				</div>
				
				<div style="padding:10px;" v-if="active">
					<h4>{{active.fileName}}</h4>
					<div class="space">
						<span class="span-desc">{{active.visits}}次观看</span>
						<span class="span-desc">文件大小：{{active.readableSize}}</span>
						<span class="span-desc">更新时间：{{active.updatedDate}}</span>
					</div>
				</div>
			</a-col>
			<a-col :xs="{span:24}" :sm="{span:24}" :md="{span:8}" style="color:#fff;">
				<div>
					<div style="padding:10px;color:#000;background: #fff;" class="video-container-header">
						<span style="font-weight: 600;font-size: 14px;margin:0;">文件夹：{{query.path}}</span>
						<br/>
						<span style="font-size: 12px;color:#999;">当前播放：{{currentPlayIndex}}<span
								style="margin:0 3px;">/</span>{{maxTotal}}
								<a-icon type="environment" style="cursor:pointer;margin-left: 10px;"
										@click="scrollToPosition"/>
								</span>
					</div>
					<div style="border:1px solid #ccc;overflow-y: auto;overflow-x:hidden;" class="video-list-container"
						 ref="container">
<!--						<a-affix :target="() => this.$refs.container" :offset-top="1">-->
<!--							<div style="padding:10px;color:#000;background: #fff;">-->
<!--								<span style="font-weight: 600;font-size: 14px;margin:0;">文件夹：{{query.path}}</span>-->
<!--								<br/>-->
<!--								<span style="font-size: 12px;color:#999;">当前播放：{{currentPlayIndex}}<span-->
<!--										style="margin:0 3px;">/</span>{{maxTotal}}-->
<!--								<a-icon type="environment" style="cursor:pointer;margin-left: 10px;"-->
<!--										@click="scrollToPosition"/>-->
<!--								</span>-->
<!--							</div>-->
<!--						</a-affix>-->
						<div
								ref="infinite"
								v-infinite-scroll="handleInfiniteOnLoad"
								class="demo-infinite-container video-list"
								:infinite-scroll-disabled="!hasNextPage"
								:infinite-scroll-distance="10"
						>
							<a-list item-layout="horizontal" :data-source="videos" :locale="{emptyText:'暂无数据'}">
								<a-list-item slot="renderItem" slot-scope="item,index"
											 @click="playChange(item)"
											 :class="`list-item ${active && active.id === item.id ? 'active'  : ''}`">
									<a-list-item-meta>
										<div slot="title" style="overflow: hidden;line-height: 20px;">
											<h4 style="word-break:break-all;overflow: hidden;-webkit-line-clamp: 2; -webkit-box-orient: vertical;display: -webkit-box;">
												{{item.fileName }}
											</h4>
										</div>
										<div slot="description" style="line-height: 12px;">
											<div class="space">
												<span class="span-desc">{{item.visits}}次观看</span>
												<span class="span-desc">{{item.readableSize}}</span>
											</div>
										</div>
										<div slot="avatar"
											 style="padding-left: 25px;position: relative;font-size: 12px;">
											<div style="position: absolute;left: 0;font-size: 12px;width: 25px;text-align: center;line-height: 65px;color:#000;">
												{{index+1}}
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
						</div>
					</div>
				</div>
			</a-col>
		</a-row>
	</div>
</template>
<script>
    import $ from 'jquery';
    import Thumb from "../resource/components/Thumb";
    import mt from '../../utils/mt';
    import infiniteScroll from 'vue-infinite-scroll';
    import Lock from "../../utils/lock";

    let player;
    export default {
        name: "VideoViewer",
        directives: {infiniteScroll},
        components: {Thumb},
        data() {
            return {
                query: {},
                pages: {},
                active: undefined,
                loading: false,
                pageSize: 50,
                lock: new Lock()
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
            this.resize();
        },
        methods: {
            scrollToPosition() {
                this.scrollToIndex(this.currentPlayIndex);
            },
            scrollToIndex(index) {
                let videoElement = this.$el.getElementsByClassName('video-list-container')[0];
                let items = this.$el.getElementsByClassName('list-item');
                if (index > items.length) {
                    this.handleInfiniteOnLoad();
                    setTimeout(() => this.scrollToIndex(index), 100);
                    return;
                }
                let item = items[index - 1];
                videoElement.scrollTop = item.offsetTop;
            },
            nextVideo() {
                let list = this.videos;
                let nextIndex = this.currentPlayIndex;
                if (!list) {
                    return;
                }
                if (list[nextIndex]) {
                    this.playResource(list[nextIndex]);
                } else {
                    this.playResource(list[0]);
                }
            },
            playChange(record) {
                this.playResource(record);
            },
            resize() {
                const $videoContainer = $("#videoContainer");
                let width = $videoContainer.width();
                let height = width / 1.6;
                // let marginTop = ($(document).height() - height) / 2;
                $videoContainer.css("height", height + 'px');
                if (!mt.isMobile()) {
                    let headerHeight = $(".video-container-header").css("height");
                    $(".video-list-container").css("height", `calc(${height}px - ${headerHeight})`);
                } else {
                    $(".video-list-container").css("height", '800px');
                }
            },
            handleInfiniteOnLoad() {
                if (!this.hasNextPage) {
                    return;
                }
                this.fetchRecentResources(this.nextPageNum);
            },
            fetchRecentResources(pageNum) {
                pageNum = pageNum ? pageNum : 1;
                if (this.pages['p' + pageNum]) {
                    return;
                }
                let bucket = this.query.bucket;
                let path = this.query.path;
                this.loading = true;
                this.$http.get(`/member/resource/${bucket}/files/video`, {
                    params: {
                        path,
                        pageNum: pageNum,
                        pageSize: this.pageSize
                    }
                }).then(value => {
                    let page = value.data;
                    this.loading = false;
                    this.$set(this.pages, 'p' + pageNum, page);
                }, reason => this.loading = false);
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
                    this.playResource(data);
                    this.scrollToPosition();
                });
            },
            playResource(data) {
                document.title = data.fileName;
                this.active = data;
                let url = data.signUrl;
                this.playVideo(url);
                if (!this.isMobile) {
                    history.pushState({}, data.fileName, `/viewer/video?id=${data.id}&bucket=${this.query.bucket}&path=${encodeURIComponent(this.query.path)}`);
                }
            },
            play(url, html5m3u8) {
                let vol = mt.getCookie('vol');
                let videoObject = {
                    container: '#videoContainer',//“#”代表容器的ID，“.”或“”代表容器的class
                    variable: 'player',//该属性必需设置，值等于下面的new chplayer()的对象
                    video: url,
                    loop: false,
                    click: true,
                    html5m3u8: html5m3u8,
                    autoplay: html5m3u8,
                    // autoplay: true,
                    loaded: (player) => {
                        player.videoPlay();
                        player.addListener('volume', vol => {
                            mt.setCookie('vol', vol, 30);
                        });
                    },
                    volume: vol !== null ? vol : 0.5
                };
                if (player) {
                    videoObject.video = decodeURIComponent(url);
                    videoObject.autoplay = true;
                    player.newVideo(videoObject);
                } else {
                    player = new ckplayer(videoObject);
                    player.addListener('ended', v => {
                        this.nextVideo();
                    });
                }
            },
            //直接视频地址播放
            playMp4(url) {
                this.play(url, false);
            },
            playM3U8(url) {
                this.play(url, true);
            },
            playVideo(url) {
                url = url.replace('render=true', 'render=false');
                url = url.replace('localhost', '192.168.0.174');
                if (url.indexOf('.m3u8') !== -1) {
                    // if(this.isMobile){
                    //     let index = url.indexOf("?");
                    //     url = encodeURIComponent(url.substring(0, index)) + url.substring(index);
                    // }
                    this.playM3U8(url);
                } else {
                    let index = url.indexOf("?");
                    url = encodeURIComponent(url.substring(0, index)) + url.substring(index);
                    this.playMp4(url);
                }
            },
        },
        computed: {
            videos() {
                let list = [];
                for (let pageNum in this.pages) {
                    for (let item of this.pages[pageNum].list) {
                        list.push(item);
                    }
                }
                return list;
            },
            hasNextPage() {
                if (!this.pages) {
                    return true;
                }
                let maxPage = 1;
                for (let pageNum of Object.keys(this.pages)) {
                    maxPage = Math.max(parseInt(pageNum.replace('p', '')), maxPage);
                }
                let max = this.pages['p' + maxPage];
                if (!max) {
                    return true;
                }
                return max.hasNextPage;
            },
            nextPageNum() {
                if (!this.pages) {
                    return 1;
                }
                let maxPage = 0;
                for (let pageNum of Object.keys(this.pages)) {
                    maxPage = Math.max(parseInt(pageNum.replace('p', '')), maxPage);
                }
                return maxPage + 1;
            },
            maxTotal() {
                if (!this.pages) {
                    return 0;
                }
                let page = this.pages['p1'];
                if (!page) {
                    return 0;
                }
                return page.total;
            },
            isMobile() {
                return mt.isMobile();
            },
            currentPlayIndex() {
                if (!this.active) {
                    return 0;
                }
                if (this.active.rowNum) {
                    return this.active.rowNum;
                } else {
                    for (let i = 0; i < this.videos.length; i++) {
                        let item = this.videos[i];
                        if (this.active.id === item.id) {
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
	.border{
		border:1px solid #000;
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