<template>
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
</template>

<script>
    export default {
        name: "AddrModal",
        props: {
            buckets: Array,
            currentBucket: String,
            currentDir: Object
        },
        data() {
            return {
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
                openIds: []
            }
        },
        watch: {
            "addrForm.expireNumber"() {
                if (this.addrForm.expireNumber < 1) {
                    this.addrForm.expireNumber = 1;
                }
            },
        },
        methods: {
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
                        this.genAddr();
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
                this.genAddr();
            },
            genAddr() {
                if (!this.addrForm.openId) {
                    this.$message.warn("请先创建一个秘钥!")
                    return;
                }
                this.addrForm.signUrl = '';
                let body = {...this.addrForm};
                let x = 1;
                let expireNumber = parseInt(this.addrForm.expireNumber);
                if (expireNumber < 1) {
                    this.$message.warn("时间不能小于1");
                    return;
                }
                switch (this.addrForm.expireUnit) {
                    case "minute":
                        x = 60;
                        break;
                    case "hour":
                        x = 3600;
                        break;
                    case "day":
                        x = 3600 * 24;
                        break;
                    case "month":
                        x = 3600 * 24 * 30;
                        break;
                    case "year":
                        x = 3600 * 24 * 30 * 365;
                        break;
                    case "ever":
                        x = -1;
                        expireNumber = 1;
                        break;
                }
                body.expireSeconds = x * expireNumber;
                this.$http.post('/member/access/sign', body).then(response => {
                    this.addrForm.signUrl = response.data.result;
                });
            },
        }
    }
</script>

<style scoped>

</style>