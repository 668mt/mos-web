<template>
	<a-card>
		<a-row style="margin-bottom:10px;">
			<div class="tool-btns">
				<a-button type="primary" @click="onBatchDelete"
						  :disabled="!this.canDelete() || this.selectedRowKeys.length === 0">
					彻底删除
				</a-button>
				<a-button type="primary" @click="onRecover"
						  :disabled="!this.canDelete() || this.selectedRowKeys.length === 0">
					还原
				</a-button>
				<a-input-search :placeholder="'关键字搜索'"
								style="margin-left:15px;width: 300px" v-model="keyWord"
								@search="onSearch()" @pressEnter="onSearch()">
				</a-input-search>
				<a-select v-model="currentBucket" style="width:150px;float: right;" @change="bucketChange">
					<a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
						{{bucket.bucketName}}
					</a-select-option>
				</a-select>
			</div>
		</a-row>
		<div style="margin:10px;">
			<a style="margin-left: 10px;" @click="reload">
				<a-icon type="sync"/>
			</a>
		</div>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :row-selection="rowSelection"
				 :rowKey="(row) => {return (row.isDir?'dir-':'resource-')+row.id}"
				 :scroll="{ x: 1500 }"
				 :loading="tableLoading"
				 @change="handleTableChange">
			<span slot="name" slot-scope="text,record">
				<span v-if="record.isDir">
					<!-- 文件夹 -->
					<icon-font class="resource-icon" type="icon-weibiaoti-_huabanfuben" style="font-size:18px;"/>
						{{record.path}}
				</span>
				<span v-else>
					<!-- 文件 -->
					<a-row>
						<a-col :span="record.thumbFileHouseId ? 8:2" align="center">
							<span v-if="record.thumbFileHouseId">
									<img style="max-width:100px;max-height:100px;" :title="record.fileName"
										 :src="`/mos/${currentBucket}${record.urlEncodePath}?thumb=true`"/>
							</span>
							<span v-else>
								<icon-font class="resource-icon" v-if="record.icon" :type="record.icon"
										   style="font-size:16px;"/>
								<icon-font class="resource-icon" v-else type="icon-wenjian" style="font-size:16px;"/>
							</span>
						</a-col>
						<a-col span="16">
								{{record.path}}
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
							title="是否彻底删除?"
							ok-text="是"
							cancel-text="否"
							@confirm="onDelete(record,record.isDir ? 'delDir' : 'delFile')"
					>
						<a style="color:red;">删除</a>
					</a-popconfirm>
				</span>
			</span>
		</a-table>
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
        {title: '访问量', dataIndex: 'visits', width: 100, scopedSlots: {customRender: 'visits'}, sorter: true},
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
                locations: {
                    lastLocation: [],
                    current: {}
                },
                searchLocation: 'all',
                pathnameCheckResults: [],
                currentBucket: null,
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
                rules: {
                    bucketName: [
                        {required: true, message: '请选择bucket', trigger: 'blur'},
                    ],
                },
                keyWord:'',
                buckets: [],
                selectedRowKeys: [],
                openIds: [],
                refreshed: true,
                tableLoading: false,
                showDetailPath: true,
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
                };
            },
        },
        mounted() {
            resource.setThat(this);
            resource.fetchBucket().then(res => {
                let bucket = this.$store.getters['setting/getBucket'];
                if (bucket) {
                    this.currentBucket = bucket;
                } else {
                    this.currentBucket = this.buckets[0].bucketName;
                }
            });
            $(".ant-table-body").css("overflow-x", "auto");

        },
        watch: {
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
        },
        methods: {
            bucketChange(bucket){
                this.$store.commit('setting/setBucket', bucket);
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
            onSearch() {
                this.fetch({
                    pageNum: 1,
                    pageSize: this.pagination.pageSize,
                    path: '',
                    keyWord: this.keyWord,
                    sortField: this.sortField,
                    sortOrder: this.sortOrder
                });
            },
            onSelectChange(selectedRowKeys, selectedRows) {
                this.selectedRowKeys = selectedRowKeys;
            },
            onDelete(record, type) {
                let params = {};
                if (type === 'delFile') {
                    params = {fileIds: record.id};
                } else {
                    params = {dirIds: record.id};
                }
                this.$http.delete(`/member/resource/${this.currentBucket}/realDel`, {
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
            onRecover() {
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
                    title: '确定还原这些资源吗?',
                    content: dirNames.join(","),
                    okText: '确定',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk() {
                        $this.$http.put(`/member/resource/${$this.currentBucket}/recover`, {
                            dirIds:dirIds,
							fileIds:fileIds
						}).then(response => {
                            $this.$message.success("还原成功");
                            $this.selectedRowKeys = [];
                            $this.reload();
                        });
                    },
                });
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
                        $this.$http.delete(`/member/resource/${$this.currentBucket}/realDel`, {
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
                params.isDelete = true;
                params.path = '';
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
                    this.showDetailPath = true;
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
        },
        components: {
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