import SparkMD5 from "spark-md5";
import $ from "jquery";

let $that;

let methods = {
    setThat(that){
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
    getFileName(pathname) {
        let lastIndexOf = pathname.lastIndexOf('/');
        if (lastIndexOf !== -1) {
            return pathname.substring(lastIndexOf + 1)
        } else {
            return pathname;
        }
    },
    doUploadPart(waitingUpload, index, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, files, fileIndex, callback) {
        if (index >= waitingUpload.length) {
            callback();
            return;
        }
        let uploadPart = waitingUpload[index].uploadPart;
        let chunkIndex = waitingUpload[index].chunkIndex;
        this.md5File(uploadPart, chunkMd5 => {
            const formData = new FormData();
            formData.append("cover", cover);
            formData.append("contentType", contentType);
            formData.append("isPublic", isPublic);
            formData.append('file', uploadPart);
            formData.append('pathname', pathname);
            formData.append('totalMd5', totalMd5);
            formData.append('totalSize', totalSize);
            formData.append('chunkMd5', chunkMd5);
            formData.append('chunkSize', uploadPart.size);
            formData.append('chunkIndex', chunkIndex);
            let fileName = this.getFileName(pathname);
            $that.$http.post('/upload/' + bucketName, formData).then(response => {
                console.log('分片' + chunkIndex + '上传结果:' + response.data.status);
                this.updateUploadProgress(false, fileName, files, fileIndex + 1, 1, 1, chunks, chunkIndex + 1);
                index++;
                this.doUploadPart(waitingUpload, index, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, files, fileIndex, callback);
            },reason => {
                $that.uploading = false;
                $that.uploadProgress.errorMsg = reason;
                console.log(pathname + '上传失败：', reason);
            })
        });
    },
    updateUploadProgress(done, current, files, fileIndex, checks, checkIndex, chunks, chunkIndex) {
        let uploadPercent = done ? 100 : 5 * checkIndex / checks + chunkIndex / chunks * 94;
        uploadPercent = Math.floor(uploadPercent);
        $that.uploadProgress = {
            current, files, fileIndex, uploadPercent
        };
    },
    uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback) {
        if (index >= fileList.length) {
            callback();
            return;
        }
        let file = fileList[index];
        const pathname = pathnames[index];
        let splitResult = this.splitFile(file);
        let chunks = splitResult.chunks;
        const totalSize = splitResult.totalSize;
        const uploadParts = splitResult.uploadParts;
        $that.uploading = true;
        const fileName = this.getFileName(pathname);
        $that.uploadProgress.current = fileName;
        console.log(splitResult)
        this.md5File(file, totalMd5 => {
            let params = {
                pathname, chunks, totalMd5, totalSize, contentType, isPublic, cover
            };
            $that.$http.post(`/upload/${bucketName}/init`, $that.$mt.transformFormData(params)).then(response => {
                let result = response.data.result;
                let fileExists = result.fileExists;
                let existedChunkIndexs = result.existedChunkIndexs;
                if (!fileExists) {
                    const waitingUpload = [];
                    uploadParts.forEach((uploadPart, chunkIndex) => {
                        if ($that.$mt.contains(existedChunkIndexs, chunkIndex)) {
                            return;
                        }
                        waitingUpload.push({
                            uploadPart, chunkIndex
                        });
                    });
                    this.doUploadPart(waitingUpload, 0, bucketName, cover, contentType, isPublic, pathname, totalMd5, totalSize, chunks, $that.fileList.length, index, () => {
                        const mergeFormData = new FormData();
                        mergeFormData.append("cover", cover);
                        mergeFormData.append("contentType", contentType);
                        mergeFormData.append("isPublic", isPublic);
                        mergeFormData.append('file', file);
                        mergeFormData.append('pathname', pathname);
                        mergeFormData.append('totalMd5', totalMd5);
                        mergeFormData.append('totalSize', totalSize);
                        mergeFormData.append('bucketName', bucketName);
                        $that.$http.post('/upload/mergeFiles?wait=true', mergeFormData)
                            .then(response => {
                                console.log(pathname + "上传完成！");
                                this.updateUploadProgress(true, fileName, $that.fileList.length, index + 1, 1, 1, 1, 1);
                                index++;
                                this.uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback);
                            }, reason => {
                                $that.uploading = false;
                                $that.uploadProgress.errorMsg = reason;
                                console.log(pathname + '上传失败：', reason);
                            });
                    });
                } else {
                    console.log(pathname + "上传完成！");
                    //秒传
                    this.updateUploadProgress(true, fileName, $that.fileList.length, index + 1, 1, 1, 1, 1);
                    index++;
                    this.uploadFile(fileList, index, bucketName, pathnames, cover, isPublic, contentType, callback);
                }
            }, reason => {
                $that.uploading = false;
                $that.uploadProgress.errorMsg = reason;
                console.log(pathname + '上传失败：', reason);
            });
        }, (checks, checkIndex) => {
            this.updateUploadProgress(false, fileName, fileList.length, index + 1, checks, checkIndex, 1, 0);
        });
    },
    initUploadProgress(){
        $that.uploadProgress = {
            files: $that.fileList.length,
            fileIndex: 1,
            current: '',
            uploadPercent: 0,
            errorMsg:null
        }
    },
    genAddr() {
        if (!$that.addrForm.openId) {
            $that.$message.warn("请先创建一个秘钥!")
            return;
        }
        $that.addrForm.signUrl = '';
        let body = {...$that.addrForm};
        let x = 1;
        let expireNumber = parseInt($that.addrForm.expireNumber);
        if (expireNumber < 1) {
            $that.$message.warn("时间不能小于1");
            return;
        }
        switch ($that.addrForm.expireUnit) {
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
        $that.$http.post('/member/access/sign', body).then(response => {
            $that.addrForm.signUrl = response.data.result;
        });
    },
    showImages(url, record) {
        if (record) {
            $that.onRecentClick(record);
        }
        for (let i = 0; i < $that.images.length; i++) {
            if ($that.images[i].indexOf(url) !== -1) {
                $that.$viewer.view(i);
            }
        }
    },
    popHandler(e) {
        const params = e.state;
        if (params && params.path) {
            $that.changeCurrentPath({
                path: params.path,
                urlEncodePath: params.urlEncodePath
            }, params, true)
        }
    },
    fetchBucket() {
        $that.$http.get("/member/bucket/list").then(response => {
            $that.buckets = response.data.result;
            $that.currentBucket = $that.buckets[0].bucketName;
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
            currentBucket: $that.currentBucket
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