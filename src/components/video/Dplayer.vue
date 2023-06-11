<template>
    <div ref="container" id="dplayer" :style="{width:'100%',height:autoHeight}">
    </div>
</template>

<script>
import DPlayer from "dplayer";
import ElementResizeDetectorMaker from "element-resize-detector";

// 设置cookie
export default {
    name: "Dplayer",
    props: {
        src: String,
    },
    data() {
        return {
            player: undefined,
            autoHeight: '250px'
        }
    },
    watch: {
        src() {
            this.play();
        }
    },
    mounted() {
        let $this = this;
        new ElementResizeDetectorMaker().listenTo($this.$refs.container, element => {
            $this.$nextTick(() => {
                let width = element.clientWidth;
                let height = width * 0.5625;
                $this.autoHeight = height + 'px';
            });
        });
        this.play();
    },
    methods: {
        play() {
            let src = this.src;
            if (!src) {
                return;
            }

            this.$nextTick().then(value => {
                let player = this.player;
                if (player) {
                    player.switchVideo({
                        url: src,
                    });
                    player.play();
                } else {
                    player = new DPlayer({
                        container: document.getElementById('dplayer'),
                        autoplay: false,
                        loop: false,//循环播放
                        preload: 'auto',//可选，预加载的方式可以是'none''metadata''auto'，默认
                        video: {
                            url: src,
                        },
                    });
                    player.play();
                    player.on('ended', () => {
                        this.$emit('ended');
                    });
                    // 获取音量
                    const volume = window.localStorage.getItem('video-volume');
                    if (volume) {
                        player.volume(volume);
                    }

                    // 监听音量调整操作，将音量记录到cookie中
                    player.on('volumechange', function (e) {
                        window.localStorage.setItem('video-volume', player.volume());
                    });
                    this.player = player;
                }
            });
        },
        beforeUnmount() {
            if (this.player) {
                this.player.destroy();
            }
        }
    }
}
</script>

<style scoped>

</style>