<template>
	<div>
		<span v-if="record.isDir" style="position: relative">
			<!-- 文件夹 -->
				<icon-font class="resource-icon" type="icon-weibiaoti-_huabanfuben"
						   style="position: absolute;top: 1px;"/>
			<a :id="record.id" :class="getResourceClass(record)" @click="changeCurrentPath(record)"
			   style="position: relative;margin-left: 22px;"
			   @touchstart="onPressDown('_self',record)"
			   @touchend="onPressUp(record)"
			   @mousedown="onPressDown('_blank',record)"
			   @mouseup="onPressUp(record)"
			>
				{{showDetailPath?record.path:('/'+record.fileName)}}
				<a-tag v-if="count !== undefined" color="pink">{{count}}</a-tag>
			</a>
			<template v-if="thumbs && thumbs.length > 0">
				<a-spin :spinning="loading" style="width: 100%">
				<a-row type="flex" :gutter="10" style="margin-top: 10px;">
					<a-col :span="8" v-for="item of thumbs" :key="item.id">
						<a :href="getThumbResourceUrl(record,item)"
						   @click="onRecentClick(record)"
						   target="_blank">
							<Thumb :video-length="item.videoLength"
								   :src="`/mos/${currentBucket}${item.urlEncodePath}?thumb=true`"/>
						</a>
					</a-col>
				</a-row>
				</a-spin>
			</template>
		</span>
		<span v-else>
			<!-- 文件 -->
			<a-row class="file" :gutter="10">
				<a-col :span="record.thumbFileHouseId ? 8:2" align="center" class="thumb">
					<span v-if="record.thumbFileHouseId">
						<!-- 图片 -->
						<a :id="record.id" v-if="record.image"
						   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
						   :class="getResourceClass(record)"
						>
							<Thumb :video-length="record.videoLength"
								   :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
						</a>
						<!-- 视频 -->
						<a v-else :href="getResourceUrl(record)"
						   @click="onRecentClick(record)"
						   target="_blank">
							<Thumb :video-length="record.videoLength"
								   :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
						</a>
					</span>
					<span v-else>
						<icon-font class="resource-icon" v-if="record.icon" :type="record.icon"
								   style="font-size:16px;margin:0;"/>
						<icon-font class="resource-icon" v-else type="icon-wenjian"
								   style="font-size:16px;margin:0;"/>
					</span>
				</a-col>
				<a-col span="16" class="file-title">
					<!-- 图片展示 -->
					<a :id="record.id" v-if="record.image"
					   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
					   :class="getResourceClass(record)"
					>
						{{showDetailPath?record.path:record.fileName}}
					</a>
					<!-- 视频 -->
					<a :id="record.id" v-else
					   :class="getResourceClass(record)"
					   :href="getResourceUrl(record)"
					   @click="onRecentClick(record)"
					   target="_blank">
						{{showDetailPath?record.path:record.fileName}}
					</a>
				</a-col>
<!--				<a-col :span="16" style="margin:0;font-size: 12px;color:#999;">-->
<!--					<span>{{record.readableSize}}</span>-->
<!--					<span style="margin-left: 10px;">{{record.visits}}次访问</span>-->
<!--				</a-col>-->
			</a-row>
		</span>
	</div>
</template>

<script>
    import Thumb from "./Thumb";
    import IconFont from './IconFont'

    export default {
        name: "ListName",
        props: {
            record: Object,
            currentBucket: String,
            currentDir: Object,
            historyClicks: Array,
            showDetailPath: Boolean,
            showImages: Function,
            onRecentClick: Function,
            changeCurrentPath: Function,
            fileSuffix: Object,
        },
        components: {Thumb, IconFont},
        computed: {
            thumbHeight() {
                return '80px';
            }
        },
        data() {
            return {
                thumbs: undefined,
                fileCount: undefined,
                dirCount: undefined,
                count: undefined,
                loading: false
            }
        },
        mounted() {
            if (!this.thumbs && this.record.isDir) {
                this.loading = true;
                this.$http.get(`/member/dir/${this.currentBucket}/detailInfo/${this.record.id}`).then(value => {
                    if (value.data) {
                        let info = value.data;
                        this.thumbs = info.thumbs;
                        this.fileCount = info.fileCount;
                        this.dirCount = info.dirCount;
                        this.count = info.fileCount + info.dirCount;
                    }
                    this.loading = false;
                }, reason => this.loading = false);
            }
        },
        methods: {
            getResourceClass(record) {
                let contains = false;
                for (let path of this.historyClicks) {
                    if (path === record.path) {
                        contains = true;
                        break;
                    }
                }
                return 'resource-link ' + (contains ? 'activeAnchor' : '');
            },
            getResourceUrl(record) {
                let videoSuffix = this.fileSuffix.video;
                let fileName = record.fileName;
                for (let item of videoSuffix) {
                    if (fileName.endsWith(item) || fileName.endsWith(item.toUpperCase())) {
                        return `/viewer/video?bucket=${this.currentBucket}&id=${record.id}&path=${encodeURIComponent(this.currentDir.path)}`;
                    }
                }
                return record.signUrl ? record.signUrl : `/mos/${this.currentBucket}${record.urlEncodePath}?render=true`;
            },
            getThumbResourceUrl(dir, record) {
                let videoSuffix = this.fileSuffix.video;
                let fileName = record.name;
                for (let item of videoSuffix) {
                    if (fileName.endsWith(item)) {
                        return `/viewer/video?bucket=${this.currentBucket}&id=${record.id}&path=${encodeURIComponent(dir.path)}`;
                    }
                }
                return record.signUrl ? record.signUrl : `/mos/${this.currentBucket}${record.urlEncodePath}?render=true`;
            },
            onPressDown(target, dir) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                }
				const url = `/viewer/gallery?bucket=${this.currentBucket}&path=${dir.urlEncodePath}`;
                let $this = this;
                this.longPressTimer = setTimeout(function () {
                    $this.onRecentClick(dir);
                    window.open(url, target);
                }, 1000);
            },
            onPressUp() {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            },
        }
    }
</script>

<style scoped lang="less">
	.file .file-title a {
		word-break: break-all;
		overflow: hidden;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		display: -webkit-box;
	}
	
	.file .thumb a img {
		max-width: 100%;
		max-height: 100%;
	}
</style>