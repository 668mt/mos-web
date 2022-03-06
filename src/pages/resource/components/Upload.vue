<template>
	<a-modal v-model="visible" title="上传" @ok="onUploadOk"
			 okText="上传"
			 :cancelText="uploading ? '切到后台' : '取消'"
			 :confirmLoading="uploading"
			 :maskClosable="false"
			 :destroyOnClose="true"
			 :width="800"
	>
					<span v-if="uploading || uploadProgress.errorMsg">
						<span>（{{uploadProgress.fileIndex}}/{{uploadProgress.files}}）[{{uploadProgress.current}}] {{uploadProgress.errorMsg ? '上传失败：'+uploadProgress.errorMsg:'上传中...'}}</span>
						<a-progress :percent="uploadProgress.uploadPercent"
									:status="uploadProgress.errorMsg ? 'exception' : 'active'"/>
					</span>
		<a-row>
			<a-col span="12">
				<a-form :form="uploadForm">
					<a-form-item v-bind="formItemLayout" label="桶">
						<a-select v-decorator="['bucketName',{rules: [{required: true,message: '请选择桶',}],},]">
							<a-select-option v-for="bucket in buckets" :key="bucket.id"
											 :value="bucket.bucketName">
								{{bucket.bucketName}}
							</a-select-option>
						</a-select>
					</a-form-item>
					<a-form-item v-bind="formItemLayout" label="是否覆盖">
						<a-switch v-decorator="['cover']" @change="onCoverChange"/>
					</a-form-item>
					<a-form-item v-bind="formItemLayout" label="权限">
						<a-radio-group v-decorator="['isPublic',{initialValue:false}]">
							<a-radio :value="true">公开</a-radio>
							<a-radio :value="false">私有</a-radio>
						</a-radio-group>
					</a-form-item>
					<a-form-item v-bind="formItemLayout" label="响应头">
						<a-auto-complete
								v-decorator="['contentType']"
								:data-source="contentTypeDataSource"
								@search="onContentTypeSearch"
						/>
					</a-form-item>
					<a-form-item v-bind="formItemLayout" label="文件/文件夹">
						<a-radio-group v-model="uploadDirectory">
							<a-radio :value="false">文件</a-radio>
							<a-radio :value="true">文件夹</a-radio>
						</a-radio-group>
					</a-form-item>
					<a-form-item v-bind="formItemLayout" label="选择">
						<a-upload-dragger :file-list="fileList" :multiple="true" :remove="handleRemove"
										  :directory="uploadDirectory"
										  :showUploadList="false"
										  :before-upload="beforeUpload">
							<a-icon type="upload"/>
							点击或拖动{{uploadDirectory ? '文件夹' : '文件'}}至此
						</a-upload-dragger>
					</a-form-item>
				</a-form>
			</a-col>
			<a-col span="12">
				<a-form :form="uploadForm">
					<a-empty v-if="fileList.length <= 0" description="暂无文件上传"
							 style="height:260px;margin-top: 140px"/>
					<div v-else style="height:400px;overflow: auto" id="pathname-container">
						<a-form-item v-bind="formItemLayout" v-for="(file,index) in fileList" :key="index"
									 :label="`文件${index+1}`"
									 :has-feedback="false">
							<a-input-search
									v-decorator="['pathnames['+index+']',{rules: [{required: true,message: '文件名必填'},{
								    validator:checkPathname,
								}],},]"
									type="text"
									@search="handleRemove(file)"
							>
								<a-button slot="enterButton" :disabled="uploading"
										  style="background-color: #ffffff">
									<a-icon v-if="file.status === 'uploading'" type="loading"/>
									<a-icon v-else-if="file.status === 'done'" type="check-circle"
											theme="filled" style="color:#52c41a"/>
									<a-icon v-else-if="file.status === 'error'" type="close-circle"
											theme="filled" style="color:#f5222d"/>
									<a-icon v-else type="delete"/>
								</a-button>
							</a-input-search>
						</a-form-item>
					</div>
				</a-form>
			</a-col>
		</a-row>
	</a-modal>
</template>

<script>
    import $ from "jquery";
    import mt from "../../../utils/mt";
    import resource from '../resource.js'

    export default {
        name: "Upload",
        props: {
            buckets: Array,
            currentBucket: String,
            currentDir: Object
        },
        data() {
            return {
                uploadDirectory: false,
                visible: false,
                uploadForm: null,
                uploading: false,
                uploadProgress: {
                    current: '',
                    fileIndex: 1,
                    files: 1,
                    uploadPercent: 0,
                },
                formItemLayout: {
                    labelCol: {
                        xs: {span: 24},
                        sm: {span: 6},
                    },
                    wrapperCol: {
                        xs: {span: 24},
                        sm: {span: 18},
                    },
                },
                fileList: [],
                cover: false,
                pathnameCheckResults: [],
                checkPathname: (rule, value, callback) => {
                    if (value === '') {
                        callback();
                    }
                    // if (/[\\[:\]*?"<>|,]/.test(value)) {
                    //     callback(new Error('资源名不能包含: * ? " < > | [ ],'));
                    // }
                    if (this.cover) {
                        callback();
                    }
                    const result = this.pathnameCheckResults[value];
                    if (result) {
                        callback(new Error('资源已存在'));
                    } else {
                        callback();
                    }
                },
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
        methods: {
            //文件上传
            onUploadOk(e) {
                if (this.fileList.length === 0) {
                    this.$message.warn('请先选择要上传的文件！');
                    return;
                }
                this.$http.post(`/member/resource/${this.currentBucket}/checkFile/isExists`, {
                    pathnames: this.uploadForm.getFieldValue("pathnames")
                }).then(response => {
                    this.pathnameCheckResults = response.data.result.checkResults;
                    this.uploadForm.validateFieldsAndScroll({
                        force: true
                    }, (err, values) => {
                        if (!err) {
                            this.uploadingData = values;
                            const pathnames = values.pathnames;
                            const bucketName = values.bucketName;
                            const cover = values.cover === undefined ? false : values.cover;
                            const isPublic = values.isPublic === undefined ? false : values.isPublic;
                            const contentType = values.contentType === undefined ? '' : values.contentType;
                            this.initUploadProgress();
                            this.uploadFile(this.fileList, 0, bucketName, pathnames, cover, isPublic, contentType, () => {
                                this.uploading = false;
                                this.$message.success("上传完成!");
                                this.visible = false;
                                this.$emit('ok');
                            });
                        } else {
                            let errorField = null;
                            let num = 0;
                            for (let index in err.pathnames) {
                                num = index;
                                errorField = err.pathnames[index].errors[0].field;
                                // const pathname = this.values.getFieldValue(errorField);
                                // this.$message.warn(err.pathnames[index].errors[0].message + ":" + pathname)
                                break;
                            }
                            $("#pathname-container").animate({
                                scrollTop: num * 40
                            }, 500);
                        }
                    });
                });
            },
            handleRemove(file) {
                if (this.uploading) {
                    return;
                }
                const index = this.fileList.indexOf(file);
                const newFileList = this.fileList.slice();
                newFileList.splice(index, 1);
                const pathnames = this.uploadForm.getFieldValue('pathnames');
                const newPathnames = pathnames.slice();
                newPathnames.splice(index, 1);
                const errorPathnames = this.uploadForm.getFieldsError().pathnames;
                const newErrorPathnames = errorPathnames.slice();
                newErrorPathnames.splice(index, 1);
                this.uploadForm.setFieldsValue({
                    "pathnames": newPathnames
                });
                for (let i = 0; i < newErrorPathnames.length; i++) {
                    if (newErrorPathnames[i]) {
                        this.uploadForm.validateFields([`pathnames[${i}]`]);
                    }
                }
                this.fileList = newFileList;
            },
            //点击上传按钮
            onUpload() {
                if (!this.currentBucket) {
                    this.$message.warn("您还没有桶，请先去创建一个吧");
                    return;
                }
                if (!this.uploading) {
                    this.pathnameCheckResults = [];
                    this.uploadDirectory = false;
                    this.uploadForm = this.$form.createForm(this, {name: 'register'});
                    this.initUploadProgress();
                    this.$nextTick().then(value => {
                        this.uploadForm.setFieldsValue({
                            bucketName: this.currentBucket,
                            pathnames: []
                        });
                    });
                    this.cover = false;
                    this.uploadProgress.uploadPercent = 0;
                    this.fileList = [];
                    this.uploadingData = {};
                } else {
                    this.$nextTick().then(value => {
                        this.uploadForm.setFieldsValue(this.uploadingData);
                    });
                }
                this.visible = true;
            },
            beforeUpload(file) {
                const pathname = this.getUploadPathname(file);
                for (let f of this.fileList) {
                    const existedPathname = this.getUploadPathname(f);
                    if (existedPathname === pathname) {
                        return false;
                    }
                }
                this.fileList.push(file);
                let obj = {};
                let key = `pathnames[${this.fileList.length - 1}]`;
                obj[key] = pathname;
                this.$nextTick().then(value => {
                    this.uploadForm.setFieldsValue(obj);
                    this.uploadForm.validateFields([key]);
                })
                return false;
            },
            getUploadPathname(file) {
                const webkitRelativePath = file.webkitRelativePath;
                let name = file.name;
                if (webkitRelativePath) {
                    name = webkitRelativePath;
                }

                let pathname;
                if (this.currentDir.path === '/') {
                    pathname = this.currentDir.path + name;
                } else {
                    pathname = this.currentDir.path + '/' + name;
                }
                return pathname;
            },
            onCoverChange(cover) {
                this.cover = cover;
                this.uploadForm.validateFields({
                    force: true
                });
            },
            onContentTypeSearch(searchText) {
                this.contentTypeDataSource = this.allContentTypes.filter(value => value.indexOf(searchText) !== -1);
            },
            doUploadPart(waitingUpload, index, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, files, fileIndex, callback) {
                if (index >= waitingUpload.length) {
                    callback();
                    return;
                }
                let uploadPart = waitingUpload[index].uploadPart;
                let chunkIndex = waitingUpload[index].chunkIndex;
                resource.md5File(uploadPart, chunkMd5 => {
                    const formData = new FormData();
                    formData.append("cover", cover);
                    formData.append("contentType", contentType);
                    formData.append("isPublic", isPublic);
                    formData.append('file', uploadPart);
                    formData.append('pathname', pathname);
                    formData.append('totalMd5', totalMd5);
                    formData.append('totalSize', totalSize);
                    formData.append('chunkMd5', chunkMd5);
                    formData.append('chunkSize', uploadPart.size);
                    formData.append('chunkIndex', chunkIndex);
                    let fileName = this.getFileName(pathname);
                    this.$http.post('/upload/' + bucketName, formData).then(response => {
                        console.log('分片' + chunkIndex + '上传结果:' + response.data.status);
                        this.updateUploadProgress(false, fileName, files, fileIndex + 1, 1, 1, chunks, chunkIndex + 1);
                        index++;
                        this.doUploadPart(waitingUpload, index, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, files, fileIndex, callback);
                    }, reason => {
                        this.uploading = false;
                        this.uploadProgress.errorMsg = reason;
                        console.log(pathname + '上传失败：', reason);
                    })
                });
            },
            updateUploadProgress(done, current, files, fileIndex, checks, checkIndex, chunks, chunkIndex) {
                let uploadPercent = done ? 100 : 5 * checkIndex / checks + chunkIndex / chunks * 94;
                uploadPercent = Math.floor(uploadPercent);
                this.uploadProgress = {
                    current, files, fileIndex, uploadPercent
                };
            },
            uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback) {
                if (index >= fileList.length) {
                    callback();
                    return;
                }
                let axios = this.$http;
                let $notification = this.$notification;
                let file = fileList[index];
                file.status = 'uploading';
                let lastModified = file.lastModified;
                const pathname = pathnames[index];
                let splitResult = resource.splitFile(file);
                let chunks = splitResult.chunks;
                const totalSize = splitResult.totalSize;
                const uploadParts = splitResult.uploadParts;
                this.uploading = true;
                const fileName = this.getFileName(pathname);
                this.uploadProgress.current = fileName;
                console.log(splitResult)
                resource.md5File(file, totalMd5 => {
                    let params = {
                        pathname, chunks, totalMd5, totalSize, contentType, isPublic, cover, lastModified
                    };
                    axios.post(`/upload/${bucketName}/init`, mt.transformFormData(params)).then(response => {
                        let result = response.data.result;
                        let fileExists = result.fileExists;
                        let existedChunkIndexs = result.existedChunkIndexs;
                        if (!fileExists) {
                            const waitingUpload = [];
                            uploadParts.forEach((uploadPart, chunkIndex) => {
                                if (mt.contains(existedChunkIndexs, chunkIndex)) {
                                    this.updateUploadProgress(false, fileName, this.fileList.length, index + 1, 1, 1, chunks, chunkIndex + 1);
                                    return;
                                }
                                waitingUpload.push({
                                    uploadPart, chunkIndex
                                });
                            });
                            this.doUploadPart(waitingUpload, 0, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, this.fileList.length, index, () => {
                                const mergeFormData = new FormData();
                                mergeFormData.append("cover", cover);
                                mergeFormData.append("contentType", contentType);
                                mergeFormData.append("isPublic", isPublic);
                                mergeFormData.append('pathname', pathname);
                                mergeFormData.append('totalMd5', totalMd5);
                                mergeFormData.append('totalSize', totalSize);
                                mergeFormData.append('bucketName', bucketName);
                                mergeFormData.append('lastModified', lastModified);
                                axios.post('/upload/mergeFiles?wait=true', mergeFormData)
                                    .then(response => {
                                        console.log(pathname + "上传完成！");
                                        this.updateUploadProgress(true, fileName, this.fileList.length, index + 1, 1, 1, 1, 1);
                                        file.status = 'done';
                                        $notification.success({
                                            message: "上传成功",
                                            description: pathname + "上传成功！",
                                            placement: "topRight"
                                        });
                                        index++;
                                        this.uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback);
                                    }, reason => {
                                        file.status = 'error';
                                        this.uploading = false;
                                        this.uploadProgress.errorMsg = reason;
                                        console.log(pathname + '上传失败：', reason);
                                        $notification.success({
                                            message: "上传失败",
                                            description: pathname + "上传失败：" + reason
                                        });
                                    });
                            });
                        } else {
                            console.log(pathname + "上传完成！");
                            file.status = 'done';
                            $notification.success({
                                message: "上传成功",
                                description: pathname + "上传成功！",
                                placement: "topRight"
                            });
                            //秒传
                            this.updateUploadProgress(true, fileName, this.fileList.length, index + 1, 1, 1, 1, 1);
                            index++;
                            this.uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback);
                        }
                    }, reason => {
                        file.status = 'error';
                        this.uploading = false;
                        this.uploadProgress.errorMsg = reason;
                        console.log(pathname + '上传失败：', reason);
                    });
                }, (checks, checkIndex) => {
                    this.updateUploadProgress(false, fileName, fileList.length, index + 1, checks, checkIndex, 1, 0);
                });
            },
            initUploadProgress() {
                this.uploadProgress = {
                    files: this.fileList.length,
                    fileIndex: 1,
                    current: '',
                    uploadPercent: 0,
                    errorMsg: null
                }
            },
            getFileName(pathname) {
                let lastIndexOf = pathname.lastIndexOf('/');
                if (lastIndexOf !== -1) {
                    return pathname.substring(lastIndexOf + 1)
                } else {
                    return pathname;
                }
            },
        }
    }
</script>

<style scoped>

</style>