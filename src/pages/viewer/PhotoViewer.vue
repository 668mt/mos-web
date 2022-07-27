<template>
	<div>
		<div>
			<!-- 返回 -->
			<a class="dir-nav" @click="onBack">
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
				   @click.once="changeCurrentPath(dir.path)">{{dir.path}}</a>
			</span>
			<!-- 当前路径 -->
			<span class="current" style="margin-left:10px;">
				{{currentPath}}
			</span>
		</div>
		
		<div v-if="result">
			<a-row type="flex">
				<a-col flex="200px" v-for="item of dirs" :key="item.id">
					<IconFont type="icon-weibiaoti-_huabanfuben"/>
					<a @click="changeCurrentPath(item)">{{item.fileName}}</a>
				</a-col>
			</a-row>
			<a-row type="flex">
				<a-col flex="200px" v-for="record of files" :key="record.id">
					<Thumb style="width: 200px;height:200px;"
						   :src="`/mos/${bucket}${record.urlEncodePath}?thumb=true`"/>
				</a-col>
			</a-row>
		</div>
	</div>
</template>

<script>
    import IconFont from "../resource/components/IconFont";
    import Thumb from "../resource/components/Thumb";

    export default {
        name: "PhotoViewer",
        components: {Thumb, IconFont},
        data() {
            return {
                currentPath: undefined,
                bucket: undefined,
                loading: false,
                result: undefined,
                pageNum: 1,
                pageSize: 20,
                parentDirs: []
            }
        },
        mounted() {
            let query = this.$route.query;
            if (query) {
                this.currentPath = query.path;
                this.bucket = query.bucket;
                this.fetch();
            }
        },
        computed: {
            dirs() {
                if (this.result && this.result.resources) {
                    return this.result.resources.list.filter(item => item.isDir);
                }
                return [];
            },
            files() {
                if (this.result && this.result.resources) {
                    return this.result.resources.list.filter(item => !item.isDir);
                }
                return [];
            }
        },
        methods: {
            onBack() {
                history.back();
            },
            reload() {

            },
            changeCurrentPath(path) {
                this.currentPath = path;
                this.fetch();
            },
            fetch(params = {
                pageNum: 1,
                pageSize: this.pageSize,
                path: this.currentPath,
                sortField: null,
                sortOrder: null
            }, callback) {
                this.loading = true;
                this.$http.get(`/member/resource/${this.bucket}/list`, {
                    params: params
                }).then(value => {
                    this.loading = false;
                    let result = value.data.result;
                    this.result = result;
                    // history.pushState(params, null, params.url);
                    console.log(result);
                });
            }
        }
    }
</script>

<style scoped>

</style>