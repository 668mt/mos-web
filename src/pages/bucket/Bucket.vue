<template>
    <a-card>
        <a-row>
            <a-button type="primary" @click="onAdd">添加</a-button>
        </a-row>
        <a-table :columns="columns" :data-source="data" :pagination="pagination"
                 :rowKey="(row,index) => {return row.id}"
                 :expandedRowKeys="expandedRowKeys"
                 @expand="expand"
                 :loading="loading"
                 @change="handleTableChange">
			<span slot="owner" slot-scope="text,record">
				<a-tag v-if="record.isOwn" color="#108ee9">{{text}}</a-tag>
				<a-tag v-else color="#87d068">{{text}}</a-tag>
			</span>
            <span slot="defaultIsPublic" slot-scope="text">
				<a-tag v-if="text" color="#f50">公开</a-tag>
				<a-tag v-else color="#87d068">私有</a-tag>
			</span>
            <span slot="action" slot-scope="text,record">
				<a @click="onEdit(record)">编辑</a>
				<a-divider type="vertical"/>
				<a style="color:red" @click="onGenerate(record)">新增秘钥</a>
				<span v-if="record.isOwn">
					<a-divider type="vertical"/>
					<a @click="onGrant(record)">授权</a>
				</span>
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
                <a-tooltip slot="secretKey" slot-scope="text">
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
                    <a-form-model-item label="桶名称" prop="bucketName">
                        <a-input v-model="form.bucketName"/>
                    </a-form-model-item>
                    <a-form-model-item label="数据分片" prop="dataFragmentsAmount">
                        <a-input-number style="width:100%;" v-model="form.dataFragmentsAmount"/>
                    </a-form-model-item>
                    <a-form-model-item label="默认权限" prop="defaultIsPublic">
                        <a-radio-group v-model="form.defaultIsPublic">
                            <a-radio :value="true">公开</a-radio>
                            <a-radio :value="false">私有</a-radio>
                        </a-radio-group>
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
            <a-modal v-model="grantVisible" title="授权" @ok="grantOk" width="1200px">
                <!--						show-search-->
                <!--						@change2="handleGrantChange"-->
                <a-transfer
                        show-search
                        :filterOption="filterOption"
                        :data-source="userData"
                        :list-style="{width: '500px'}"
                        :operations="['添加授权', '删除授权']"
                        :target-keys="grantUserKeys"
                        @change="handleGrantChange"
                >
                    <template
                            slot="children"
                            slot-scope="{props: { direction, filteredItems, selectedKeys, disabled: listDisabled },on: { itemSelectAll, itemSelect },}"
                    >
                        <a-table
                                :scroll="{x:450,y:400}"
                                :row-selection="getRowSelection({ disabled: listDisabled, selectedKeys, itemSelectAll, itemSelect })"
                                :columns="grantColumns"
                                :data-source="filteredItems"
                                :pagination="false"
                                size="small"
                                :style="{ pointerEvents: listDisabled ? 'none' : null ,'overflow-x':'auto',}"
                                :custom-row="
									({ key, disabled: itemDisabled }) => ({
									  on: {
										// click: () => {
										//   itemSelect(key, !selectedKeys.includes(key));
										// },
										click: (e) => {
										  onRowClick(e,key,selectedKeys,itemSelect);
										},
									  },
									})
								  "
                        >
                            <template slot="perms" slot-scope="text,record">
                                <a-select
                                        mode="multiple"
                                        :default-value="text ? text : []"
                                        style="width: 100%"
                                        placeholder="请选择权限"
                                        @change="handlePermChange($event,record)"
                                >
                                    <a-select-option v-for="item in allPerms" :key="item">
                                        {{item}}
                                    </a-select-option>
                                </a-select>
                            </template>
                        </a-table>
                    </template>
                    <!--					<span slot="notFoundContent">-->
                    <!--					  没数据-->
                    <!--					</span>-->
                </a-transfer>
            </a-modal>
        </div>
    </a-card>

</template>
<script>
    import $ from "jquery";
    import difference from 'lodash/difference';

    const columns = [
        {title: '所有者', dataIndex: 'owner', scopedSlots: {customRender: 'owner'},},
        {title: '名称', dataIndex: 'bucketName',},
        {title: '默认权限', dataIndex: 'defaultIsPublic', scopedSlots: {customRender: 'defaultIsPublic'},},
        {title: '分片数', dataIndex: 'dataFragmentsAmount',},
        {title: '创建时间', dataIndex: 'createdDate',},
        {title: '修改时间', dataIndex: 'updatedDate',},
        {title: '操作', scopedSlots: {customRender: 'action'},},
    ];
    const innerColumns = [
        {title: 'openId', dataIndex: 'openId'},
        {title: '用途', dataIndex: 'useInfo'},
        {title: '私钥', dataIndex: 'secretKey', scopedSlots: {customRender: 'secretKey'}, ellipsis: true},
        {title: '创建时间', dataIndex: 'createdDate',},
        {title: '修改时间', dataIndex: 'updatedDate',},
        {title: '操作', scopedSlots: {customRender: 'action'},}
    ];
    const grantColumns = [
        {title: '姓名', dataIndex: 'name', width: 80},
        {title: '账号', dataIndex: 'username', width: 80},
        {title: '权限', dataIndex: 'perms', width: 200, scopedSlots: {customRender: 'perms'}},
    ];

    export default {
        data() {
            return {
                data: [],
                columns,
                innerColumns,
                grantColumns,
                innerData: [],
                innerDatas: [],
                loading: false,
                expandedRowKeys: [],
                expandedRow: {},
                pagination: false,
                visible: false,
                accessVisible: false,
                form: {
                    id: null,
                    bucketName: '',
                    defaultIsPublic: false,
                    dataFragmentsAmount: 1
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
                        {required: true, message: '请输入桶名称', trigger: 'blur'},
                    ],
                },
                grantVisible: false,
                userData: [],
                grantUserKeys: [],
                targetKeys: [],
                currentGrantBucketId: null,
                allPerms: [],
            };
        },
        mounted() {
            this.fetch();
            this.$http.get('/member/bucket/grant/perms/all').then(value => {
                this.allPerms = value.data.result;
            });
        },
        methods: {
            filterOption(inputValue, option) {
                return (option.name && option.name.indexOf(inputValue) !== -1)
                    || (option.username && option.username.indexOf(inputValue) !== -1);
            },
            onRowClick(e, key, selectedKeys, itemSelect) {
                let length = $(e.target).parents('.ant-select').length;
                if (length > 0) {
                    return;
                }
                itemSelect(key, !selectedKeys.includes(key));
            },
            handlePermChange(e, record) {
                record.perms = e;
            },
            getRowSelection({disabled, selectedKeys, itemSelectAll, itemSelect}) {
                return {
                    getCheckboxProps: item => ({props: {disabled: disabled || item.disabled}}),
                    onSelectAll(selected, selectedRows) {
                        const treeSelectedKeys = selectedRows
                            .filter(item => !item.disabled)
                            .map(({key}) => key);
                        const diffKeys = selected ? difference(treeSelectedKeys, selectedKeys) : difference(selectedKeys, treeSelectedKeys);
                        itemSelectAll(diffKeys, selected);
                    },
                    onSelect({key}, selected) {
                        itemSelect(key, selected);
                    },
                    selectedRowKeys: selectedKeys,
                };
            },
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
            onUpdateAccess(access) {
                this.accessForm = {...access};
                this.accessVisible = true;
            },
            accessHandleOk() {
                let accessForm = this.accessForm;
                if (accessForm.openId) {
                    //修改
                    this.$http.put("/member/access/" + accessForm.bucketName + '/' + accessForm.openId, accessForm).then(value => {
                        this.fetchExpandedRow();
                        this.accessVisible = false;
                        this.$message.success("修改成功");
                        this.refreshPerm();
                    });
                } else {
                    //新增
                    this.$http.post("/member/access/" + accessForm.bucketName, accessForm).then(value => {
                        this.fetchExpandedRow();
                        this.accessVisible = false;
                        this.$message.success("新增成功");
                        this.refreshPerm();
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
                if (this.expandedRow && this.expandedRow.bucketName) {
                    this.$http.get("/member/access/" + this.expandedRow.bucketName).then(value => {
                        this.innerData = value.data.result;
                    });
                }
            },
            onAdd() {
                this.form = {
                    id: null,
                    bucketName: '',
                    defaultIsPublic: false,
                    dataFragmentsAmount: 1
                };
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
                this.loading = true;
                this.$http.get("/member/bucket/list").then(response => {
                    this.data = response.data.result;
                    this.loading = false;
                }, reason => this.loading = false);
            },
            showModal() {
                this.visible = true;
            },
            handleOk(e) {
                const data = this.$mt.deepClone(this.form);
                this.$refs.ruleForm.validate(valid => {
                    if (valid) {
                        if (!data.id) {
                            this.$http.post('/member/bucket', data).then(response => {
                                this.$message.success('新增成功！');
                                this.visible = false;
                                this.fetch();
                                this.refreshPerm();
                            });
                        } else {
                            this.$http.put('/member/bucket', data).then(response => {
                                this.$message.success('更新成功！');
                                this.visible = false;
                                this.fetch();
                                this.refreshPerm();
                            });
                        }
                    } else {
                        return false;
                    }
                });
            },
            onGrant(record) {
                this.grantVisible = true;
                this.userData = [];
                this.grantUserKeys = [];
                this.$http.get('/member/bucket/grant/list', {
                    params: {
                        bucketId: record.id
                    }
                }).then(response => {
                    this.userData = response.data.result.allUsers;
                    this.grantUserKeys = response.data.result.userKeys;
                });
                this.currentGrantBucketId = record.id;
                this.$nextTick().then(value => {
                    $(".ant-table-body").css("overflow", "auto");
                })
            },
            handleGrantChange(targetKeys, direction, moveKeys) {
                this.grantUserKeys = targetKeys;
            },
            hasGrant(user) {
                for (let key of this.grantUserKeys) {
                    if (key === user.key) {
                        return true;
                    }
                }
                return false;
            },
            grantOk() {
                let grants = this.userData.filter(value => {
                    return this.hasGrant(value);
                }).map(value => {
                    return {
                        userId: value.id,
                        perms: value.perms
                    };
                });
                let body = {
                    bucketId: this.currentGrantBucketId,
                    grants: grants
                }
                this.$http.post('/member/bucket/grant', body).then(response => {
                    this.$message.success("授权成功");
                    this.grantVisible = false;
                    this.refreshPerm();
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