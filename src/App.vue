<template>
	<div id="app">
		<router-view></router-view>
	</div>
</template>

<script>
    // import GlobalLayout from "./pages/GlobalLayout";

    export default {
        name: 'App',
        components: {
            // GlobalLayout
        }
    }
</script>
<style>
	body,html{
		margin:0;
		padding:0;
		width:100%;
		height:100%;
	}
	#app{
		height: 100%;
		width: 100%;
		padding:0;
		margin:0;
	}
</style>
