<template>
	<a-modal v-model="editDirVisible" title="路径详情" :confirmLoading="editDirSaving" @ok="onEditDirOk"
			 okText="保存">
		<a-form-model
				ref="editDirForm"
				:label-col="{span:6}"
				:wrapper-col="{span:12}"
				:model="editDirForm">
			<a-form-model-item label="父路径" prop="parentPath">
				<a-input v-model="editDirForm.parentPath" @pressEnter="onEditDirOk"/>
			</a-form-model-item>
			<a-form-model-item label="名称" prop="name">
				<a-input ref="editDirName" v-model="editDirForm.name" @pressEnter="onEditDirOk"/>
			</a-form-model-item>
		</a-form-model>
	</a-modal>
</template>

<script>
    export default {
        name: "DirModal",
        props: {
            currentBucket: String,
            currentDir:Object
        },
        data() {
            return {
                editDirVisible: false,
                editDirForm: {
                    parentPath: '',
                    name: ''
                },
                record: undefined,
                editDirSaving: false,
            }
        },
        methods: {
            onAddDir() {
                this.onEditDir();
            },
            onEditDir(record) {
                this.record = record;
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
                    parentPath,
                    name,
                    id
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
                            path
                        }
                    }).then(response => {
                        let desDir = response.data.result;
                        let isExists = !!desDir;
                        if (isExists) {
                            let srcPath = this.record ? this.record.path : '';
                            this.$confirm({
                                title: '合并确认',
                                content: '文件夹' + path + '已存在，是否将' + srcPath + '合并到' + path + '，同名文件将进行覆盖?',
                                okText: '确认',
                                cancelText: '取消',
                                onOk() {
                                    $this.$http.put(`/member/dir/${$this.currentBucket}/merge/${$this.editDirForm.id}/to/${desDir.id}`).then(res => {
                                        $this.$message.success('合并成功');
                                        $this.editDirVisible = false;
                                        $this.editDirSaving = false;
                                        $this.$emit('ok');
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
                                this.$emit('ok');
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
                        this.$emit('ok');
                    }, reason => {
                        this.editDirSaving = false;
                    });
                }
            },
        }
    }
</script>

<style scoped>

</style>