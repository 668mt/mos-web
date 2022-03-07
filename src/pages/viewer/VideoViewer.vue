<!--suppress XmlDuplicatedId -->
<template>
	<div class="video-block">
		<a-row type="flex">
			<a-col :sm="{span:24}" :md="{span:16}" style="padding-right: 5px;">
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
			<a-col :sm="{span:24}" :md="{span:8}" style="color:#fff;">
				<div>
					<div style="border:1px solid #ccc;overflow-y: auto;overflow-x:hidden;" class="video-list-container"
						 ref="container">
						<a-affix :target="() => this.$refs.container" :offset-top="1">
							<div style="padding:10px;color:#000;background: #fff;">
								<span style="font-weight: 600;font-size: 14px;margin:0;">文件夹：{{query.path}}</span>
								<br/>
								<span style="font-size: 12px;color:#999;">当前播放：{{currentPlayIndex}}<span
										style="margin:0 3px;">/</span>{{page.total?page.total:0}}</span>
							</div>
						</a-affix>
						<div
								v-infinite-scroll="handleInfiniteOnLoad"
								class="demo-infinite-container video-list"
								:infinite-scroll-disabled="!page.hasNextPage"
								:infinite-scroll-distance="10"
						>
							<a-list item-layout="horizontal" :data-source="page.list" :locale="{emptyText:'暂无数据'}">
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
												   :src="`/mos/${query.bucket}${item.urlEncodePath}?thumb=true`"/>
										</div>
									</a-list-item-meta>
								</a-list-item>
								<div v-if="loading && page.hasNextPage" class="demo-loading-container">
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

    let player;
    export default {
        name: "VideoViewer",
        directives: {infiniteScroll},
        components: {Thumb},
        data() {
            return {
                query: {},
                page: {},
                active: undefined,
                loading: false,
                pageSize: 50
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
            nextVideo() {
                let list = this.page.list;
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
                    $(".video-list-container").css("height", height + 'px');
                    // $(".video-list-container").css("height", '100%');
                }else{
                    $(".video-list-container").css("height", '800px');
				}
                // $videoContainer.css("margin-top", marginTop + 'px');
            },
            handleInfiniteOnLoad() {
                if (this.page.hasNextPage !== undefined && !this.page.hasNextPage) {
                    return;
                }
                this.fetchRecentResources(this.page.pageNum + 1);
            },
            fetchRecentResources(pageNum) {
                let bucket = this.query.bucket;
                let path = this.query.path;
                this.loading = true;
                this.$http.get(`/member/resource/${bucket}/files/video`, {
                    params: {
                        path,
                        pageNum: pageNum ? pageNum : 1,
                        pageSize: this.pageSize
                    }
                }).then(value => {
                    let oldList = this.page.list;
                    let page = value.data;
                    if (!oldList) {
                        oldList = [];
                    }
                    for (let item of page.list) {
                        oldList.push(item);
                    }
                    page.list = oldList;
                    this.page = page;
                    this.loading = false;
                }, reason => this.loading = false);
            },
            fetchResource() {
                let bucket = this.query.bucket;
                let id = this.query.id;
                let path = this.query.path;
                this.$http.get(`/member/resource/${bucket}/file/${id}`, {
                    params: {
                        path
                    }
                }).then(value => {
                    let data = value.data;
                    this.playResource(data);
                });
            },
            playResource(data) {
                document.title = data.fileName;
                this.active = data;
                // let url = `/mos/${this.query.bucket}${data.urlEncodePath}`;
                let url = data.signUrl;
                url = url.replace('render=true', 'render=false');
                url = url.replace('localhost', '192.168.0.174');
                let index = url.indexOf("?");
                // this.playVideo('http://' + encodeURIComponent(url.substring(0, index)) + url.substring(index));
                this.playVideo(encodeURIComponent(url.substring(0, index)) + url.substring(index));
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
                if (url.indexOf('.m3u8') !== -1) {
                    this.playM3U8(url);
                } else {
                    this.playMp4(url);
                }
            },
        },
        computed: {
            isMobile() {
                return mt.isMobile();
            },
            currentPlayIndex() {
                if (this.page && this.page.list && this.active) {
                    for (let i = 0; i < this.page.list.length; i++) {
                        let item = this.page.list[i];
                        if (this.active.id === item.id) {
                            return i + 1;
                        }
                    }
                }
                if (this.active) {
                    return this.active.rowNum;
                }
                return 0;
            }
        },
    }

</script>

<style scoped type="less">
	@import "index.less";
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