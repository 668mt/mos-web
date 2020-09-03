<template>
	<div id="components-form-demo-advanced-search">
		<a-form-model class="ant-advanced-search-form" :model="form" ref="searchForm" @submit="handleSearch">
			<a-row :gutter="24">
				<a-col :key="1" :span="6">
					<a-form-item label="用户名" prop="username">
						<a-input v-model="form.username" placeholder="请输入用户名"/>
					</a-form-item>
				</a-col>
				<a-col :span="16" style="text-align: left;margin-top:4px;">
					<a-button type="primary" html-type="submit">
						查询
					</a-button>
				</a-col>
			</a-row>
		</a-form-model>
		<div class="search-result-list">
			<slot></slot>
		</div>
	</div>
</template>
<script>
    export default {
        data() {
            return {
                form: {
                    username: ''
                }
            };
        },
        methods: {
            handleSearch(e) {
                e.preventDefault();
                this.$refs.searchForm.validate(valid => {
                    if (valid) {
                        this.$emit('handleSearch', this.$mt.deepCopy(this.form));
                    }
                })
            },
        },
    };
</script>
<style>
	.ant-advanced-search-form {
		padding: 24px;
	}
	
	.ant-advanced-search-form .ant-form-item {
		display: flex;
	}
	
	.ant-advanced-search-form .ant-form-item-control-wrapper {
		flex: 1;
	}
	
	#components-form-demo-advanced-search .ant-form {
		max-width: none;
	}
	
	#components-form-demo-advanced-search .search-result-list {
		margin-top: 0;
	}
</style>