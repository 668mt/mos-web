<template>
    <a-card>
        <a-row style="margin-bottom:10px;">
            <div class="tool-btns">
                <a-button type="primary" @click="onUpload" :disabled="!this.canInsert()">
                    {{ upload.uploading ? '查看上传进度' : '上传' }}
                </a-button>
                <a-button type="primary" @click="onAddDir" :disabled="!this.canInsert()">
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
                <a-select v-model="currentBucket" style="width:150px;float: right;" @change="bucketChange">
                    <a-select-option v-for="bucket in buckets" :key="bucket.id" :value="bucket.bucketName">
                        {{ bucket.bucketName }}
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
            <!--			<a class="listType" style="margin-left: 10px;" @click="changeListType">-->
            <!--				<IconFont v-if="listType === 'list'" type="icon-liebiao"-->
            <!--						  mode="font-class"/>-->
            <!--				<IconFont v-else type="icon-xiaosuolvetu" mode="font-class"/>-->
            <!--			</a>-->
            <!-- 父路径 -->
            <span v-if="parentDirs.length > 0">
				<a style="margin-left:10px;" class="dir-nav" v-for="dir in parentDirs" :key="dir.path"
                   @click.once="changeCurrentPath(dir)">{{ dir.path }}</a>
			</span>
            <!-- 当前路径 -->
            <span class="current" style="margin-left:10px;">
				{{ currentDir.path }}
			</span>
        </div>
        <a-table :columns="columns" :data-source="dataSource" :pagination="pagination"
                 :row-selection="rowSelection"
                 :rowKey="(row) => {return (row.isDir?'dir-':'resource-')+row.id}"
                 :scroll="{ x: 1200 }"
                 :loading="tableLoading"
                 @change="handleTableChange">
			<span slot="name" slot-scope="text,record">
				<ListName :record="record" :current-bucket="currentBucket" :show-detail-path="showDetailPath"
                          :key="(record.isDir?'dir-':'resource-')+record.id"
                          :current-dir="currentDir"
                          :historyClicks="historyClicks"
                          :fileSuffix="fileSuffix"
                          :show-images="showImages"
                          :on-recent-click="onRecentClick"
                          :change-current-path="changeCurrentPath"
                />
			</span>
            <span slot="isPublic" slot-scope="text,record">
				<span v-if="!record.isDir">
					<a-tag v-if="text" color="#f50">公开</a-tag>
					<a-tag v-else color="#87d068">私有</a-tag>
				</span>
			</span>
            <span slot="visits" slot-scope="text,record">
				<span v-if="!record.isDir">
					{{ text }}
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
					<a :href="`/viewer/gallery?bucket=${currentBucket}&path=${record.urlEncodePath}`"
                       target="_blank">图集</a>
                    <!--					<a-divider type="vertical"/>-->
                    <!--					<a :href="`/viewer/photo?bucket=${currentBucket}&path=${record.path}`" target="_blank">相册</a>-->
				</span>
			</span>
        </a-table>
        <div>
            <Upload ref="upload" :buckets="buckets" :current-bucket="currentBucket" :current-dir="currentDir"
                    @ok="reload"/>
            <AddrModal ref="addrModal" :buckets="buckets" :current-bucket="currentBucket" :current-dir="currentDir"/>
            <ResourceModal ref="resourceModal" :buckets="buckets" :current-bucket="currentBucket"
                           :current-dir="currentDir" @ok="reload"/>
            <DirModal ref="dirModal" :current-bucket="currentBucket" :currentDir="currentDir" @ok="reload"/>
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
import $ from 'jquery'
import resource from './resource.js'
import Upload from './components/Upload'
import Copy from "./components/Copy";
import DirModal from "./components/DirModal";
import AddrModal from "./components/AddrModal";
import ResourceModal from "./components/ResourceModal";
import ListName from "./components/ListName";

const columns = [
    {title: '文件名', dataIndex: 'name', width: 300, scopedSlots: {customRender: 'name'}, sorter: true},
    {title: '文件大小', dataIndex: 'readableSize', width: 100, sorter: true},
    {title: '权限', dataIndex: 'isPublic', width: 80, scopedSlots: {customRender: 'isPublic'}, sorter: true},
    {title: '访问量', dataIndex: 'visits', width: 80, scopedSlots: {customRender: 'visits'}, sorter: true},
    {title: '修改时间', dataIndex: 'updatedDate', width: 150, sorter: true},
    {title: '修改人', dataIndex: 'updatedBy', width: 120, sorter: true},
    // {title: '响应头', dataIndex: 'contentType', width: 100},
    {title: '操作', fixed2: 'right', width: 250, scopedSlots: {customRender: 'action'}},
];

export default {
    components: {
        ListName,
        ResourceModal,
        AddrModal,
        DirModal,
        Copy,
        Upload
    },
    data() {
        return {
            listType: 'list',
            upload: {},
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
            dataSource: [],
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
            buckets: [],
            selectedRowKeys: [],
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
                                return this.dataSource[index].isDir;
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
                                return !this.dataSource[index].isDir;
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
        this.$nextTick(() => {
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
            this.dataSource = [];
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
        dataSource() {
            this.images = this.dataSource.filter(record => {
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
        bucketChange(bucket) {
            this.$store.commit('setting/setBucket', bucket);
        },
        // changeListType() {
        //     this.listType = this.listType === 'list' ? 'pics' : 'list';
        // },
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
        onAddDir() {
            this.$refs.dirModal.onAddDir();
        },
        onEditDir(record) {
            this.$refs.dirModal.onEditDir(record);
        },
        showImages(url, record) {
            if (record) {
                this.onRecentClick(record);
            }
            for (let i = 0; i < this.images.length; i++) {
                if (this.images[i].origin.indexOf(url) !== -1) {
                    this.$viewer.view(i);
                }
            }
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
            this.$refs.addrModal.openGenAddr(record);
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
            const rows = this.dataSource;
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
                    this.dataSource = [...result.resources.list];
                    pagination.total = result.resources.total;
                    let pageSize = result.resources.pageSize;
                    if (pageSize > 0) {
                        pagination.pageSize = pageSize;
                    }
                } else {
                    this.dataSource = [];
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
            this.$refs.resourceModal.onEditResource(record);
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