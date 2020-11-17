<template>
	<div>
		<a-dropdown style="display: inline-block; height: 100%; vertical-align: initial">
    <span style="cursor: pointer">
		<a-avatar size="large" style="backgroundColor: #f56a00">
      {{currentName}}
    </a-avatar>
    </span>
			<a-menu style="width: 150px" slot="overlay">
				<a-menu-item @click="onEditUser">
					<a-icon type="user"/>
					<span>个人中心</span>
				</a-menu-item>
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
		<a-modal v-model="editVisible" title="用户详情" @ok="editHandleOk" cancelText="取消" okText="保存">
			<a-form-model
					:rules="rules"
					ref="ruleForm"
					:label-col="{span:6}"
					:wrapper-col="{span:12}"
					:model="form">
				<a-form-model-item label="用户名" prop="username">
					<a-input v-model="form.username" disabled=""/>
				</a-form-model-item>
				<a-form-model-item label="姓名" prop="name">
					<a-input v-model="form.name"/>
				</a-form-model-item>
				<a-form-model-item label="当前密码" prop="currentPassword">
					<a-input type="password" v-model="form.currentPassword" placeholder="不填写表示不修改"/>
				</a-form-model-item>
				<a-form-model-item label="密码" prop="password">
					<a-input type="password" v-model="form.password" placeholder="不填写表示不修改"/>
				</a-form-model-item>
				<a-form-model-item label="确认密码" prop="confirm_password">
					<a-input type="password" v-model="form.confirm_password" placeholder="不填写表示不修改"/>
				</a-form-model-item>
			</a-form-model>
		</a-modal>
	</div>
</template>

<script>
    export default {
        name: 'HeaderAvatar',
        data() {
            return {
                fieldsEquals: (rule, value, callback) => {
                    if (!value || value.trim() === '') {
                        callback();
                    }
                    if (this.form[rule.equalTo] !== value) {
                        callback(new Error(rule.message));
                    } else {
                        this.$refs.ruleForm.validateField(rule.equalTo);
                        callback();
                    }
                },
                editVisible: false,
                form: {
                    username: null,
                    name: null,
                    currentPassword: null,
                    password: null,
                    confirm_password: null
                },
                rules: null,
                currentName: null,
                currUser: null
            }
        },
        mounted() {
            this.currUser = JSON.parse(window.localStorage.getItem("currentUser"));
            let currUser = this.currUser;
            if (currUser.name) {
                this.currentName = currUser.name.substring(currUser.name.length >= 2 ? currUser.name.length - 2 : 0);
            } else {
                this.currentName = currUser.username;
            }
        },
        methods: {
            onEditUser() {
                this.editVisible = true;
                this.form = {
                    username: this.currUser.username,
                    name: this.currUser.name,
                    password: null,
                    confirm_password: null
                };
                this.rules = {
                    name: [{required: true, message: '请输入姓名', trigger: 'blur'},],
                    password: [{
                        validator: this.fieldsEquals,
                        equalTo: 'confirm_password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }],
                    confirm_password: [{
                        validator: this.fieldsEquals,
                        equalTo: 'password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }]
                }
            },
            editHandleOk() {
                let data = {...this.form};
                this.$refs.ruleForm.validate(valid => {
                    if (valid) {
                        this.$http.put('/member/user', data).then(response => {
                            this.$message.success("修改成功");
                            this.currUser = data;
                            window.localStorage.setItem("currentUser", JSON.stringify(data));
                            if (data.name) {
                                this.currentName = data.name.substring(data.name.length >= 2 ? data.name.length - 2 : 0);
                            } else {
                                this.currentName = data.username;
                            }
                            this.editVisible = false;
                        });
                    }
                });
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
