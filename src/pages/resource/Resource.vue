<template>
	<a-card>
		<a-row style="margin-bottom:10px;">
			<div class="tool-btns">
				<a-button type="primary" @click="onUpload" :disabled="!this.canInsert()">
					{{upload.uploading ? '查看上传进度' : '上传'}}
				</a-button>
				<a-button type="primary" @click="onEditDir()" :disabled="!this.canInsert()">
					创建文件夹
				</a-button>
				<a-dropdown>
					<a-menu slot="overlay" @click="handleActionClick">
						<a-menu-item key="copy" :disabled="!this.canSelect() || this.selectedRowKeys.length === 0">复制
						</a-menu-item>
						<a-menu-item key="move" :disabled="!this.canDelete() || this.selectedRowKeys.length === 0">移动
						</a-menu-item>
						<a-menu-item key="delete" :disabled="!this.canDelete() || this.selectedRowKeys.length === 0">
							删除
						</a-menu-item>
					</a-menu>
					<a-button type="primary">操作
						<a-icon type="down"/>
					</a-button>
				</a-dropdown>
				<a-input-search :placeholder="searchLocation === 'curr' ? '搜索当前位置' : '搜索所有位置'"
								style="margin-left:15px;width: 300px" v-model="keyWord"
								@search="onSearch()" @pressEnter="onSearch()">
					<a-select slot="addonBefore" v-model="searchLocation" style="width: 70px">
						<a-select-option value="curr">
							当前
						</a-select-option>
						<a-select-option value="all">
							所有
						</a-select-option>
					</a-select>
				</a-input-search>
				<a-select v-model="currentBucket" style="width:150px;float: right;">
					<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
						{{bucket.bucketName}}
					</a-select-option>
				</a-select>
			</div>
		</a-row>
		<div style="margin:10px;">
			<!-- 返回 -->
			<a class="dir-nav" @click="onBack()">
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
				 :rowKey="(row) => {return (row.isDir?'dir-':'resource-')+row.id}"
				 :scroll="{ x: 1200 }"
				 :loading="tableLoading"
				 @change="handleTableChange">
			<span slot="name" slot-scope="text,record">
				<span v-if="record.isDir">
					<!-- 文件夹 -->
					<icon-font class="resource-icon" type="icon-weibiaoti-_huabanfuben" style="font-size:18px;"/>
					<a :id="record.id" :class="getResourceClass(record)" @click="changeCurrentPath(record)"
					   @touchstart="onPressDown('_self',record)"
					   @touchend="onPressUp(record)"
					   @mousedown="onPressDown('_blank',record)"
					   @mouseup="onPressUp(record)"
					>
						{{showDetailPath?record.path:('/'+record.fileName)}}
					</a>
				</span>
				<span v-else>
					<!-- 文件 -->
					<a-row type="flex" class="file">
						<a-col :span="record.thumbFileHouseId ? 8:2" align="center" class="thumb">
							<span v-if="record.thumbFileHouseId">
								<a :id="record.id" v-if="record.image"
								   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
								   :class="getResourceClass(record)"
								>
									<Thumb :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
								</a>
								<a v-else :href="getResourceUrl(record)"
								   @click="onRecentClick(record)"
								   target="_blank">
									<Thumb :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
								</a>
							</span>
							<span v-else>
								<icon-font class="resource-icon" v-if="record.icon" :type="record.icon"
										   style="font-size:16px;margin:0;"/>
								<icon-font class="resource-icon" v-else type="icon-wenjian" style="font-size:16px;margin:0;"/>
							</span>
						</a-col>
						<a-col span="16" class="file-title">
							<!-- 图片展示 -->
							<a :id="record.id" v-if="record.image"
							   @click="showImages(`/mos/${currentBucket}${record.urlEncodePath}`,record)"
							   :class="getResourceClass(record)"
							>
								{{showDetailPath?record.path:record.fileName}}
							</a>
							<a :id="record.id" v-else
							   :class="getResourceClass(record)"
							   :href="getResourceUrl(record)"
							   @click="onRecentClick(record)"
							   target="_blank">
								{{showDetailPath?record.path:record.fileName}}
							</a>
						</a-col>
					</a-row>
				</span>
			</span>
			<span slot="isPublic" slot-scope="text,record">
				<span v-if="!record.isDir">
					<a-tag v-if="text" color="#f50">公开</a-tag>
					<a-tag v-else color="#87d068">私有</a-tag>
				</span>
			</span>
			<span slot="visits" slot-scope="text,record">
				<span v-if="!record.isDir">
					{{text}}
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
				<a-divider v-if="record.isDir" type="vertical"/>
				<a @click="openGenAddr(record)">访问链</a>
				<span v-if="!record.isDir">
					<a-divider type="vertical"/>
					<a :href="`/mos/${currentBucket}${record.urlEncodePath}?download=true`">下载</a>
				</span>
				<span v-else>
					<a-divider type="vertical"/>
					<a :href="`/mos/${currentBucket}${record.urlEncodePath}?gallary=true`" target="_blank">图集</a>
				</span>
			</span>
		</a-table>
		<div>
			<Upload ref="upload" :buckets="buckets" :current-bucket="currentBucket" :current-dir="currentDir"
					@ok="reload"/>
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
					<a-form-model-item label="是否使用渲染器" prop="render">
						<a-switch v-model="addrForm.render"></a-switch>
					</a-form-model-item>
					<a-form-model-item label="访问链" prop="signUrl">
						<a-input v-model="addrForm.signUrl" type="textarea" style="height: 200px;"/>
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
					<a-form-model-item label="父路径" prop="path">
						<a-input v-model="editDirForm.parentPath" @pressEnter="onEditDirOk"/>
					</a-form-model-item>
					<a-form-model-item label="名称" prop="name">
						<a-input ref="editDirName" v-model="editDirForm.name" @pressEnter="onEditDirOk"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
			<Copy ref="copy" type="copy" :buckets="buckets" :current-dir="currentDir" :current-bucket="currentBucket"/>
			<Copy ref="move" type="move" :buckets="buckets" :current-dir="currentDir" :current-bucket="currentBucket"
				  @ok="reload"/>
			<viewer :trigger="images" class="viewer" ref="viewer" @inited="inited">
				<img style="display: none" v-for="image in images" :src="image.thumb" :origin="image.origin"
					 :key="image.origin">
			</viewer>
		</div>
	</a-card>
</template>
<script>
    import {Icon} from 'ant-design-vue';
    import $ from 'jquery'
    import resource from './resource.js'
    import Upload from './components/Upload'
    import Copy from "./components/Copy";
    import Thumb from "./components/Thumb";

    const columns = [
        {title: '文件名', dataIndex: 'name', width: 300, scopedSlots: {customRender: 'name'}, sorter: true},
        {title: '文件大小', dataIndex: 'readableSize', width: 100, sorter: true},
        {title: '权限', dataIndex: 'isPublic', width: 80, scopedSlots: {customRender: 'isPublic'}, sorter: true},
        {title: '访问量', dataIndex: 'visits', width: 80, scopedSlots: {customRender: 'visits'}, sorter: true},
        {title: '修改时间', dataIndex: 'updatedDate', width: 150, sorter: true},
        {title: '修改人', dataIndex: 'updatedBy', width: 120, sorter: true},
        // {title: '响应头', dataIndex: 'contentType', width: 100},
        {title: '操作', width: 250, scopedSlots: {customRender: 'action'}},
    ];

    const IconFont = Icon.createFromIconfontCN({
        scriptUrl: '//at.alicdn.com/t/font_1836787_2a565rchgum.js',
    });

    export default {
        components: {
            Thumb,
            Copy,
            IconFont, Upload
        },
        data() {
            return {
                upload: {},
                editDirVisible: false,
                editDirForm: {
                    parentPath: '',
                    name: ''
                },
                editDirSaving: false,
                locations: {
                    lastLocation: [],
                    current: {}
                },
                images: [],
                searchLocation: 'curr',
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
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal(total, range) {
                        return '数据总数：' + total;
                    }
                },
                keyWord: '',
                rules: {
                    bucketName: [
                        {required: true, message: '请选择bucket', trigger: 'blur'},
                    ],
                },
                buckets: [],
                saving: false,
                selectedRowKeys: [],
                addrVisible: false,
                addrForm: {
                    signUrl: '',
                    openId: null,
                    resourceId: null,
                    expireSeconds: 3600,
                    bucketId: null,
                    expireNumber: 2,
                    expireUnit: 'hour',
                    render: false
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
                    path: 'p',
                    searchLocation: 'l',
                    keyWord: 'k',
                    sortField: 'f',
                    sortOrder: 'o',
                    currentBucket: 'b'
                },
                historyClicks: [],
                refreshed: true,
                tableLoading: false,
                showDetailPath: false,
                longPressTimer: null,
                fileSuffix: {}
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
                    // onSelection: this.onSelection,
                };
            },
        },
        destroyed() {
            window.removeEventListener("popstate", resource.popHandler);
        },
        mounted() {
            this.$nextTick().then(value => {
                this.upload = this.$refs.upload;
            });
            resource.setThat(this);
            window.addEventListener("popstate", resource.popHandler, false);
            const queryParams = this.$route.query;
            if (queryParams) {
                if (queryParams.n) {
                    this.pagination.current = parseInt(queryParams.n);
                }
                if (queryParams.s) {
                    this.pagination.pageSize = parseInt(queryParams.s);
                }
                if (queryParams.p) {
                    this.currentDir.path = queryParams.p;
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
                if (queryParams.l) {
                    this.searchLocation = queryParams.l;
                }
            }
            this.$http.get('/member/resource/file/suffix').then(value => {
                this.fileSuffix = value.data;
            });
            resource.fetchBucket();
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
                //只有第一次进来的时候需要记忆加载
                this.selectedRowKeys = [];
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
                    this.fetch({
                        pageNum: current,
                        pageSize: pagination.pageSize,
                        path: this.searchLocation === 'all' ? '' : this.currentDir.path,
                        keyWord: this.keyWord,
                        sortField: this.sortField,
                        sortOrder: this.sortOrder
                    });
                    this.refreshed = false;
                }
            },
            data() {
                this.images = this.data.filter(record => {
                    return record.image;
                }).map(record => {
                    let url = `/mos/${this.currentBucket}${record.urlEncodePath}`;
                    let thumb = record.thumbFileHouseId ? url + "?thumb=true" : url;
                    return {
                        origin: url,
                        thumb: thumb
                    };
                });
            }
        },
        methods: {
            handleActionClick(e) {
                switch (e.key) {
                    case 'delete':
                        this.onBatchDelete();
                        break;
                    case 'copy':
                        this.onCopyToBucket();
                        break;
                    case 'move':
                        this.onMoveToBucket();
                        break;
                }
            },
            onMoveToBucket() {
                this.$refs.move.onCopyToBucket(this.getSelectRecords());
            },
            getResourceUrl(record) {
                let videoSuffix = this.fileSuffix.video;
                let fileName = record.fileName;
                for (let item of videoSuffix) {
                    if (fileName.endsWith(item)) {
                        return `/viewer/video?bucket=${this.currentBucket}&id=${record.id}&path=${this.currentDir.path}`;
                    }
                }
                return record.signUrl ? record.signUrl : `/mos/${this.currentBucket}${record.urlEncodePath}?render=true`;
            },
            onPressDown(target, dir) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                }
                const url = `/mos/${this.currentBucket}${dir.urlEncodePath}?gallary=true`;
                let $this = this;
                this.longPressTimer = setTimeout(function () {
                    $this.onRecentClick(dir);
                    window.open(url, target);
                }, 1000);
            },
            onPressUp() {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            },
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
            onCopyToBucket() {
                this.$refs.copy.onCopyToBucket(this.getSelectRecords());
            },
            onEditDir(record) {
                this.editDirVisible = true;
                let parentPath = '/';
                let name = '';
                let id = null;
                if (record && record.id) {
                    id = record.id;
                    let path = record.path;
                    if (path !== '/') {
                        let index = path.lastIndexOf('/');
                        parentPath = path.substring(0, index);
                        name = path.substring(index + 1);
                    }
                    if (parentPath === '') {
                        parentPath = '/';
                    }
                } else {
                    parentPath = this.currentDir.path;
                }
                this.editDirForm = {
                    parentPath: parentPath,
                    name: name,
                    id: id
                }
                this.$nextTick().then(value => {
                    this.$refs.editDirName.focus();
                });
            },
            //修改文件夹
            onEditDirOk() {
                this.editDirSaving = true;
                const $this = this;
                let editDirForm = this.editDirForm;
                let parentPath = editDirForm.parentPath;
                let name = editDirForm.name;
                if (parentPath.endsWith("/")) {
                    parentPath = parentPath.substring(0, parentPath.length - 1);
                }
                if (name.startsWith("/")) {
                    name = name.substring(1);
                }
                let path = parentPath + '/' + name;
                if (path !== '/' && path.endsWith('/')) {
                    path = path.substring(0, path.length - 1);
                }
                editDirForm.path = path;
                if (this.editDirForm.id) {
                    this.$http.get(`/member/dir/${this.currentBucket}/findByPath`, {
                        params: {
                            path: path
                        }
                    }).then(response => {
                        let desDir = response.data.result;
                        let isExists = !!desDir;
                        if (isExists) {
                            let srcDir = this.data.filter(value => value.isDir && value.id === $this.editDirForm.id)[0];
                            let srcPath = srcDir.path;
                            this.$confirm({
                                title: '合并确认',
                                content: '文件夹' + path + '已存在，是否将' + srcPath + '合并到' + path + '，同名文件将进行覆盖?',
                                okText: '确认',
                                cancelText: '取消',
                                onOk() {
                                    $this.$http.put(`/member/dir/${$this.currentBucket}/merge/${srcDir.id}/to/${desDir.id}`).then(res => {
                                        $this.$message.success('合并成功');
                                        $this.currentDir = desDir;
                                        $this.editDirVisible = false;
                                        $this.editDirSaving = false;
                                        $this.reload();
                                    }, reason => {
                                        $this.editDirSaving = false;
                                    })
                                },
                                onCancel() {
                                    $this.editDirSaving = false;
                                }
                            });
                        } else {
                            this.$http.put(`/member/dir/${this.currentBucket}/${this.editDirForm.id}`, this.editDirForm).then(response => {
                                this.$message.success("修改成功");
                                this.editDirSaving = false;
                                this.editDirVisible = false;
                                this.reload();
                            }, reason => {
                                $this.editDirSaving = false;
                            });
                        }
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
                let path = this.currentDir.path;
                if (this.searchLocation === 'all') {
                    path = '';
                } else if (path === '') {
                    path = '/';
                }
                this.fetch({
                    pageNum: 1,
                    pageSize: this.pagination.pageSize,
                    path: path,
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
                    resourceId: null,
                    dirId: null,
                    expireSeconds: 3600,
                    expireNumber: 1,
                    expireUnit: 'hour',
                    bucketName: this.currentBucket
                }
                if (record.isDir) {
                    this.addrForm.dirId = record.id;
                } else {
                    this.addrForm.resourceId = record.id;
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
            onBack() {
                history.back();
            },
            changeCurrentPath(dir, extendParams, ignoreHistory) {
                this.onRecentClick(dir);
                this.keyWord = extendParams ? extendParams.keyWord : '';
                this.searchLocation = dir.path === "" ? 'all' : 'curr';
                ignoreHistory = ignoreHistory === undefined ? false : ignoreHistory;
                let params = {
                    pageNum: 1,
                    pageSize: this.pagination.pageSize,
                    path: dir ? dir.path : '/',
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder,
                    ignoreHistory: ignoreHistory,
                };
                extendParams = extendParams || {}
                $.extend(params, extendParams, {
                    path: dir ? dir.path : '/'
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
            getSelectRecords() {
                const rows = this.data;
                const selectedRowKeys = this.selectedRowKeys;
                return selectedRowKeys.map(value => {
                    for (let row of rows) {
                        const key = (row.isDir ? 'dir-' : 'resource-') + row.id;
                        if (key === value) {
                            return row;
                        }
                    }
                }).filter(value => value);
            },
            onBatchDelete() {
                let dirIds = [];
                let fileIds = [];
                const selectedRows = this.getSelectRecords();
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
                this.reload(false);
            },
            reload(ignoreHistory = true) {
                let pagination = this.pagination;
                this.fetch({
                    pageNum: pagination.current,
                    pageSize: pagination.pageSize,
                    path: this.currentDir.path,
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder,
                    ignoreHistory: ignoreHistory
                });
            },
            fetch(params = {
                pageNum: 1,
                pageSize: 10,
                path: this.currentDir.path,
                keyWord: this.keyWord,
                sortField: null,
                sortOrder: null
            }, callback) {
                this.tableLoading = true;
                this.$http.get(`/member/resource/${this.currentBucket}/list`, {
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
                        let pageSize = result.resources.pageSize;
                        if (pageSize > 0) {
                            pagination.pageSize = pageSize;
                        }
                    } else {
                        this.data = [];
                        pagination.total = 0;
                    }
                    this.pagination = pagination;
                    if (!params.ignoreHistory) {
                        resource.addHistory({
                            path: params.path
                        });
                    }
                    this.showDetailPath = params.path === '';
                    if (callback) {
                        callback();
                    }
                }, reason => {
                    this.tableLoading = false;
                });
            },
            getReadableSize(sizeByte) {
                let size;
                let unit;
                sizeByte = sizeByte * 1.0;
                if (sizeByte < 0) {
                    return null;
                } else if (sizeByte <= 1024) {
                    size = sizeByte;
                    unit = "B";
                } else if (sizeByte <= 1024 * 1024) {
                    size = sizeByte / 1024;
                    unit = "KB";
                } else if (sizeByte <= 1024 * 1024 * 1024) {
                    size = sizeByte / (1024 * 1024);
                    unit = "MB";
                } else {
                    size = sizeByte / (1024 * 1024 * 1024);
                    unit = "GB";
                }
                return sizeByte.toFixed(3) + unit;
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
            },
            onUpload() {
                this.$refs.upload.onUpload();
            }
        },
    };
</script>
<style scoped type="less">
	@import "resource.less";
</style>