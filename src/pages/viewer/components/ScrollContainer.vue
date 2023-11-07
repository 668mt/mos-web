<template>
    <div class="scroll-container">
        <slot></slot>
    </div>
</template>
<script>

import debounce from "@/utils/debounce";

export default {
    name: "ScrollContainer",
    props: {
        hasMore: {
            type: Boolean,
            required: true
        },
        loadMore: {
            type: Function,
            required: true
        },
        offset: {
            type: Number,
            default: 50
        },
        init:{
            type:Boolean,
            default:false
        }
    },
    data() {
        return {
            list: [],
        }
    },
    mounted() {
        window.addEventListener('scroll', this.windowScroll, true);
        this.$nextTick().then(value => {
            if(this.init) {
                this.loadMore();
            }
        });
    },
    destroyed() {
        //销毁滚动事件
        window.removeEventListener("scroll", this.windowScroll);
    },
    beforeRouteLeave() {
        //销毁滚动事件
        window.removeEventListener("scroll", this.windowScroll);
    },
    methods: {
        async windowScroll() {
            let elem = this.$el;
            //可视区域高度
            let clientHeight = Math.min(elem.clientHeight,document.documentElement.clientHeight);
            //滚动条滚动高度
            let scrollTop = elem.scrollTop && elem.scrollTop || document.documentElement && document.documentElement.scrollTop || document.body && document.body.scrollTop;
            let scrollHeight = elem.scrollHeight;
            // console.log(clientHeight, scrollTop, scrollHeight)
            debounce(() => {
                //滚动区域总高度
                if (clientHeight + scrollTop + this.offset >= scrollHeight && this.hasMore) {
                    //到底了
                    this.loadMore();
                }
            }, 50);
        },
    }
}
</script>

<style scoped lang="less">
#container {
    overflow-y: scroll;
}
</style>