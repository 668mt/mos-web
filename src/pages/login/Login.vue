<template>
	<div class="container">
		<div class="content">
			<div class="top">
				<div class="header">
					<img alt="logo" class="logo" src="@/assets/img/logo.png"/>
					<span class="title">MOS</span>
				</div>
				<div class="desc">对象存储服务</div>
			</div>
			<div class="login">
				<a-form
						id="components-form-demo-normal-login"
						:form="form"
						class="login-form"
						@submit="handleSubmit"
				>
					<a-form-item>
						<a-input @change="usernameChange"
								 v-decorator="['username',{ rules: [{ required: true, message: '请输入用户名!' }] },]"
								 placeholder="用户名"
						>
							<a-icon slot="prefix" type="user" style="color: rgba(0,0,0,.25)"/>
						</a-input>
					</a-form-item>
					<a-form-item>
						<a-input
								v-decorator="['password',{ rules: [{ required: true, message: '请输入密码!' }] },]"
								type="password"
								placeholder="密码"
						>
							<a-icon slot="prefix" type="lock" style="color: rgba(0,0,0,.25)"/>
						</a-input>
					</a-form-item>
					<a-form-item v-if="needCode">
						<a-row :gutter="8">
							<a-col :span="14">
								<a-input
										v-decorator="['code',{ rules: [{ required: true, message: '请输入验证码!' }] },]"
										type="text"
										placeholder="验证码"
								/>
							</a-col>
							<a-col :span="10">
								<img :src="codeSrc" @click="changeCode"/>
							</a-col>
						</a-row>
					</a-form-item>
					<a-form-item>
						<a-checkbox
								v-decorator="[
						          'rememberMe',
						          {
						            valuePropName: 'checked',
						            initialValue: false,
						          },
						        ]"
						>
							记住我
						</a-checkbox>
						<a-button type="primary" html-type="submit" class="login-form-button">
							登录
						</a-button>
						<!--				Or-->
						<!--				<a href="">-->
						<!--					register now!-->
						<!--				</a>-->
					</a-form-item>
				</a-form>
			</div>
		</div>
	</div>
</template>

<script>
    export default {
        beforeCreate() {
            this.form = this.$form.createForm(this, {name: 'normal_login'});
        },
        data() {
            return {
                codeSrc: '/kaptcha',
                needCode: false,
            }
        },
        methods: {
            isMobile() {
                var userAgentInfo = navigator.userAgent;
                var mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
                var mobile_flag = false;
                //根据userAgent判断是否是手机
                for (var v = 0; v < mobileAgents.length; v++) {
                    if (userAgentInfo.indexOf(mobileAgents[v]) > 0) {
                        mobile_flag = true;
                        break;
                    }
                }
                var screen_width = window.screen.width;
                var screen_height = window.screen.height;
                //根据屏幕分辨率判断是否是手机
                if (screen_width < 500 && screen_height < 800) {
                    mobile_flag = true;
                }
                return mobile_flag;
            },
            changeCode() {
                this.codeSrc = '/kaptcha?t=' + Math.random()
            },
            usernameChange(e) {
                let username = e.target.value;
                this.checkNeedCode(username);
            },
            checkNeedCode(username) {
                this.$http.get('/kaptcha/check/' + username).then(response => {
                    this.needCode = response.data.result;
                })
            },
            handleSubmit(e) {
                e.preventDefault();
                this.form.validateFields((err, values) => {
                    if (!err) {
                        this.$http.post("/login", {
                            ...values
                        }, {
                            transformRequest: [this.$mt.transformFormData],
                        }).then(response => {
                            if (response.data.status === 'ok') {
                                window.localStorage.setItem("currentUser", JSON.stringify(response.data.result));
                                this.$message.success(response.data.message);
                                this.refreshPerm();
                                if (this.isMobile()) {
                                    location.href = '/mobile';
                                } else {
                                    this.$router.replace({
                                        path: '/home'
                                    });
                                }
                            } else {
                                this.$message.error(response.data.message);
                                this.checkNeedCode(values.username);
                                this.changeCode();
                            }
                        }, reason => {
                            this.checkNeedCode(values.username);
                            this.changeCode();
                        });
                    }
                });
            },
        },
    };
</script>
<style lang="less" scoped>
	#components-form-demo-normal-login .login-form {
		max-width: 300px;
	}
	
	#components-form-demo-normal-login .login-form-button {
		width: 100%;
	}
	
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: auto;
		background: #f0f2f5 url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg') no-repeat center 110px;
		background-size: 100%;
		
		.content {
			padding: 32px 0;
			flex: 1;
			@media (min-width: 768px) {
				padding: 112px 0 24px;
			}
			
			.top {
				text-align: center;
				
				.header {
					height: 44px;
					line-height: 44px;
					
					a {
						text-decoration: none;
					}
					
					.logo {
						height: 44px;
						vertical-align: top;
						margin-right: 16px;
					}
					
					.title {
						font-size: 33px;
						color: rgba(0, 0, 0, .85);
						font-family: 'Myriad Pro', 'Helvetica Neue', Arial, Helvetica, sans-serif;
						font-weight: 600;
						position: relative;
						top: 2px;
					}
				}
				
				.desc {
					font-size: 14px;
					color: rgba(0, 0, 0, .45);
					margin-top: 12px;
					margin-bottom: 40px;
				}
			}
			
			.login {
				width: 368px;
				margin: 0 auto;
				@media screen and (max-width: 576px) {
					width: 95%;
				}
				@media screen and (max-width: 320px) {
					.captcha-button {
						font-size: 14px;
					}
				}
				
				.icon {
					font-size: 24px;
					color: rgba(0, 0, 0, 0.2);
					margin-left: 16px;
					vertical-align: middle;
					cursor: pointer;
					transition: color 0.3s;
					
					&:hover {
						color: #1890ff;
					}
				}
			}
		}
	}
</style>