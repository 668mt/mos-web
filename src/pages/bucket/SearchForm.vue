<template>
	<div id="components-form-demo-advanced-search">
		<a-form class="ant-advanced-search-form" :form="form" @submit="handleSearch">
			<a-row :gutter="24">
				<a-col :key="1" :span="6">
					<a-form-item label="文件路径">
						<a-input placeholder="请输入pathname" v-decorator="[`pathname`]"/>
					</a-form-item>
				</a-col>
				<a-col :span="16" style="text-align: left;margin-top:4px;">
					<a-button type="primary" html-type="submit">
						搜索
					</a-button>
					<a-button :style="{ marginLeft: '8px' }" @click="handleReset">
						清空
					</a-button>
				</a-col>
			</a-row>
		</a-form>
		<div class="search-result-list">
			<slot></slot>
		</div>
	</div>
</template>
<script>
    export default {
        data() {
            return {
                form: this.$form.createForm(this, {name: 'advanced_search'}),
            };
        },
        methods: {
            handleSearch(e) {
                e.preventDefault();
                this.form.validateFields((error, values) => {
                    this.$emit('handleSearch', values);
                });
            },

            handleReset() {
                this.form.resetFields();
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