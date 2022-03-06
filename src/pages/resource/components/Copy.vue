<template>
	<a-modal v-model="copyVisible" :title="type === 'move' ? '移动选中文件' : '复制选中文件'" :confirmLoading="copying"
			 @ok="onCopyOk"
			 okText="确定">
		<a-form-model
				ref="copyForm"
				:label-col="{span:6}"
				:wrapper-col="{span:12}"
				:model="copyForm">
			<a-form-model-item label="从" prop="srcBucketName">
				<a-input v-model="copyForm.srcBucketName" :disabled="true"/>
			</a-form-model-item>
			<a-form-model-item :label="type === 'move' ? '移动到' : '复制到'" prop="desBucketName">
				<a-select v-model="copyForm.desBucketName"
						  @change="() => onCopyFormDesPathSearch(this.copyForm.desPath)">
					<a-select-option v-for="bucket in copyBuckets" :key="bucket.id" :value="bucket.bucketName">
						{{bucket.bucketName}}
					</a-select-option>
				</a-select>
			</a-form-model-item>
			<a-form-model-item label="目标路径" prop="desPath">
				<a-auto-complete
						v-model="copyForm.desPath"
						:data-source="copyFormDesPaths"
						@search="onCopyFormDesPathSearch"
				/>
				<!--						<a-input v-model="copyForm.desPath"/>-->
			</a-form-model-item>
		
		</a-form-model>
	</a-modal>
</template>

<script>
    export default {
        name: "Copy",
        props: {
            buckets: Array,
            currentBucket: String,
            currentDir: Object,
            type: String
        },
        data() {
            return {
                copyForm: {
                    srcBucketName: null,
                    desBucketName: null,
                    dirIds: null,
                    resourceIds: null,
                    desPath: null
                },
                copyVisible: false,
                copyBuckets: [],
                copyFormDesPaths: [],
                copying: false,
                selectedRows: []
            }
        },
        methods: {
            //复制
            onCopyToBucket(rows) {
                this.selectedRows = rows;
                this.copyBuckets = this.buckets;
                this.copyForm = {
                    srcBucketName: this.currentBucket,
                    desBucketName: this.copyBuckets.length > 0 ? this.copyBuckets[0].bucketName : null,
                    dirIds: null,
                    resourceIds: null,
                    desPath: this.currentDir.path
                };
                this.copyFormDesPaths = [];
                this.onCopyFormDesPathSearch(this.currentDir.path);
                this.copyVisible = true;
            },
            onCopyFormDesPathSearch(path) {
                if (!path) {
                    path = this.copyForm.desPath;
                }
                let bucketName = this.copyForm.desBucketName;
                if (!bucketName) {
                    return;
                }
                const selectRows = this.selectedRows;
                const dirIds = selectRows.filter(value => value.isDir).map(item => item.id);
                const currentDirId = this.currentDir.id;
                this.$http.get(`/member/dir/${bucketName}/select`, {
                    params: {
                        path: path
                    }
                }).then(response => {
                    this.copyFormDesPaths = response.data.result
                        .filter(dir => !this.$mt.contains(dirIds, dir.id) && dir.id !== currentDirId)
                        .map(dir => dir.path);
                })
            },
            onCopyOk() {
                const selectRows = this.selectedRows;
                const dirIds = selectRows.filter(value => value.isDir).map(item => item.id);
                const resourceIds = selectRows.filter(value => !value.isDir).map(item => item.id);
                let copyForm = this.copyForm;
                if (!copyForm.desBucketName) {
                    this.$message.warn('请选择目标桶！');
                    return;
                }
                let typeTitle = this.type === 'move' ? '移动' : '复制';
                if (copyForm.desBucketName === this.currentBucket && copyForm.desPath === this.currentDir.path) {
                    this.$message.warn(`不能${typeTitle}到当前文件夹！`);
                    return;
                }
                this.copying = true;
                copyForm.dirIds = dirIds;
                copyForm.resourceIds = resourceIds;
                let type = this.type ? this.type : 'copy';
                this.$http.post(`/member/resource/${type}/${copyForm.srcBucketName}/to/${copyForm.desBucketName}`, copyForm).then(response => {
                    this.$message.success(`${typeTitle}成功！`);
                    this.copyVisible = false;
                    this.copying = false;
                    this.$emit('ok');
                }, reason => this.copying = false)
            },
        }
    }
</script>

<style scoped>

</style>