<template>
	<div v-if="statistics.length > 0">
		<a-row style="margin-bottom:10px;">
			<a-col span="24">
				<a-card>
					<span style="font-size: 16px;">欢迎使用Mos对象存储系统！</span>
					<a-select v-model="currentBucketName" style="width:100px;float:right;">
						<a-select-option :key="statistic.bucket.id" v-for="statistic in statistics"
										 :value="statistic.bucket.bucketName">
							{{statistic.bucket.bucketName}}
						</a-select-option>
					</a-select>
				</a-card>
				<a-card :bordered="false" :body-style="{padding: '20px'}">
					<a-row :gutter="20">
						<a-col :xs="24" :sm="12" :md="6">
							<a-statistic title="今日读写请求"
										 :value="currentStatistic !=null ? currentStatistic.thisDayReadRequests : 0"
										 class="demo-class">
								<template #suffix>
									<span> / {{currentStatistic != null ? currentStatistic.thisDayWriteRequests : 0}}</span>
								</template>
							</a-statistic>
							<a-statistic title="今日读写流量"
										 :value="currentStatistic !=null ? currentStatistic.readableThisDayRead : 0"
										 class="demo-class">
								<template #suffix>
									<span> / {{currentStatistic != null ? currentStatistic.readableThisDayWrite : 0}}</span>
								</template>
							</a-statistic>
						</a-col>
						<a-col :xs="24" :sm="12" :md="6">
							<a-statistic title="今月读写请求"
										 :value="currentStatistic !=null ? currentStatistic.thisMonthReadRequests : 0"
										 class="demo-class">
								<template #suffix>
									<span> / {{currentStatistic != null ? currentStatistic.thisMonthWriteRequests : 0}}</span>
								</template>
							</a-statistic>
							<a-statistic title="今月读写流量"
										 :value="currentStatistic !=null ? currentStatistic.readableThisMonthRead : 0"
										 class="demo-class">
								<template #suffix>
									<span> / {{currentStatistic != null ? currentStatistic.readableThisMonthWrite : 0}}</span>
								</template>
							</a-statistic>
						</a-col>
					</a-row>
				</a-card>
			</a-col>
		</a-row>
		<a-row type="flex" justify="space-around" align="middle" :gutter="16">
			<a-col :xs="24" :sm="24" :md="12">
				<a-card ref="request24Hours" id="request24Hours" class="chart" style="margin-bottom: 10px"></a-card>
				<a-card ref="flow24Hours" id="flow24Hours" class="chart"></a-card>
			</a-col>
			<a-col :xs="24" :sm="24" :md="12">
				<a-card ref="request30Days" id="request30Days" class="chart" style="margin-bottom: 10px"></a-card>
				<a-card ref="flow30Days" id="flow30Days" class="chart"></a-card>
			</a-col>
		</a-row>
	</div>
	<div v-else>
		<a-card v-if="loaded">
			您还没有创建桶，先去创建一个吧！
		</a-card>
	</div>
</template>

<script>
    var echarts = require('echarts');
    let refresh = false;
    export default {
        data() {
            return {
                buckets: [],
                loading: false,
                statistics: [],
                charts: {
                    request24Hours: null,
                    flow24Hours: null,
                    request30Days: null,
                    flow30Days: null,
                },
                currentBucketName: null,
                currentStatistic: {},
                loaded: false
            }
        },
        mounted() {
            let $this = this;
            refresh = true;
            $this.fetchStatistics();
        },
        watch: {
            currentBucketName() {
                this.statistics.filter(value => {
                    if (value.bucket.bucketName === this.currentBucketName) {
                        this.currentStatistic = value;
                    }
                });
                let $this = this;
                if (refresh) {
                    refresh = false;
                    setTimeout(function () {
                        $this.createChart($this.currentBucketName);
                    }, 1500);
                } else {
                    $this.createChart($this.currentBucketName);
                }
            }
        },
        methods: {
            format(date, fmt) {
                var o = {
                    "M+": date.getMonth() + 1,                 //月份
                    "d+": date.getDate(),                    //日
                    "H+": date.getHours(),                   //小时
                    "m+": date.getMinutes(),                 //分
                    "s+": date.getSeconds(),                 //秒
                    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                    "S": date.getMilliseconds()             //毫秒
                };
                if (/(y+)/.test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
                }
                for (var k in o) {
                    if (new RegExp("(" + k + ")").test(fmt)) {
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                    }
                }
                return fmt;
            },
            getRecentDay() {
                let date = new Date();
                date.setDate(date.getDate() - 1);
                return this.format(date, 'yyyy-MM-dd HH:mm');
            },
            // getRecentYear() {
            //     let date = new Date();
            //     date.setFullYear(date.getFullYear() - 1);
            //     return this.format(date, 'yyyy-MM-dd HH:mm');
            // },
            getRecent30Days() {
                let date = new Date();
                date.setDate(date.getDate() - 30);
                return this.format(date, 'yyyy-MM-dd HH:mm');
            },
            createChart(bucketName) {
                if (!this.charts.request30Days) {
                    this.charts.request30Days = echarts.init(document.getElementById('request30Days'));
                    this.charts.request24Hours = echarts.init(document.getElementById('request24Hours'));
                    this.charts.flow30Days = echarts.init(document.getElementById('flow30Days'));
                    this.charts.flow24Hours = echarts.init(document.getElementById('flow24Hours'));
                }
                this.updateChart('request', this.charts.request24Hours, '最近24小时内的请求', bucketName, 'hour', this.getRecentDay())
                this.updateChart('flow', this.charts.flow24Hours, '最近24小时内的流量', bucketName, 'hour', this.getRecentDay())
                this.updateChart('request', this.charts.request30Days, '最近30天内的请求', bucketName, 'day', this.getRecent30Days())
                this.updateChart('flow', this.charts.flow30Days, '最近30天内的流量', bucketName, 'day', this.getRecent30Days())
            },
            updateChart(busy, chart, title, bucketName, by, startDate) {
                let isFlow = busy === 'flow';
                this.$http.get(`/member/audit/chart/${busy}/${bucketName}/by/${by}`, {
                    params: {
                        startDate
                    }
                }).then(response => {
                    const data = response.data.result;
                    let times = [];
                    let read = [];
                    let write = [];
                    data.forEach(r => {
                        times.push(r.time);
                        if (isFlow) {
                            read.push(r.readMb);
                            write.push(r.writeMb);
                        } else {
                            read.push(r.readRequests);
                            write.push(r.writeRequests);
                        }
                    });
                    chart.setOption({
                        title: {
                            text: title
                        },
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {
                                type: 'cross',
                                label: {
                                    backgroundColor: '#6a7985'
                                }
                            }
                        },
                        legend: {
                            data: isFlow ? ['读流量', '写流量'] : ['读请求', '写请求']
                        },
                        xAxis: {
                            data: times
                        },
                        yAxis: {
                            name: isFlow ? '单位：MB' : '请求数',
                        },
                        series: [{
                            name: isFlow ? '读流量' : '读请求',
                            type: 'line',
                            smooth: true,
                            itemStyle: {},
                            areaStyle: {},
                            data: read
                        }, {
                            name: isFlow ? '写流量' : '写请求',
                            type: 'line',
                            smooth: true,
                            itemStyle: {
                                color: 'rgb(255, 70, 131)'
                            },
                            areaStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                    offset: 0,
                                    color: 'rgb(255, 158, 68)'
                                }, {
                                    offset: 1,
                                    color: 'rgb(255, 70, 131)'
                                }])
                            },
                            data: write
                        }]
                    });
                });
            },
            fetchStatistics() {
                this.loading = true;
                this.$http.get('/member/audit/statistic/info').then(response => {
                    this.statistics = response.data.result;
                    this.loading = false;
                    if (this.statistics.length > 0) {
                        this.currentBucketName = this.statistics[0].bucket.bucketName;
                    } else {
                        this.statistics = [];
                    }
                    this.loaded = true;
                }, reason => {
                    this.loading = false;
                });
            }
        }
    }
</script>

<style scoped>
	.chart {
		/*width: 600px;*/
		width: 100%;
		height: 400px;
	}
</style>