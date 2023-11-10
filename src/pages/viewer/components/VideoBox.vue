<template>
    <div v-if="video">
        <Dplayer v-if="video" :src="video.signUrl" @ended="() => $emit('ended')"/>
        <div style="padding:10px;" v-if="video">
            <h4>{{ video.fileName }}
                <a-button id="copyBtn" type="link" @click="initClipboard" size="small">
                    <a-icon type="copy"/>
                </a-button>
                <a-popconfirm @confirm="deleteVideo" title="确认删除？">
                    <a-button type="link" size="small" style="color:red;">删除</a-button>
                </a-popconfirm>
            </h4>
            <div class="space">
                <span class="span-desc">{{ video.visits }}次观看</span>
                <span class="span-desc">文件大小：{{ video.readableSize }}</span>
                <span class="span-desc">创建时间：{{ video.createdDate }}</span>
            </div>
        </div>
    </div>
</template>
<script>
import Dplayer from "@/components/video/Dplayer.vue";
import Clipboard from "clipboard";

export default {
    name: "VideoBox",
    components: {Dplayer},
    emits: ['delete'],
    props: {
        // bucket:String,
        video: {
            type: Object,
            default: undefined
        }
    },
    computed: {
        bucket() {
            return this.$route.query.bucket;
        }
    },
    methods: {
        //粘贴板方法
        initClipboard() {
            let copyDom = '#copyBtn';
            let clipboard = new Clipboard(copyDom, {
                text: () => {
                    return `${this.video.signUrl}`
                }
            });
            clipboard.on('success', e => {
                this.$message.success('复制成功');
                clipboard.destroy()
            })
            clipboard.on('error', e => {
                this.$message.warn('该浏览器不支持自动复制');
                clipboard.destroy()
            })
        },
        deleteVideo() {
            this.$http.delete(`/member/resource/${this.bucket}/del`, {
                params: {
                    fileIds: this.video.id
                }
            }).then(value => {
                this.$message.success('删除成功');
                this.$emit('delete', this.video);
            })
        },
    }
}
</script>

<style scoped lang="less">

</style>