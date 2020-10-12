<template>
	<a-dropdown style="display: inline-block; height: 100%; vertical-align: initial">
    <span style="cursor: pointer">
<!--      <a-avatar class="avatar" size="small" shape="circle" :src="currUser.avatar"/>-->
		<a-avatar size="large" style="color: #f56a00; backgroundColor: #fde3cf">
      {{currentName}}
    </a-avatar>
    </span>
		<a-menu style="width: 150px" slot="overlay">
<!--			<a-menu-item>-->
<!--				<a-icon type="user"/>-->
<!--				<span>个人中心</span>-->
<!--			</a-menu-item>-->
<!--			<a-menu-item>-->
<!--				<a-icon type="setting"/>-->
<!--				<span>设置</span>-->
<!--			</a-menu-item>-->
<!--			<a-menu-divider/>-->
			<a-menu-item>
				<router-link to="/login">
					<a-icon type="poweroff"/>
					<span>退出登录</span>
				</router-link>
			</a-menu-item>
		</a-menu>
	</a-dropdown>
</template>

<script>
    export default {
        name: 'HeaderAvatar',
        computed: {
            currUser() {
                return JSON.parse(window.localStorage.getItem("currentUser"));
            },
			currentName(){
                let currUser = JSON.parse(window.localStorage.getItem("currentUser"));
                if(currUser.name){
                    return currUser.name.substring(currUser.name.length - 1);
				}else{
                	return currUser.username;
                }
			}
        }
    }
</script>

<style lang="less" scoped>
	.avatar {
		margin: 20px 4px 20px 0;
		color: #1890ff;
		background: hsla(0, 0%, 100%, .85);
		vertical-align: middle;
	}
</style>
