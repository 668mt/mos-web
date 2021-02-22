<template>
	<a-card>
		<SearchForm @handleSearch="handleSearch">
			<a-row>
				<a-button type="primary" @click="onAdd">添加</a-button>
			</a-row>
			<a-table :columns="columns" :data-source="data" :pagination="pagination"
					 :rowKey="(row,index) => {return index}"
					 @change="handleTableChange">
				<span slot="isEnable" slot-scope="text" :style="!text ? {color:'red'} : ''">
					{{text?'启用':'禁用'}}
				</span>
				<span slot="locked" slot-scope="text" :style="text ? {color:'red'} : ''">
					{{text?'是':'否'}}
				</span>
				<span slot="isAdmin" slot-scope="text" :style="text ? {color:'red'} : ''">
					{{text?'是':'否'}}
				</span>
				<span slot="action" slot-scope="text,record">
					<a @click="onEdit(record)">编辑</a>
					<a-divider type="vertical"/>
					<a-popconfirm
							title="是否解锁?"
							ok-text="是"
							cancel-text="否"
							@confirm="unlock(record)"
					>
						<a>解锁</a>
					</a-popconfirm>
					<a-divider type="vertical"/>
					<a-popconfirm
							title="是否删除?"
							ok-text="是"
							cancel-text="否"
							@confirm="onDelete(record.id)"
					>
						<a style="color:red;">删除</a>
					</a-popconfirm>
				</span>
			</a-table>
		</SearchForm>
		<div>
			<a-modal v-model="visible" title="用户详情" @ok="handleOk" cancelText="取消" okText="保存">
				<a-form-model
						:rules="rules"
						ref="ruleForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="form">
					<a-form-model-item label="姓名" prop="name">
						<a-input v-model="form.name"/>
					</a-form-model-item>
					<a-form-model-item label="用户名" prop="username">
						<a-input v-model="form.username"/>
					</a-form-model-item>
					<a-form-model-item label="密码" prop="password">
						<a-input type="password" v-model="form.password" placeholder="不填写表示不修改"/>
					</a-form-model-item>
					<a-form-model-item label="确认密码" prop="confirm_password">
						<a-input type="password" v-model="form.confirm_password" placeholder="不填写表示不修改"/>
					</a-form-model-item>
					<a-form-model-item label="是否启用" prop="isEnable">
						<a-switch v-model="form.isEnable"/>
					</a-form-model-item>
					<a-form-model-item label="是否管理员" prop="isAdmin">
						<a-switch v-model="form.isAdmin"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
		</div>
	</a-card>
</template>
<script>
    import SearchForm from "./SearchForm";

    const columns = [
        {
            title: '姓名',
            dataIndex: 'name',
        },
        {
            title: '用户名',
            dataIndex: 'username',
        },
        {
            title: '是否管理员',
            dataIndex: 'isAdmin',
            scopedSlots: {customRender: 'isAdmin'},
        },
        {
            title: '是否启用',
            dataIndex: 'isEnable',
            scopedSlots: {customRender: 'isEnable'},
        },
        {
            title: '是否被锁定',
            dataIndex: 'locked',
            scopedSlots: {customRender: 'locked'},
        },
        {
            title: '上次登录时间',
            dataIndex: 'lastLoginDate',
        },
        {
            title: '登录次数',
            dataIndex: 'loginTimes',
        },
        {
            title: '创建时间',
            dataIndex: 'createdDate',
        },
        {
            title: '修改时间',
            dataIndex: 'updatedDate',
        },
        {
            title: '操作',
            scopedSlots: {customRender: 'action'},
        },
    ];

    export default {
        data() {
            return {
                fieldsEquals: (rule, value, callback) => {
                    if (!value || value.trim() === '') {
                        callback();
                    }
                    if (this.form[rule.equalTo] !== value) {
                        callback(new Error(rule.message));
                    } else {
                        this.$refs.ruleForm.validateField(rule.equalTo);
                        callback();
                    }
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
                    id: null,
                    username: '',
					name:'',
                    password: '',
                    confirm_password: '',
                    isEnable: true,
                    isAdmin: false
                },
                rules: {}
            };
        },
        mounted() {
            this.fetch();
        },
        methods: {
            unlock(record){
                this.$http.put('/admin/user/unlock/'+record.username).then(response => {
                    this.$message.success("解锁成功!");
                    this.fetch();
				});
			},
            handleSearch(values) {
                this.fetch({
                    pageSize: this.pagination.pageSize,
                    pageNum: 1,
                    ...values
                })
            },
            onAdd() {
                this.form = {
                    id: null,
                    username: '',
                    password: '',
                    confirm_password: '',
                    isEnable: true,
                    isAdmin: false
                };
                this.rules = {
                    username: [{required: true, message: '请输入用户名', trigger: 'blur'},],
                    name: [{required: true, message: '请输入姓名', trigger: 'blur'},],
                    password: [{required: true, message: '请输入密码', trigger: 'blur'}, {
                        validator: this.fieldsEquals,
                        equalTo: 'confirm_password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }],
                    confirm_password: [{required: true, message: '请确认密码', trigger: 'blur'}, {
                        validator: this.fieldsEquals,
                        equalTo: 'password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }]
                }
                this.showModal();
            },
            onEdit(record) {
                this.form = this.$mt.deepCopy(record);
                this.form.password = null;
                this.rules = {
                    username: [{required: true, message: '请输入用户名', trigger: 'blur'},],
                    name: [{required: true, message: '请输入姓名', trigger: 'blur'},],
                    password: [{
                        validator: this.fieldsEquals,
                        equalTo: 'confirm_password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }],
                    confirm_password: [{
                        validator: this.fieldsEquals,
                        equalTo: 'password',
                        message: '两次密码不相等',
                        trigger: 'change'
                    }]
                }
                this.showModal();
            },
            onDelete(id) {
                this.$http.delete('/admin/user/' + id).then(response => {
                    this.fetch();
                    this.$message.success("删除成功");
                });
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
                this.$http.get("/admin/user/page/list", {
                    params: params
                }).then(response => {
                    const pageBean = response.data.result;
                    const pagination = {...this.pagination};
                    pagination.total = pageBean.total;
                    pagination.pageSize = pageBean.pageSize;
                    this.data = pageBean.list;
                    this.pagination = pagination;
                })
            },
            showModal() {
                this.visible = true;
            },
            handleOk(e) {
                const data = this.$mt.deepClone(this.form);
                this.$refs.ruleForm.validate(valid => {
                    if (valid) {
                        if (!data.id) {
                            this.$http.post('/admin/user', data).then(response => {
                                this.$message.success('新增成功！');
                                this.visible = false;
                                this.fetch();
                            });
                        } else {
                            this.$http.put('/admin/user', data).then(response => {
                                this.$message.success('更新成功！');
                                this.visible = false;
                                this.fetch();
                            });
                        }
                    } else {
                        return false;
                    }
                });
            },
        },
        components: {
            SearchForm
        }
    };
</script>
<style scoped>

</style>