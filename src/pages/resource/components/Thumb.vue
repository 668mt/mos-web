<template>
	<div style="width:100%;">
		<div class="thumb-container" :style="{width:'100%',height:autoHeight}">
			<div :style="{background:`url(${src}) 100% no-repeat`}"
				 class="img-background">
			</div>
			<div class="img-background2">
			</div>
			<img style="height:100%;max-width:100%;position:absolute;left:50%;transform:translateX(-50%);top:0;z-index:5;"
				 :src="src"
			/>
			<div v-if="videoLength"
				 style="z-index:5;position: absolute;background: #000;right: 0;bottom: 0;padding:0 3px;color:#fff;font-size: 10px;">
				{{videoLength}}
			</div>
		</div>
	</div>
</template>

<script>
    export default {
        name: "Thumb",
        props: {
            src: String,
            videoLength: String,
        },
        data() {
            return {
                autoHeight: '60px'
            }
        },
        mounted() {
            let width = this.$el.getElementsByClassName('thumb-container')[0].clientWidth;
            this.autoHeight = 0.6 * width + 'px';
        }
    }
</script>

<style scoped>
	.thumb-container {
		text-align: center;
		position: relative;
	}
	
	.img-background {
		position: absolute;
		width: calc(100% - 4px);
		height: calc(100% - 4px);
		left: 2px;
		top: 2px;
		z-index: 1;
		filter: blur(2px);
	}
	
	.img-background2 {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: 2;
		background: #000;
		opacity: 0.6;
	}
</style>