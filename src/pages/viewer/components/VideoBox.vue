<script>
import Dplayer from "@/components/video/Dplayer.vue";

export default {
    name: "VideoBox",
    components: {Dplayer},
    props: {
        video: {
            type: Object,
            default: undefined
        }
    }
}
</script>

<template>
    <div v-if="video">
        <Dplayer v-if="video" :src="video.signUrl" @ended="() => $emit('ended')"/>
        <div style="padding:10px;" v-if="video">
            <h4>{{ video.fileName }}</h4>
            <div class="space">
                <span class="span-desc">{{ video.visits }}次观看</span>
                <span class="span-desc">文件大小：{{ video.readableSize }}</span>
                <span class="span-desc">更新时间：{{ video.updatedDate }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="less">

</style>