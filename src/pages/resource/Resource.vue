<template>
	<a-card>
		<a-row style="margin-bottom:10px;">
			<a-button type="primary" @click="onAdd">上传</a-button>
			<a-select v-model="currentBucket" style="width:150px;float: right;">
				<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
					{{bucket.bucketName}}
				</a-select-option>
			</a-select>
		</a-row>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :rowKey="(row,index) => {return index}"
				 @expand="expand"
				 @change="handleTableChange">
			<span slot="name" slot-scope="text,record,index">
				<span v-if="index === 0">
					<a class="dir-nav" @click="changeCurrentPath(lastDir? lastDir.path : '/')" :disabled="!lastDir">
						<a-icon type="rollback"/>
					</a>
					<icon-font type="icon-fanhui" style="font-size:24px;"></icon-font>
					<span class="path" v-if="parentDirs.length > 0">
						<a class="dir-nav" v-for="dir in parentDirs" :key="dir.path"
						   @click="changeCurrentPath(dir.path)">{{dir.path}}</a>
					</span>
					<span class="path current">
						{{currentPath}}
					</span>
				</span>
				<span v-else>
					<span v-if="record.fileName">
						<a-icon type="file"/>
						<a class="resource-link" :href="`/mos/${currentBucket}${record.pathname}`" target="_blank">
							{{record.fileName}}
						</a>
					</span>
					<span v-else>
						<a-icon type="folder"/>
						<a class="resource-link" @click="changeCurrentPath(record.path)">
							{{record.name}}
						</a>
					</span>
				</span>
			</span>
			<span v-if="index > 0" slot="action" slot-scope="text,record,index">
				<a-popconfirm
						title="是否删除?"
						ok-text="是"
						cancel-text="否"
						@confirm="onDelete(record,record.fileName ? 'delFile' : 'delDir')"
				>
					<a style="color:red;">删除</a>
				</a-popconfirm>
			</span>
		</a-table>
		<div>
			<a-modal v-model="visible" title="上传" @ok="handleOk"
					 okText="上传"
					 :confirmLoading="uploading"
			>
				<a-progress :percent="uploadPercent" v-if="uploadPercent > 0"/>
				<a-form-model
						:rules="rules"
						ref="ruleForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="form">
					<a-form-model-item label="bucket" prop="bucketName">
						<a-select v-model="form.bucketName">
							<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
								{{bucket.bucketName}}
							</a-select-option>
						</a-select>
					</a-form-model-item>
					<a-form-model-item label="pathname" prop="pathname">
						<a-input v-model="form.pathname"/>
					</a-form-model-item>
					<a-form-model-item label="文件" prop="file">
						<a-upload :file-list="fileList" :remove="handleRemove" :before-upload="beforeUpload">
							<a-button>
								<a-icon type="upload"/>
								选择
							</a-button>
						</a-upload>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
		</div>
	</a-card>
</template>
<script>
    const columns = [
        {
            title: '文件名',
            dataIndex: 'name',
            scopedSlots: {customRender: 'name'},
        },
        {
            title: '文件大小',
            dataIndex: 'readableSize',
        },
        {
            title: '创建时间',
            dataIndex: 'createdDate',
        },
        {
            title: '操作',
            scopedSlots: {customRender: 'action'},
        },
    ];
    // const innerColumns = [{
    //     title: 'openId',
    //     dataIndex: 'openId'
    // }, {
    //     title: '公钥',
    //     dataIndex: 'publicKey',
    //     scopedSlots: {customRender: 'publicKey'},
    //     ellipsis: true
    // }, {
    //     title: '私钥',
    //     dataIndex: 'privateKey',
    //     scopedSlots: {customRender: 'privateKey'},
    //     ellipsis: true
    // }, {
    //     title: '创建时间',
    //     dataIndex: 'createdDate',
    // }, {
    //     title: '修改时间',
    //     dataIndex: 'updatedDate',
    // }];
    import {Icon} from 'ant-design-vue';

    const IconFont = Icon.createFromIconfontCN({
        scriptUrl: '//at.alicdn.com/t/font_1836787_bnktpqgty9.js',
    });
    export default {
        data() {
            return {
                uploadPercent: 0,
                lastDir: null,
                parentDirs: [],
                currentBucket: null,
                currentPath: '/',
                data: [],
                columns,
                // innerColumns,
                innerData: [],
                pagination: false,
                visible: false,
                form: {
                    bucketName: '',
                    pathname: '',
                },
                rules: {
                    bucketName: [
                        {required: true, message: '请选择bucket', trigger: 'blur'},
                    ],
                },
                buckets: [],
                fileList: [],
                uploading: false
            };
        },
        mounted() {
            this.fetchBucket();
        },
        watch: {
            currentBucket() {
                this.fetch();
            },
            currentPath() {
                this.fetch();
            }
        },
        methods: {
            expand(expanded, record) {
                //TODO
            },
            onAdd() {
                this.form = {
                    bucketName: this.currentBucket,
                    pathname: this.currentPath
                };
                this.uploadPercent = 0;
                this.visible = true;
            },
            changeCurrentPath(path) {
                this.fetch(path, () => {
                    this.currentPath = path;
                });
            },
            onDelete(record, type) {
                let params = {};
                if (type === 'delFile') {
                    params = {pathname: record.pathname};
                } else {
                    params = {path: record.path};
                }
                this.$http.delete(`/member/resource/${this.currentBucket}/${type}`, {
                    params: params
                }).then(response => {
                    this.$message.success("删除成功");
                    this.fetch();
                });
            },
            handleTableChange(pagination, filters, sorter) {
                this.fetch();
            },
            fetchBucket() {
                this.$http.get("/member/bucket/list").then(response => {
                    this.buckets = response.data.result;
                    this.currentBucket = this.buckets[0].bucketName;
                })
            },
            fetch(path = this.currentPath, callback) {
                this.$http.get("/member/resource/" + this.currentBucket + path).then(value => {
                    const result = value.data.result;
                    this.currentPath = !result.currentDir ? '/' : result.currentDir.path;
                    this.parentDirs = result.parentDirs;
                    this.lastDir = result.lastDir;
                    this.data = [{}, ...result.dirs, ...result.files];
                    if (callback) {
                        callback();
                    }
                });
            },
            handleOk(e) {
                this.$refs.ruleForm.validate(valid => {
                    if (valid) {
                        const {fileList} = this;
                        const formData = new FormData();
                        fileList.forEach(file => {
                            formData.append('file', file);
                        });
                        formData.append("pathname", this.form.pathname);
                        const params = {
                            uploadId: `${this.currentBucket}-${this.form.pathname}`,
                            bucketName: this.currentBucket,
                            pathname: this.form.pathname
                        };
                        this.$http.get("/upload/progress/reset", {
                            params: params
                        }).then(value => {
                            let t = setInterval(() => {
                                this.$http.get("/upload/progress", {
                                    params: params
                                }).then(res => {
                                    this.uploadPercent = (res.data.result * 100).toFixed(0);
                                });
                            }, 500);
                            this.uploading = true;
                            this.$http.post("/upload/" + this.form.bucketName, formData, {
                                params: {
                                    uploadId: params.uploadId
                                }
                            }).then(value => {
                                this.uploading = false;
                                clearInterval(t);
                                this.$message.success("上传成功!");
                                this.visible = false;
                                this.fetch();
                            }, reason => {
                                this.uploading = false;
                                clearInterval(t);
                            });
                        });
                    }
                });
            },
            handleRemove(file) {
                const index = this.fileList.indexOf(file);
                const newFileList = this.fileList.slice();
                newFileList.splice(index, 1);
                this.fileList = newFileList;
            },
            beforeUpload(file) {
                if (this.currentPath === '/') {
                    this.form.pathname = this.currentPath + file.name;
                } else {
                    this.form.pathname = this.currentPath + '/' + file.name;
                }
                this.fileList = [file];
                return false;
            },
        },
        components: {
            // BucketDrawer
            IconFont
        }
    };
</script>
<style scoped>
	a.resource-link {
		color: #333;
	}
	
	a.resource-link:hover {
		color: #777;
	}
	
	/*a.dir-nav:not(disable){*/
	/*	color:#333;*/
	/*}*/
	.path {
		margin-right: 15px;
	}
	
	.path.current {
		color: gray;
	}
</style>