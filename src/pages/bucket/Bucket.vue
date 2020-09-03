<template>
	<a-card>
		<a-row>
			<a-button type="primary" @click="onAdd">添加</a-button>
		</a-row>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :rowKey="(row,index) => {return index}"
				 @expand="expand"
				 @change="handleTableChange">
			<span slot="action" slot-scope="text,record">
				<a @click="onEdit(record)">编辑</a>
				<a-divider type="vertical"/>
				<a-popconfirm
						title="更新秘钥可能导致已有的服务不可用，是否更新秘钥?"
						ok-text="是"
						cancel-text="否"
						@confirm="onGenerate(record)"
				>
					<a style="color:red">更新秘钥</a>
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
			<a-table slot="expandedRowRender"
					 :rowKey="(row,index) => {return row.openId}"
					 :columns="innerColumns"
					 :data-source="innerData"
					 :pagination="false">
				<a-tooltip slot="publicKey" slot-scope="text">
					<template slot="title">
						{{text}}
					</template>
					<div style="width:200px;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;">{{text}}</div>
				</a-tooltip>
				<a-tooltip slot="privateKey" slot-scope="text">
					<template slot="title">
						{{text}}
					</template>
					<div style="width:200px;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;">{{text}}</div>
				</a-tooltip>
<!--				<a slot="action">删除</a>-->
			</a-table>
		</a-table>
		<div>
			<a-modal v-model="visible" title="bucket详情" @ok="handleOk">
				<a-form-model
						:rules="rules"
						ref="ruleForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="form">
					<a-form-model-item label="bucketName" prop="bucketName">
						<a-input v-model="form.bucketName"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
		</div>
	</a-card>
</template>
<script>
    const columns = [
        {
            title: '名称',
            dataIndex: 'bucketName',
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
    const innerColumns = [{
        title: 'openId',
        dataIndex: 'openId'
    }, {
        title: '公钥',
        dataIndex: 'publicKey',
        scopedSlots: {customRender: 'publicKey'},
        ellipsis: true
    }, {
        title: '私钥',
        dataIndex: 'privateKey',
        scopedSlots: {customRender: 'privateKey'},
        ellipsis: true
    }, {
        title: '创建时间',
        dataIndex: 'createdDate',
    }, {
        title: '修改时间',
        dataIndex: 'updatedDate',
    }];
    export default {
        data() {
            return {
                data: [],
                columns,
                innerColumns,
                innerData: [],
                pagination: false,
                visible: false,
                form: {
                    id: null,
                    bucketName: ''
                },
                rules: {
                    bucketName: [
                        {required: true, message: '请输入bucketName', trigger: 'blur'},
                    ],
                }
            };
        },
        mounted() {
            this.fetch();
        },
        methods: {
            onGenerate(record) {
                this.$http.post("/member/access/" + record.id).then(value => {
                    this.$message.success("更新秘钥成功");
                    this.fetch();
                });
            },
            expand(expanded, record) {
                this.$http.get("/member/access/" + record.id).then(value => {
                    this.innerData = value.data.result;
                });
            },
            onAdd() {
                this.form = {};
                this.showModal();
            },
            onEdit(record) {
                this.form = this.$mt.deepCopy(record);
                this.showModal();
            },
            onDelete(id) {
                this.$http.delete('/member/bucket?id=' + id).then(response => {
                    this.fetch();
                    this.$message.success("删除成功");
                });
            },
            handleTableChange(pagination, filters, sorter) {
                this.fetch();
            },
            fetch() {
                this.$http.get("/member/bucket/list").then(response => {
                    this.data = response.data.result;
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
                            this.$http.post('/member/bucket', data, {
                                transformRequest: this.$mt.transformFormData
                            }).then(response => {
                                this.$message.success('新增成功！');
                                this.visible = false;
                                this.fetch();
                            });
                        } else {
                            this.$http.put('/member/bucket', data, {
                                transformRequest: this.$mt.transformFormData
                            }).then(response => {
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
            // BucketDrawer
        }
    };
</script>
<style scoped>

</style>