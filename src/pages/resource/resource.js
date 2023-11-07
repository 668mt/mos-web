import SparkMD5 from "spark-md5";
import $ from "jquery";
import Vue from 'vue'

let $that;

let methods = {
    setThat(that) {
        $that = that;
    },
    splitFile(file, minPartSize = 2 * 1024 * 1024, maxPartSize = 10 * 1024 * 1024, expectChunks = 100) {
        let totalSize = file.size;
        let partSize = Math.ceil(totalSize / expectChunks);
        if (partSize < minPartSize) {
            partSize = minPartSize;
        } else if (partSize > maxPartSize) {
            partSize = maxPartSize;
        }
        let chunks = Math.ceil(totalSize / partSize);
        if (chunks < 1) {
            chunks = 1;
        }
        let uploadParts = [];
        for (let i = 0; i < chunks; i++) {
            let uploadPart;
            if (i === (chunks - 1)) {
                uploadPart = file.slice(i * partSize, totalSize);
            } else {
                uploadPart = file.slice(i * partSize, (i + 1) * partSize);
            }
            uploadParts.push(uploadPart);
        }
        return {
            totalSize, chunks, partSize, uploadParts
        };
    },
    md5File(file, callback, chunkCallback) {
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunkSize = 2097152,                             // Read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();

        fileReader.onload = function (e) {
            spark.append(e.target.result);
            currentChunk++;
            if (chunkCallback != null) {
                chunkCallback(chunks, currentChunk);
            }
            if (currentChunk < chunks) {
                loadNext();
            } else {
                callback(spark.end());
            }
        };

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.');
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    },
    popHandler(e) {
        const params = e.state;
        if (params) {
            $that.changeCurrentPath({
                path: params.path ? params.path : '',
                urlEncodePath: params.urlEncodePath
            }, params, true)
        }
    },
    fetchBucket() {
        return Vue.prototype.$http.get("/member/bucket/list").then(response => {
            $that.buckets = response.data.result;
        })
    },
    getHistoryParams(extendParams) {
        extendParams = extendParams || {};
        const params = {
            pageNum: $that.pagination.current,
            pageSize: $that.pagination.pageSize,
            path: $that.currentDir.path,
            urlEncodePath: $that.currentDir.urlEncodePath,
            keyWord: $that.keyWord,
            sortField: $that.sortField,
            sortOrder: $that.sortOrder,
            currentBucket: $that.currentBucket,
            searchLocation: $that.searchLocation,
        }
        $.extend(params, extendParams);
        let url = "/resource?";
        for (let key in params) {
            const alias = $that.queryAlias[key];
            const value = params[key];
            if (value && alias) {
                url += alias + "=" + encodeURIComponent(value) + "&";
            }
        }
        url = url.substring(0, url.length - 1);
        params.url = url;
        return params;
    },
    addHistory(extendParams) {
        let params = this.getHistoryParams(extendParams);
        history.pushState(params, null, params.url);
    },
}

export default methods