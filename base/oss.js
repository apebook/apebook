//oss 存储服务
var oss = require('ali-oss');
var walk = require('co-walk');
var _ = require('lodash');
var path = require('path');
var store;
var conf;
var debug = require('debug')('ali-oss');
module.exports = {
    //连接 oss 的bucket
    connect: function(config){
        conf = config;
        store = oss(config);
    },
    //指定使用的桶
    useBucket: function(bucket){
        debug('use %s bucket',bucket);
        var region = conf.region;
        store.useBucket(bucket, region);
        return this;
    },
    //将一个目录同步到oss
    //source 本地文件
    //object oss 目标object
    //bucket 唯一桶名
    //return [] files array
    dir: function*(source,object,bucket,ignore){
        if(!store) return false;
        if(bucket){
            this.useBucket(bucket);
        }
        //排除掉 node_modules
        ignore = ['node_modules'].concat(ignore || []);
        var files = yield walk(source,{
            symlinks: true,
            ignore: ignore
        });
        debug('oss.dir : files of dir %s', _(files).toString());
        var result = [];
        for(var i=0;i<files.length;i++){
            var obj = yield store.put(path.join(object,files[i]), path.join(source,files[i]));
            result.push(obj);
        }
        debug('oss.dir : upload result');
        debug(result);
        return result;
    },
    //上传图片
    uploadImg: function*(bucket){
        if(!store) return false;
        if(bucket){
            this.useBucket(bucket);
        }
    }
};