<template>
	<div>
		<div v-if="record.isDir" style="position: relative">
			<!-- 文件夹 -->
			<a :id="record.id" :class="getResourceClass(record)" @click="changeCurrentPath(record)"
			   style="position: relative;margin-left: 22px;display: inline-block;width: 80px;"
			   @touchstart="onPressDown('_self',record)"
			   @touchend="onPressUp(record)"
			   @mousedown="onPressDown('_blank',record)"
			   @mouseup="onPressUp(record)"
			>
				<icon-font class="resource-icon" type="icon-weibiaoti-_huabanfuben"
						   style="top: 1px;width: 80px;height:80px;"/>
				<p style="text-align: center;">
					{{showDetailPath?record.path:('/'+record.fileName)}}
				</p>
			</a>
		</div>
		<span v-else>
			<!-- 文件 -->
			<a @click="onRecentClick(record)">
				<div>
					<div v-if="record.thumbFileHouseId">
						<Thumb :video-length="record.videoLength"
							   :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
					</div>
					<div v-else>
						<icon-font class="resource-icon" v-if="record.icon" :type="record.icon"
								   style="width:80px;height:80px;margin:0;"/>
						<icon-font class="resource-icon" v-else type="icon-wenjian"
								   style="width:80px;height:80px;margin:0;"/>
					</div>
				</div>
				<p style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
					{{showDetailPath?record.path:record.fileName}}
				</p>
			</a>
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
        components: {
            Thumb,
            IconFont
        },
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
                    if (fileName.endsWith(item) || fileName.endsWith(item.toUpperCase())) {
                        return `/viewer/video?bucket=${this.currentBucket}&id=${record.id}&path=${encodeURIComponent(this.currentDir.path)}`;
                    }
                }
                return record.signUrl ? record.signUrl : `/mos/${this.currentBucket}${record.urlEncodePath}?render=true`;
            },
            onPressDown(target, dir) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                }
                const url = `/mos/${this.currentBucket}${dir.urlEncodePath}?gallary=true`;
                // const url = `/viewer/gallery?path=${dir.urlEncodePath}`;
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
	.border {
		border: 1px solid #000;
	}
</style>