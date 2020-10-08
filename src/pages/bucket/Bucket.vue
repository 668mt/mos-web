<template>
	<a-card>
		<a-row>
			<a-button type="primary" @click="onAdd">添加</a-button>
		</a-row>
		<a-table :columns="columns" :data-source="data" :pagination="pagination"
				 :rowKey="(row,index) => {return row.id}"
				 :expandedRowKeys="expandedRowKeys"
				 @expand="expand"
				 @change="handleTableChange">
			<span slot="owner" slot-scope="text,record">
				<a-tag v-if="record.isOwn" color="#108ee9">{{text}}</a-tag>
				<a-tag v-else color="#87d068">{{text}}</a-tag>
			</span>
			<span slot="action" slot-scope="text,record">
				<a @click="onEdit(record)">编辑</a>
				<span v-if="record.isOwn">
				<a-divider type="vertical"/>
				<a @click="onGrant(record)">授权</a>
				</span>
				<a-divider type="vertical"/>
					<a style="color:red" @click="onGenerate(record)">新增秘钥</a>
				<a-divider type="vertical"/>
				<a-popconfirm
						v-if="record.isOwn"
						title="是否删除?"
						ok-text="是"
						cancel-text="否"
						@confirm="onDelete(record.id)"
				>
					<a style="color:red;">删除</a>
				</a-popconfirm>
			</span>
			<a-table
					slot="expandedRowRender"
					:rowKey="(row,index) => {return row.openId}"
					:columns="innerColumns"
					:data-source="innerData"
					:pagination="false">
				<a-tooltip slot="publicKey" slot-scope="text">
					<template slot="title">
						{{text}}
					</template>
					<div style="width:200px;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;">{{text}}
					</div>
				</a-tooltip>
				<a-tooltip slot="privateKey" slot-scope="text">
					<template slot="title">
						{{text}}
					</template>
					<div style="width:200px;overflow: hidden;text-overflow:ellipsis;white-space: nowrap;">{{text}}
					</div>
				</a-tooltip>
				<span slot="action" slot-scope="text,record">
					<a @click="onUpdateAccess(record)" style="margin-right:10px;">编辑</a>
					<a-popconfirm
							title="是否删除?"
							ok-text="是"
							cancel-text="否"
							@confirm="onDeleteOpenId(record)"
					>
						<a style="color:red;">删除</a>
					</a-popconfirm>
				</span>
			</a-table>
			<!--			</template>-->
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
			<a-modal v-model="accessVisible" title="秘钥详情" @ok="accessHandleOk">
				<a-form-model
						ref="accessForm"
						:label-col="{span:6}"
						:wrapper-col="{span:12}"
						:model="accessForm">
					<a-form-model-item label="用途" prop="useInfo">
						<a-input v-model="accessForm.useInfo"/>
					</a-form-model-item>
				</a-form-model>
			</a-modal>
			<a-modal v-model="grantVisible" title="授权" @ok="grantOk" width="700px">
				<a-transfer
						:data-source="userData"
						show-search
						@change="handleGrantChange"
						:list-style="{width: '250px',height: '300px',}"
						:operations="['添加授权', '删除授权']"
						:target-keys="grantUserKeys"
						:render="item => `${item.username}`"
				>
					<span slot="notFoundContent">
					  没数据
					</span>
				</a-transfer>
			</a-modal>
		</div>
	</a-card>
	
</template>
<script>
    const columns = [
        {
            title: '所有者',
            dataIndex: 'owner',
            scopedSlots: {customRender: 'owner'},
        },
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
    const innerColumns = [
        {
            title: 'openId',
            dataIndex: 'openId'
        }, {
            title: '用途',
            dataIndex: 'useInfo'
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
        }, {
            title: '操作',
            scopedSlots: {customRender: 'action'},
        }
    ];
    export default {
        data() {
            return {
                data: [],
                columns,
                innerColumns,
                innerData: [],
                innerDatas: [],
                expandedRowKeys: [],
                expandedRow: {},
                pagination: false,
                visible: false,
                accessVisible: false,
                form: {
                    id: null,
                    bucketName: ''
                },
                accessForm: {
                    openId: null,
                    bucketName: null,
                    publicKey: null,
                    privateKey: null,
                    useInfo: '',
                },
                rules: {
                    bucketName: [
                        {required: true, message: '请输入bucketName', trigger: 'blur'},
                    ],
                },
                grantVisible:false,
                userData:[],
                grantUserKeys:[],
                targetKeys:[],
                currentGrantBucketId:null,
            };
        },
        mounted() {
            this.fetch();
        },
        methods: {
            onGenerate(record) {
                this.accessForm = {
                    openId: null,
                    bucketName: record.bucketName,
                    publicKey: null,
                    privateKey: null,
                    useInfo: '',
				}
                this.accessVisible = true;
            },
			onUpdateAccess(access){
                this.accessForm = {...access};
                this.accessVisible = true;
			},
            accessHandleOk() {
                let accessForm = this.accessForm;
                if (accessForm.openId) {
                    //修改
                    this.$http.put("/member/access/" + accessForm.bucketName+'/'+accessForm.openId, accessForm).then(value => {
                        this.fetchExpandedRow();
                        this.accessVisible = false;
                        this.$message.success("修改成功");
                    });
                } else {
                    //新增
                    this.$http.post("/member/access/" + accessForm.bucketName, accessForm).then(value => {
                        this.fetchExpandedRow();
                        this.accessVisible = false;
                        this.$message.success("新增成功");
                    });
                }
            },
            expand(expanded, record) {
                if (expanded) {
                    this.expandedRowKeys = [record.id];
                    this.expandedRow = record;
                    this.innerData = [];
                    this.fetchExpandedRow();
                } else {
                    this.expandedRowKeys = [];
                }
            },
            fetchExpandedRow() {
                this.$http.get("/member/access/" + this.expandedRow.bucketName).then(value => {
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
            onDeleteOpenId(access) {
                this.$http.delete(`/member/access/${access.bucketName}/${access.openId}`).then(response => {
                    this.fetchExpandedRow();
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
			onGrant(record){
                this.grantVisible = true;
                this.$http.get('/member/bucket/grant/list',{
                    params:{
                        bucketId:record.id
					}
				}).then(response => {
                    this.userData = response.data.result.allUsers;
                    this.grantUserKeys = response.data.result.userKeys;
				});
                this.currentGrantBucketId = record.id;
			},
            handleGrantChange(targetKeys, direction, moveKeys) {
                this.grantUserKeys = targetKeys;
            },
            grantOk(){
                this.$http.post('/member/bucket/grant',{
                    bucketId:this.currentGrantBucketId,
					userIds:this.grantUserKeys.map(value => parseFloat(value))
				}).then(response => {
				   this.$message.success("授权成功");
				   this.grantVisible = false;
				});
			}
        },
        components: {
            // BucketDrawer
        }
    };
</script>
<style scoped>

</style>