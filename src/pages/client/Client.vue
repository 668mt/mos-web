<template>
	<a-card>
		<div style="margin-bottom:10px;">
			<a-button type="primary" @click="reload">刷新</a-button>
		</div>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :rowKey="(row,index) => {return index}"
				 :scroll="{ x: 1500 }"
				 :loading="tableLoading"
				 @change="handleTableChange">
			<span slot="keepSpaceByte" slot-scope="text">
				{{(text * 1.0/(1024 * 1024 * 1024)).toFixed(1)}}
			</span>
			<span slot="totalStorageGb" slot-scope="text">
				{{(text * 1.0).toFixed(1)}}
			</span>
			<span slot="usedStorageGb" slot-scope="text">
				{{(text * 1.0).toFixed(1)}}
			</span>
			<span slot="usedPercent" slot-scope="text">
				{{(text * 100).toFixed(1) + '%'}}
			</span>
			<span slot="status" slot-scope="text">
				<a-tag v-if="text === 'UP'" color="#87d068">{{text}}</a-tag>
				<a-tag v-if="text === 'KICKED'" color="orange">{{text}}</a-tag>
				<a-tag v-if="text === 'DOWN'" color="#f50">{{text}}</a-tag>
			</span>
			<span slot="action" slot-scope="text,record">
				<a-popconfirm
						title="是否恢复?"
						ok-text="是"
						cancel-text="否"
						@confirm="onRecover(record)"
				>
					<a>恢复</a>
				</a-popconfirm>
				<a-divider type="vertical"/>
				<a-popconfirm
						title="是否剔除?"
						ok-text="是"
						cancel-text="否"
						@confirm="onKick(record)"
				>
					<a style="color:red;">剔除</a>
				</a-popconfirm>
			</span>
		</a-table>
	</a-card>
</template>
<script>
    const columns = [
        {title: '客户端id', dataIndex: 'clientId', width: 240},
        {title: 'ip', dataIndex: 'ip', width: 120},
        {title: '端口', dataIndex: 'port', width: 80},
        {title: '权重', dataIndex: 'weight', width: 80},
        {title: '可用存储（GB）', dataIndex: 'totalStorageGb', width: 140, scopedSlots: {customRender: 'totalStorageGb'}},
        {title: '已用存储（GB）', dataIndex: 'usedStorageGb', width: 140, scopedSlots: {customRender: 'usedStorageGb'}},
        {title: '使用百分比', dataIndex: 'usedPercent', width: 110, scopedSlots: {customRender: 'usedPercent'}},
        {title: '状态', dataIndex: 'status', width: 80, scopedSlots: {customRender: 'status'}},
        {title: '上次心跳时间', dataIndex: 'lastBeatTime', width: 160},
        {title: '保留大小（GB）', dataIndex: 'keepSpaceByte', width: 140, scopedSlots: {customRender: 'keepSpaceByte'}},
        {title: '备注', dataIndex: 'remark', width: 100},
        {title: '创建时间', dataIndex: 'createdDate', width: 160},
        {title: '修改时间', dataIndex: 'updatedDate', width: 160},
        {title: '操作', scopedSlots: {customRender: 'action'}, fixed: 'right',},
    ];

    export default {
        data() {
            return {
                data: [],
                tableLoading: false,
                columns,
                pagination: {
                    pageSizeOptions: ['10', '20', '50', '100'],
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal(total, range) {
                        return '数据总数：' + total;
                    }
                },
            };
        },
        mounted() {
            this.fetch();
        },
        methods: {
            onKick(record) {
                this.$http.delete('/admin/client/kick/' + record.clientId).then(value => {
                    this.$message.success("剔除成功");
                    this.reload();
                })
            },
            onRecover(record) {
                this.$http.put('/admin/client/recover/' + record.clientId).then(value => {
                    this.$message.success("恢复成功");
                    this.reload();
                });
            },
            reload() {
                this.fetch();
            },
            handleTableChange(pagination, filters, sorter) {
                const pager = {...this.pagination};
                pager.current = pagination.current;
                this.pagination = pager;
                this.fetch({
                    pageSize: pagination.pageSize,
                    pageNum: pagination.current,
                    sortField: sorter.field,
                    sortOrder: sorter.order,
                    ...filters,
                });
            },
            fetch(params = {pageNum: 1, pageSize: 10}) {
                this.tableLoading = true;
                this.$http.get("/admin/client/list", {
                    params: params
                }).then(response => {
                    this.tableLoading = false;
                    const pageBean = response.data.result;
                    const pagination = {...this.pagination};
                    pagination.total = pageBean.total;
                    pagination.pageSize = pageBean.pageSize;
                    this.data = pageBean.list;
                    this.pagination = pagination;
                }, reason => {
                    this.tableLoading = false;
                });
            },
        },
    };
</script>
<style scoped>

</style>