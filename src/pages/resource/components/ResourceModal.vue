<template>
	<a-modal v-model="editVisible" title="资源详情" :confirmLoading="saving" @ok="editHandleOk" okText="保存">
		<a-form-model
				ref="editForm"
				:rules="editRules"
				:label-col="{span:6}"
				:wrapper-col="{span:12}"
				:model="editForm">
			<a-form-model-item label="资源名" prop="pathname">
				<a-input v-model="editForm.pathname" @pressEnter="editHandleOk"/>
			</a-form-model-item>
			<a-form-model-item label="权限" prop="isPublic">
				<a-radio-group v-model="editForm.isPublic">
					<a-radio :value="true">公开</a-radio>
					<a-radio :value="false">私有</a-radio>
				</a-radio-group>
			</a-form-model-item>
			<a-form-model-item label="响应头" prop="contentType">
				<a-auto-complete
						v-model="editForm.contentType"
						:data-source="contentTypeDataSource"
						@search="onContentTypeSearch"
				/>
			</a-form-model-item>
		</a-form-model>
	</a-modal>
</template>

<script>
    export default {
        name: "ResourceModal",
        props: {
            buckets: Array,
            currentBucket: String,
            currentDir: Object
        },
		data(){
            return {
                editVisible: false,
                editForm: {
                    pathname: null,
                    isPublic: false,
                    contentType: null
                },
                editRules: {
                    // pathname: [{required: true, message: '请输入资源名', trigger: 'blur'}],
                },
                saving: false,
                allContentTypes: [
                    'text/html;charset=UTF-8', 'text/xml;charset=UTF-8', 'text/plain;charset=UTF-8', 'application/json;charset=UTF-8', 'application/octet-stream',
                    'application/pdf', 'text/markdown;charset=UTF-8', 'text/event-stream;charset=UTF-8',
                    'image/png', 'image/jpeg', 'image/gif', 'application/xml', 'application/xhtml+xml', 'application/stream+json',
                    'application/rss+xml', 'application/problem+xml', 'application/problem+json;charset=UTF-8', 'application/problem+json'
                ],
                contentTypeDataSource: [],
			}
		},
		mounted() {
            this.contentTypeDataSource = [...this.allContentTypes];
        },
        methods:{
            onEditResource(record) {
                this.saving = false;
                this.editForm = {...record}
                this.editForm.pathname = record.path;
                this.editVisible = true;
            },
            //编辑资源
            editHandleOk() {
                this.saving = true;
                this.$http.put(`/member/resource/${this.currentBucket}/${this.editForm.id}`, this.editForm).then(response => {
                    this.$message.success("更新成功");
                    this.saving = false;
                    this.editVisible = false;
                    this.$emit('ok');
                }, reason => {
                    this.saving = false
                });
            },
            onContentTypeSearch(searchText) {
                this.contentTypeDataSource = this.allContentTypes.filter(value => value.indexOf(searchText) !== -1);
            },
		}
    }
</script>

<style scoped>

</style>