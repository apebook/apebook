//遍历指定目录获取所有md文件信息
var Walk = require('walk');
var fs = require('fs');
var _ = require('./util');
//path 读取文件的路径
//repoDir 库目录路径
module.exports = function(path,repoDir){
    var data = {};
    return function(fn){
        var walker = Walk.walk(path, {
            filters: [".git"]
        });
        //读取文件
        walker.on('file',function(root, fileStats, next){
            //demo root= /Users/alibaba/dev/ju/demo/jujs/repo/minghe/blog/kissy
            //demo fileStats :
            //{ dev: 16777218,
            //    mode: 33188,
            //    nlink: 1,
            //    uid: 501,
            //    gid: 20,
            //    rdev: 0,
            //    blksize: 4096,
            //    ino: 20965529,
            //    size: 2799,
            //    blocks: 8,
            //    atime: Sun Sep 28 2014 11:53:25 GMT+0800 (CST),
            //    mtime: Sun Sep 28 2014 11:53:26 GMT+0800 (CST),
            //    ctime: Sun Sep 28 2014 11:53:26 GMT+0800 (CST),
            //    birthtime: Sun Sep 28 2014 11:53:25 GMT+0800 (CST),
            //    name: 'write-kissy-link-nodejs.md',
            //    type: 'file' }
            var name = fileStats.name;
            //是md文件
            if(/\.md$/.test(name)){
                path = path.replace(repoDir+'/','');
                var file = _.pick(fileStats,'size','atime','mtime','ctime','birthtime','name');
                //文件路径
                file.path = repoDir+'/' + file.name;
                fs.readFile(file.path);
                data[path] = file;
            }
            next();
        });
        walker.on("errors", function (root, nodeStatsArray, next) {
            next();
        });
        //读取md文件完成
        walker.on("end", function () {
            fn(null,data);
        });
    }
};