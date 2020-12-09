<template>
	<a-card>
		<a-row style="margin-bottom:10px;">
			<div class="tool-btns">
				<a-button type="primary" @click="onAdd" :disabled="!this.canInsert()">上传
				</a-button>
				<a-button type="primary" @click="onCreateDir" :disabled="!this.canInsert()">
					创建文件夹
				</a-button>
				<a-button type="primary" @click="onBatchDelete"
						  :disabled="!this.canDelete() || this.selectedRowKeys.length === 0">
					批量删除
				</a-button>
				<a-input-search placeholder="输入搜索内容" style="margin-left:15px;width: 200px" v-model="keyWord"
								@search="onSearch()" @change="pressEnter()"/>
				<a-select v-model="currentBucket" style="width:150px;float: right;">
					<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
						{{bucket.bucketName}}
					</a-select-option>
				</a-select>
			</div>
		</a-row>
		<div style="margin:10px;">
			<!-- 返回 -->
			<a class="dir-nav" @click="onBack(lastDir)" :disabled="!lastDir">
				<a-icon type="rollback"/>
			</a>
			<a style="margin-left: 10px;" @click="reload">
				<a-icon type="sync"/>
			</a>
			<!-- 父路径 -->
			<span v-if="parentDirs.length > 0">
				<a style="margin-left:10px;" class="dir-nav" v-for="dir in parentDirs" :key="dir.path"
				   @click.once="changeCurrentPath(dir)">{{dir.path}}</a>
			</span>
			<!-- 当前路径 -->
			<span class="current" style="margin-left:10px;">
				{{currentDir.path}}
			</span>
		</div>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :row-selection="rowSelection"
				 :rowKey="(row) => {return row.id}"
				 :scroll="{ x: 1500 }"
				 :loading="tableLoading"
				 @change="handleTableChange">
			<span slot="name" slot-scope="text,record">
				<span v-if="record.isDir">
					<!-- 文件夹 -->
					<icon-font class="resource-icon" type="icon-weibiaoti-_huabanfuben" style="font-size:18px;"/>
					<a :id="record.id" :class="getResourceClass(record)" @click="changeCurrentPath(record)">
						/{{record.fileName}}
					</a>
				</span>
				<span v-else>
					<!-- 文件 -->
					<icon-font class="resource-icon" v-if="record.icon" :type="record.icon" style="font-size:16px;"/>
					<icon-font class="resource-icon" v-else type="icon-wenjian" style="font-size:16px;"/>
					
					<!-- 图片展示 -->
					<a :id="record.id" v-if="record.image"
					   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
					   :class="getResourceClass(record)"
					>
						{{record.fileName}}
					</a>
					<a :id="record.id" v-else
					   :class="getResourceClass(record)"
					   :href="`/mos/${currentBucket}${record.urlEncodePath}`"
					   @click="onRecentClick(record)"
					   target="_blank">
						{{record.fileName}}
					</a>
				</span>
			</span>
			<span slot="isPublic" slot-scope="text,record">
				<span v-if="!record.isDir">
					<a-tag v-if="text" color="#f50">公开</a-tag>
					<a-tag v-else color="#87d068">私有</a-tag>
				</span>
			</span>
			<span slot="action" slot-scope="text,record">
				<span :style="canDelete() ? '' : 'display:none'">
					<a-popconfirm
							title="是否删除?"
							ok-text="是"
							cancel-text="否"
							@confirm="onDelete(record,record.isDir ? 'delDir' : 'delFile')"
					>
						<a style="color:red;">删除</a>
					</a-popconfirm>
					<a-divider type="vertical"/>
				</span>
				<span :style="canUpdate() ? '' : 'display:none'">
					<a @click="record.isDir ? onEditDir(record) : onEditResource(record)">编辑</a>
					<a-divider v-if="!record.isDir" type="vertical"/>
				</span>
				<span v-if="!record.isDir">
					<a @click="openGenAddr(record)">访问链</a>
					<a-divider type="vertical"/>
					<a :href="`/mos/${currentBucket}${record.urlEncodePath}?download=true`">下载</a>
				</span>
			</span>
		</a-table>
		<div>
			<a-modal v-model="visible" title="上传" @ok="handleOk"
					 okText="上传"
					 :confirmLoading="uploading"
					 :maskClosable="false"
					 :destroyOnClose="true"
			>
				<a-form :form="form">
					<span v-if="uploading || uploadProgress.errorMsg">
						<span>（{{uploadProgress.fileIndex}}/{{uploadProgress.files}}）[{{uploadProgress.current}}] {{uploadProgress.errorMsg ? '上传失败：'+uploadProgress.errorMsg:'上传中...'}}</span>
						<a-progress :percent="uploadProgress.uploadPercent"
									:status="uploadProgress.errorMsg ? 'exception' : 'active'"/>
					</span>
					<a-form-item v-bind="formItemLayout" label="桶">
						<a-select v-decorator="['bucketName',{rules: [{required: true,message: '请选择桶',}],},]">
							<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
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
						<a-upload :file-list="fileList" :multiple="true" :remove="handleRemove"
								  :directory="uploadDirectory"
								  :before-upload="beforeUpload">
							<a-button>
								<a-icon type="upload"/>
								选择{{uploadDirectory ? '文件夹' : '文件'}}
							</a-button>
						</a-upload>
					</a-form-item>
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
							<a-button slot="enterButton">
								<a-icon type="delete"/>
							</a-button>
						</a-input-search>
					</a-form-item>
				</a-form>
			</a-modal>
			<a-modal v-model="addrVisible" title="访问链详情" @ok="addrHandleOk" okText="生成">
				<a-form-model
						ref="addrForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="addrForm">
					<a-form-model-item label="秘钥">
						<a-select v-model="addrForm.openId">
							<a-select-option v-for="row in openIds" :key="row.openId" :value="row.openId">{{row.useInfo
								? row.useInfo : row.openId}}
							</a-select-option>
						</a-select>
					</a-form-model-item>
					<a-form-model-item label="桶" prop="bucketName">
						<a-input v-model="addrForm.bucketName" disabled/>
					</a-form-model-item>
					<a-form-model-item label="文件" prop="fileName">
						<a-input v-model="addrForm.fileName" disabled/>
					</a-form-model-item>
					<a-form-model-item label="有效时间" prop="expireNumber">
						<a-input :min="1" :disabled="addrForm.isPublic || addrForm.expireUnit==='ever'"
								 type="number" v-model="addrForm.expireNumber" style="width: 100%">
							<a-select :disabled="addrForm.isPublic" slot="addonAfter" v-model="addrForm.expireUnit"
									  style="width: 70px"
									  @change="onExpireUnitChange">
								<a-select-option value="minute">分钟</a-select-option>
								<a-select-option value="hour">小时</a-select-option>
								<a-select-option value="day">天</a-select-option>
								<a-select-option value="month">月</a-select-option>
								<a-select-option value="year">年</a-select-option>
								<a-select-option value="ever">永久</a-select-option>
							</a-select>
						</a-input>
					</a-form-model-item>
					<a-form-model-item label="访问链" prop="signUrl">
						<a-input v-model="addrForm.signUrl" type="textarea"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
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
			<a-modal v-model="editDirVisible" title="路径详情" :confirmLoading="editDirSaving" @ok="onEditDirOk"
					 okText="保存">
				<a-form-model
						ref="editDirForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="editDirForm">
					<a-form-model-item label="资源名" prop="path">
						<a-input ref="editDirPath" v-model="editDirForm.path" @pressEnter="onEditDirOk"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
			<viewer :trigger="images" class="viewer" ref="viewer" @inited="inited">
				<img style="display: none" v-for="src in images" :src="src" :key="src">
			</viewer>
		</div>
	</a-card>
</template>
<script>
    import {Icon} from 'ant-design-vue';
    import $ from 'jquery'
    import resource from './resource'

    const columns = [
        {title: '文件名', dataIndex: 'name', width: 300, scopedSlots: {customRender: 'name'}, sorter: true},
        {title: '文件大小', dataIndex: 'readableSize', width: 120, sorter: true},
        {title: '权限', dataIndex: 'isPublic', width: 120, scopedSlots: {customRender: 'isPublic'}, sorter: true},
        {title: '响应头', dataIndex: 'contentType', width: 200},
        {title: '修改时间', dataIndex: 'updatedDate', width: 160, sorter: true},
        {title: '修改人', dataIndex: 'updatedBy', width: 120, sorter: true},
        {title: '操作', width: 220, scopedSlots: {customRender: 'action'},},
    ];

    const IconFont = Icon.createFromIconfontCN({
        scriptUrl: '//at.alicdn.com/t/font_1836787_2a565rchgum.js',
    });
    export default {
        data() {
            return {
                uploadDirectory: false,
                editDirVisible: false,
                editDirForm: {
                    path: ''
                },
                editDirSaving: false,
                locations: {
                    lastLocation: [],
                    current: {}
                },
                images: [],
                checkPathname: (rule, value, callback) => {
                    if (value === '') {
                        callback();
                    }
                    if (/[\\[:\]*?"<>|,]/.test(value)) {
                        callback(new Error('资源名不能包含: * ? " < > | [ ],'));
                    }
                    if (this.cover) {
                        callback();
                    }
                    let bucketName = this.form.getFieldValue('bucketName');
                    this.$http.get(`/upload/${bucketName}/isExists`, {
                        params: {
                            pathname: value
                        }
                    }).then(response => {
                        let isExists = response.data.result;
                        if (isExists) {
                            callback(new Error('资源已存在'));
                        } else {
                            callback();
                        }
                    });
                },
                lastDir: null,
                parentDirs: [],
                currentBucket: null,
                currentDir: {
                    path: '/',
                    urlEncodePath: '/'
                },
                data: [],
                columns,
                pagination: {
                    pageSizeOptions: ['10', '20', '50', '100'],
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal(total, range) {
                        return '数据总数：' + total;
                    }
                },
                visible: false,
                form: {
                    bucketName: '',
                    pathnames: [],
                },
                keyWord: '',
                rules: {
                    bucketName: [
                        {required: true, message: '请选择bucket', trigger: 'blur'},
                    ],
                },
                buckets: [],
                fileList: [],
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
                uploading: false,
                uploadProgress: {
                    current: '',
                    fileIndex: 1,
                    files: 1,
                    uploadPercent: 0,
                },
                saving: false,
                selectedRowKeys: [],
                addrVisible: false,
                cover: false,
                addrForm: {
                    signUrl: '',
                    openId: null,
                    resourceId: null,
                    expireSeconds: 3600,
                    bucketId: null,
                    expireNumber: 2,
                    expireUnit: 'hour',
                },
                openIds: [],
                editVisible: false,
                editForm: {
                    pathname: null,
                    isPublic: false,
                    contentType: null
                },
                editRules: {
                    // pathname: [{required: true, message: '请输入资源名', trigger: 'blur'}],
                },
                allContentTypes: [
                    'text/html;charset=UTF-8', 'text/xml;charset=UTF-8', 'text/plain;charset=UTF-8', 'application/json;charset=UTF-8', 'application/octet-stream',
                    'application/pdf', 'text/markdown;charset=UTF-8', 'text/event-stream;charset=UTF-8',
                    'image/png', 'image/jpeg', 'image/gif', 'application/xml', 'application/xhtml+xml', 'application/stream+json',
                    'application/rss+xml', 'application/problem+xml', 'application/problem+json;charset=UTF-8', 'application/problem+json'
                ],
                contentTypeDataSource: [],
                sortField: null,
                sortOrder: null,
                queryAlias: {
                    pageNum: 'n',
                    pageSize: 's',
                    urlEncodePath: 'p',
                    keyWord: 'k',
                    sortField: 'f',
                    sortOrder: 'o',
                    currentBucket: 'b'
                },
                historyClicks: [],
                refreshed: true,
                tableLoading: false
            };
        },
        computed: {
            rowSelection() {
                const {selectedRowKeys} = this;
                return {
                    selectedRowKeys,
                    columnWidth: "40px",
                    onChange: this.onSelectChange,
                    hideDefaultSelections: true,
                    selections: [
                        {
                            key: 'dirs',
                            text: '文件夹',
                            onSelect: changableRowKeys => {
                                let newSelectedRowKeys = [];
                                newSelectedRowKeys = changableRowKeys.filter((key, index) => {
                                    return this.data[index].isDir;
                                });
                                this.selectedRowKeys = newSelectedRowKeys;
                            },
                        },
                        {
                            key: 'files',
                            text: '文件',
                            onSelect: changableRowKeys => {
                                let newSelectedRowKeys = [];
                                newSelectedRowKeys = changableRowKeys.filter((key, index) => {
                                    return !this.data[index].isDir;
                                });
                                this.selectedRowKeys = newSelectedRowKeys;
                            },
                        },
                    ],
                    onSelection: this.onSelection,
                };
            },
        },
        destroyed() {
            window.removeEventListener("popstate", resource.popHandler);
        },
        mounted() {
            resource.setThat(this);
            window.addEventListener("popstate", resource.popHandler, false);
            resource.fetchBucket();
            const queryParams = this.$route.query;
            if (queryParams) {
                if (queryParams.n) {
                    this.pagination.current = parseInt(queryParams.n);
                }
                if (queryParams.s) {
                    this.pagination.pageSize = parseInt(queryParams.s);
                }
                if (queryParams.p) {
                    this.currentDir.urlEncodePath = queryParams.p;
                }
                if (queryParams.k) {
                    this.keyWord = queryParams.k;
                }
                if (queryParams.f) {
                    this.sortField = queryParams.f;
                }
                if (queryParams.o) {
                    this.sortOrder = queryParams.o;
                }
                if (queryParams.b) {
                    this.currentBucket = queryParams.b;
                }
            }
            this.contentTypeDataSource = [...this.allContentTypes];
            $(".ant-table-body").css("overflow-x", "auto");

        },
        watch: {
            "addrForm.expireNumber"() {
                if (this.addrForm.expireNumber < 1) {
                    this.addrForm.expireNumber = 1;
                }
            },
            currentBucket() {
                let pagination = this.pagination;
                this.data = [];
                if (!this.refreshed) {
                    this.fetch({
                        pageNum: 1,
                        pageSize: pagination.pageSize,
                        path: '/',
                        keyWord: '',
                        sortField: this.sortField,
                        sortOrder: this.sortOrder
                    });
                } else {
                    let current = pagination.current ? pagination.current : 1;
                    this.refreshed = false;
                    this.fetch({
                        pageNum: current,
                        pageSize: pagination.pageSize,
                        path: this.currentDir.urlEncodePath,
                        keyWord: this.keyWord,
                        sortField: this.sortField,
                        sortOrder: this.sortOrder
                    });
                }
            },
            data() {
                this.images = this.data.filter(record => {
                    return record.image;
                }).map(record => {
                    return `/mos/${this.currentBucket}${record.urlEncodePath}`;
                });
            }
        },
        methods: {
            canInsert() {
                return this.hasPerm(this.currentBucket, 'INSERT');
            },
            canSelect() {
                return this.hasPerm(this.currentBucket, 'SELECT');
            },
            canUpdate() {
                return this.hasPerm(this.currentBucket, 'UPDATE');
            },
            canDelete() {
                return this.hasPerm(this.currentBucket, 'DELETE');
            },
            onCreateDir() {
                this.editDirVisible = true;
                let path = this.currentDir.path;
                if (path !== '/') {
                    path = path + '/';
                }
                this.editDirForm = {
                    path: path,
                    id: null
                }
                this.$nextTick().then(value => {
                    this.$refs.editDirPath.focus();
                });
            },
            onEditDir(record) {
                this.editDirVisible = true;
                this.editDirForm = {
                    path: record.path,
                    id: record.id
                }
                this.$nextTick().then(value => {
                    this.$refs.editDirPath.focus();
                });
            },
            onEditDirOk() {
                this.editDirSaving = true;
                if (this.editDirForm.id) {
                    this.$http.put(`/member/dir/${this.currentBucket}/${this.editDirForm.id}`, this.editDirForm).then(response => {
                        this.$message.success("修改成功");
                        this.editDirSaving = false;
                        this.editDirVisible = false;
                        this.reload();
                    }, reason => {
                        this.editDirSaving = false;
                    });
                } else {
                    this.$http.post(`/member/dir/${this.currentBucket}`, this.editDirForm).then(response => {
                        this.$message.success("创建成功");
                        this.editDirSaving = false;
                        this.editDirVisible = false;
                        this.reload();
                    }, reason => {
                        this.editDirSaving = false;
                    });
                }
            },
            showImages(url, record) {
                resource.showImages(url, record);
            },
            getResourceClass(record) {
                let contains = false;
                for (let path of this.historyClicks) {
                    if (path === record.path) {
                        contains = true;
                        break;
                    }
                }
                return 'resource-link ' + (contains ? 'activeAnchor' : '');
            },
            onRecentClick(record) {
                this.historyClicks.push(record.path);
            },
            inited(viewer) {
                this.$viewer = viewer
            },
            onSearch() {
                this.fetch({
                    pageNum: 1,
                    pageSize: this.pagination.pageSize,
                    path: this.currentDir.urlEncodePath,
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder
                });
            },
            openGenAddr(record) {
                this.addrForm = {
                    signUrl: null,
                    openId: null,
                    isPublic: record.isPublic,
                    fileName: record.fileName,
                    resourceId: record.id,
                    expireSeconds: 3600,
                    expireNumber: 1,
                    expireUnit: 'hour',
                    bucketName: this.currentBucket
                }
                this.addrVisible = true;
                this.$http.get('/member/access/' + this.currentBucket).then(response => {
                    this.openIds = response.data.result;
                    this.addrForm.openId = this.openIds[0].openId;
                    if (record.isPublic) {
                        resource.genAddr();
                    }
                });
            },
            onExpireUnitChange(unit) {
                if (unit === 'ever') {
                    this.addrForm.expireNumber = 1;
                }
                this.addrForm.signUrl = '';
            },
            addrHandleOk() {
                resource.genAddr();
            },
            onSelectChange(selectedRowKeys, selectedRows) {
                this.selectedRowKeys = selectedRowKeys;
            },
            //点击上传按钮
            onAdd() {
                if (!this.currentBucket) {
                    this.$message.warn("您还没有桶，请先去创建一个吧");
                    return;
                }
                this.uploadDirectory = false;
                this.form = {
                    bucketName: this.currentBucket,
                    pathname: this.currentDir.path
                };
                resource.initUploadProgress();
                this.$nextTick().then(value => {
                    this.form.setFieldsValue({
                        bucketName: this.currentBucket,
                        pathnames: []
                    })
                });
                this.cover = false;
                this.uploadPercent = 0;
                this.fileList = [];
                this.form = this.$form.createForm(this, {name: 'register'});
                this.visible = true;
            },
            onBack(dir) {
                history.back();
            },
            changeCurrentPath(dir, extendParams, ignoreHistory) {
                this.onRecentClick(dir);
                ignoreHistory = ignoreHistory === undefined ? false : ignoreHistory;
                let params = {
                    pageNum: 1,
                    pageSize: this.pagination.pageSize,
                    path: dir ? dir.urlEncodePath : '/',
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder,
                    ignoreHistory: ignoreHistory,
                };
                extendParams = extendParams || {}
                $.extend(params, extendParams, {
                    path: dir ? dir.urlEncodePath : '/'
                })
                this.fetch(params, () => {
                    this.currentDir = dir;
                });
                this.selectedRowKeys = [];
            },
            onDelete(record, type) {
                let params = {};
                if (type === 'delFile') {
                    params = {fileIds: record.id};
                } else {
                    params = {dirIds: record.id};
                }
                this.$http.delete(`/member/resource/${this.currentBucket}/del`, {
                    params: params
                }).then(response => {
                    this.$message.success("删除成功");
                    this.reload();
                });
            },
            onBatchDelete() {
                let dirIds = [];
                let fileIds = [];
                const rows = this.data;
                const selectedRowKeys = this.selectedRowKeys;
                const selectedRows = selectedRowKeys.map(id => {
                    for (let row of rows) {
                        if (row.id === id) {
                            return row;
                        }
                    }
                })
                let dirNames = selectedRows.filter(value => value.isDir).map(value => value.path);
                let fileNames = selectedRows.filter(value => !value.isDir).map(value => value.path);
                dirIds = selectedRows.filter(value => value.isDir).map(value => value.id);
                fileIds = selectedRows.filter(value => !value.isDir).map(value => value.id);
                dirNames.push(fileNames);
                const $this = this;
                this.$confirm({
                    title: '确定删除这些资源吗?',
                    content: dirNames.join(","),
                    okText: '确定',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk() {
                        const params = {
                            fileIds: fileIds.join(","),
                            dirIds: dirIds.join(",")
                        };
                        $this.$http.delete(`/member/resource/${$this.currentBucket}/del`, {
                            params: params
                        }).then(response => {
                            $this.$message.success("删除成功");
                            $this.selectedRowKeys = [];
                            $this.reload();
                        });
                    },
                });
            },
            handleTableChange(pagination, filters, sorter) {
                const pager = {...this.pagination};
                pager.current = pagination.current;
                pager.pageSize = pagination.pageSize;
                this.pagination = pager;
                if (sorter && sorter.order) {
                    this.sortField = sorter.field;
                    this.sortOrder = sorter.order;
                } else {
                    this.sortField = null;
                    this.sortOrder = null;
                }
                this.selectedRowKeys = [];
                this.reload();
            },
            reload() {
                let pagination = this.pagination;
                this.fetch({
                    pageNum: pagination.current,
                    pageSize: pagination.pageSize,
                    path: this.currentDir.urlEncodePath,
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder,
                    ignoreHistory: true
                });
            },
            fetch(params = {
                pageNum: 1,
                pageSize: 10,
                path: this.currentDir.urlEncodePath,
                keyWord: this.keyWord,
                sortField: null,
                sortOrder: null,
            }, callback) {
                this.tableLoading = true;
                this.$http.get("/member/resource/" + this.currentBucket + params.path, {
                    params: params
                }).then(value => {
                    this.tableLoading = false;
                    const result = value.data.result;
                    this.currentDir = !result.currentDir ? {
                        path: '/',
                        urlEncodePath: '/'
                    } : result.currentDir;
                    this.parentDirs = result.parentDirs;
                    this.lastDir = result.lastDir;
                    const pagination = {...this.pagination};
                    if (result.resources) {
                        pagination.current = result.resources.pageNum;
                        this.data = [...result.resources.list];
                        pagination.total = result.resources.total;
                        pagination.pageSize = result.resources.pageSize;
                    } else {
                        this.data = [];
                        pagination.total = 0;
                    }
                    this.pagination = pagination;
                    if (!params.ignoreHistory) {
                        resource.addHistory();
                    }
                    if (callback) {
                        callback();
                    }
                }, reason => {
                    this.tableLoading = false;
                });
            },
            handleOk(e) {
                this.form.validateFieldsAndScroll((err, values) => {
                    if (!err) {
                        const pathnames = values.pathnames;
                        const bucketName = values.bucketName;
                        const cover = values.cover === undefined ? false : values.cover;
                        const isPublic = values.isPublic === undefined ? false : values.isPublic;
                        const contentType = values.contentType === undefined ? '' : values.contentType;
                        resource.initUploadProgress();
                        resource.uploadFile(this.fileList, 0, bucketName, pathnames, cover, isPublic, contentType, () => {
                            this.uploading = false;
                            this.$message.success("上传成功!");
                            this.visible = false;
                            this.reload();
                        });
                    }
                });
            },
            handleRemove(file) {
                const index = this.fileList.indexOf(file);
                const newFileList = this.fileList.slice();
                newFileList.splice(index, 1);
                const pathnames = this.form.getFieldValue('pathnames');
                const newPathnames = pathnames.slice();
                newPathnames.splice(index, 1);
                const errorPathnames = this.form.getFieldsError().pathnames;
                const newErrorPathnames = errorPathnames.slice();
                newErrorPathnames.splice(index, 1);
                this.form.setFieldsValue({
                    "pathnames": newPathnames
                });
                for (let i = 0; i < newErrorPathnames.length; i++) {
                    if (newErrorPathnames[i]) {
                        this.form.validateFields([`pathnames[${i}]`]);
                    }
                }
                this.fileList = newFileList;
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
                this.form.validateFields();
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
                    this.form.setFieldsValue(obj);
                    this.form.validateFields([key]);
                })
                return false;
            },
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
                    this.reload();
                    this.saving = false;
                    this.editVisible = false;
                }, reason => {
                    this.saving = false
                });
            },
            onContentTypeSearch(searchText) {
                this.contentTypeDataSource = this.allContentTypes.filter(value => value.indexOf(searchText) !== -1);
            }
        },
        components: {
            IconFont
            // ,Viewer
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
	
	a.resource-link.activeAnchor {
		color: #40a9ff;
		/*color: #52c41a;*/
	}
	
	.resource-icon {
		margin-right: 8px;
	}
	
	
	.path {
		margin-right: 15px;
	}
	
	.path.current {
		color: gray;
	}
	
	.tool-btns button {
		margin-left: 15px;
	}
	
	.ant-table-body {
		overflow: auto;
	}
</style>