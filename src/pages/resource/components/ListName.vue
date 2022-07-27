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
			</a>
		</span>
		<span v-else>
			<!-- 文件 -->
			<a-row type="flex" class="file">
				<a-col :span="record.thumbFileHouseId ? 8:2" align="center" class="thumb">
					<span v-if="record.thumbFileHouseId">
						<a :id="record.id" v-if="record.image"
						   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
						   :class="getResourceClass(record)"
						>
							<Thumb :video-length="record.videoLength"
								   :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
						</a>
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
					<a :id="record.id" v-else
					   :class="getResourceClass(record)"
					   :href="getResourceUrl(record)"
					   @click="onRecentClick(record)"
					   target="_blank">
						{{showDetailPath?record.path:record.fileName}}
					</a>
				</a-col>
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
        data() {
            return {}
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
                    if (fileName.endsWith(item)) {
                        return `/viewer/video?bucket=${this.currentBucket}&id=${record.id}&path=${this.currentDir.path}`;
                    }
                }
                return record.signUrl ? record.signUrl : `/mos/${this.currentBucket}${record.urlEncodePath}?render=true`;
            },
            onPressDown(target, dir) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                }
                const url = `/mos/${this.currentBucket}${dir.urlEncodePath}?gallary=true`;
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

<style scoped>

</style>