<template>
	<a-card>
		<SearchForm @handleSearch="handleSearch">
			<a-table :columns="columns" :data-source="data" :pagination="pagination"
					 :rowKey="(row,index) => {return index}"
					 @change="handleTableChange">
				<a slot="pathname" slot-scope="text" target="_blank" :href="baseUrl+'/mos'+text">{{ text }}</a>
				<span slot="action">
					<a>编辑</a>
					<a-divider type="vertical"/>
					<a>删除</a>
				</span>
			</a-table>
		</SearchForm>
	</a-card>
</template>
<script>
    const columns = [
        {
            title: '文件',
            dataIndex: 'pathname',
            key: 'pathname',
            scopedSlots: {customRender: 'pathname'},
        },
        {
            title: '大小',
            dataIndex: 'sizeByte',
            key: 'sizeByte',
        },
        {
            title: '操作',
            key: 'action',
            scopedSlots: {customRender: 'action'},
        },
    ];

    import SearchForm from "./SearchForm";

    export default {
        data() {
            return {
                data: [],
                baseUrl: '',
                columns,
                loading: false,
                pagination: {
                    pageSizeOptions: ['10', '20', '50', '100'],
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal(total, range) {
                        return '数据总数：' + total;
                    }
                }

            };
        },
        mounted() {
            this.fetch();
            this.baseUrl = this.$http.defaults.baseURL;
        },
        methods: {
            handleSearch(values){
                this.fetch({
                    pageSize: this.pagination.pageSize,
                    pageNum: 1,
					...values
				})
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
            fetch(params = {pageNum: 1, pageSize: this.pagination.pageSize}) {
                this.$http.get("/test/resources", {
                    params: {
                        ...params
                    }
                }).then(response => {
                    const pagination = {...this.pagination};
                    pagination.total = response.data.total;
                    pagination.pageSize = response.data.pageSize;
                    this.loading = false;
                    this.data = response.data.list;
                    this.pagination = pagination;
                })
            }
        },
        components: {
            SearchForm
        }
    };
</script>
<style scoped>

</style>