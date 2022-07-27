<template>
	<!--		<icon-font :type="type"/>-->
	<!--	<span class="icon iconfont"></span>-->
	<span style="position: relative;display: inline-block;width: 18px;height: 18px;">
		<i v-if="mode === 'font-class'" :class="['iconfont',type]" style="position: absolute;top:-50%;"></i>
		<svg v-else class="icon" aria-hidden="true" style="width: 100%;height:100%;margin:0;">
			<use :xlink:href="`#${type}`"></use>
		</svg>
	</span>
</template>

<script>
    import {Icon} from "ant-design-vue";

    export default {
        name: "IconFont",
        props: {
            type: String,
            mode: {
                type: String,
                default: 'svg'
            },
        },
        beforeCreate() {
            this.$options.components.IconFont = Icon.createFromIconfontCN({
                // scriptUrl: '//at.alicdn.com/t/font_1836787_2a565rchgum.js',
                // scriptUrl: '//at.alicdn.com/t/font_1836787_476qij9g1n4.js',
                scriptUrl: this.$store.getters["setting/getConfigs"].iconfontUrl,
            });
        },
    }
</script>

<style scoped>
	.iconfont {
		margin-top: 10px;
	}
</style>