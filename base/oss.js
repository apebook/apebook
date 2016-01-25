//oss 存储服务
var oss = require('ali-oss');
var walk = require('co-walk');
var _ = require('lodash');
var path = require('path');
var store;
var conf;
var debug = require('debug')('ali-oss');
var fs = require('co-fs-extra');

module.exports = {
    //连接 oss 的bucket
    connect: function(config){
        conf = config;
        store = oss(config);
        console.log('oss connect:');
        console.log(store);
        return this;
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
    /**
     * 推送一个文件到 oss
     * @param src
     * @param dest
     */
    put: function*(src,dest,bucket){
        if(bucket){
            this.useBucket(bucket);
        }
        try{
            return yield store.put(dest,src);
        }catch(e){
            return e;
        }
    },
    //上传图片
    uploadImg: function*(readStream,bucket,dir){
        if(!store) return false;
        if(!readStream) return false;
        if(bucket){
            this.useBucket(bucket);
        }
        if(!dir){
            dir = '';
        }
        //图片名使用时间戳
        var suffix = readStream.filename.split('.')[1];
        var name = _.now()+'.'+suffix;

        //先将文件上传到临时目录
        var target = yield this._uploadToTemp(name,readStream);
        if(!target) return false;
        var result = yield store.put(dir+name,'./'+target);
        console.log(result);
        //删除临时文件
        yield this._delTempFile(target);
        return result;
    },
    //上传文件到临时目录
    _uploadToTemp: function(name,readStream){
        return new Promise(function(resolve, reject){

            var target = path.join('temp',name);
            var stream = fs.createWriteStream(target);
            readStream.pipe(stream);
            console.log('uploading %s -> %s',readStream.filename, stream.path);
            stream.on('finish',function(){
                resolve(target);
            })
        });
    },
    //删除临时文件
    _delTempFile: function*(path){
        return yield fs.unlink(path);
    }
};