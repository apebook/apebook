var _ = require('../base/util');
var Base = require('./base');
//书籍model
var Book = module.exports = function(){
    this.keyPre = 'book:';
};

Book.prototype = _.extend({},Base,{
    //通过书名获取一本书
    get: function *(name,key){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var id = yield self.id(key || 'name',name);
        if(id >= 0){
            return yield redis.hgetall(keyPre+id);
        }else{
            return null;
        }
    },
    //通过id获取书籍数据
    getById: function*(id){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        return yield redis.hgetall(keyPre+id);
    },
    //添加/修改书籍信息
    post: function *(data){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var name = data.name;
        var id = data.id || -1;
        if(id !== -1 && name){
            id = yield self.id('name',name);
        }
        //不存在该书籍
        if(id === -1){
            id = yield self.addId();
            data.id = id;
            data.create = _.now();
        }
        yield redis.hmset(keyPre+id,data);
        //需要设置类目
        if(data.cat){
            //类目model
            var mCat = self.app.model.cat;
            //类目下添加此书
            yield mCat.postBook(data.id,data.cat);
        }
        //需要设置编程语言
        if(data.lang){
            //类目model
            var mLang = self.app.model.lang;
            //类目下添加此书
            yield mLang.postBook(data.id,data.lang);
        }
        return yield this.getById(id);
    },
    //是否已经存在uri
    isUriExist: function*(uri){
        var id = yield this.id('uri',uri);
        return id !== -1;
    },
    //书名是否重复
    isExist: function*(name){
        var id = yield this.id('name',name);
        return id !== -1;
    },
    //获取所有书籍列表
    all: function*(config){
        var self = this;
        var p = this.keyPre;
        var redis = self.redis;
        var defaultConfig = {
            //降序
            //默认降序
            descOrAsc : 'DESC',
            //排序的字段
            //默认按照创建时间
            field: 'create',
            //取数据时的起始索引
            start: 0
        };
        config = _.extend({},defaultConfig,config);
        var params = [p+'ids',config.descOrAsc];
        params.push('BY',p+'*->'+config.field);
        //是否限制返回的数据个数
        if(config.limit){
            params.push('LIMIT',config.start,config.limit);
        }
        var ids = yield redis.sort(params);
        var books = [];
        for(var i=0;i<ids.length;i++){
            var book = yield redis.hgetall(p+ids[i]);
            books.push(book);
        }
        return books;
    },
    //通过字段过滤出书籍列表
    list: function*(value,key){
        var books = yield this.all();
        return _.filter(books,function(book){
            return book[key] === value;
        })
    },
    //书籍介绍
    readMe: function*(id,html){
        return yield this.meta(id,'readme',html);
    },
    //书籍摘要
    summary: function*(id,html){
        return yield this.meta(id,'summary',html);
    },
    //添加额外的信息，比如reademe等
    meta: function*(id,key,value){
        var self = this;
        var p = this.keyPre;
        var redis = self.redis;
        key = p + id+':'+key;
        if(!value){
            return yield redis.get(key);
        }else{
            yield redis.set(key,value);
            return yield redis.get(key);
        }
    },
    /**
     * 最近更新的书籍
     * @param id
     */
    nearestUpdate: function*(id){
        var p = this.keyPre;
        var redis = this.redis;
        var k = 'book:nearest';
        if(id){
            return yield redis.lpush(k,id);
        }
        var ids = yield redis.lrange(k,0,15);
        var books = [];
        for(var i=0;i<ids.length;i++){
            var book = yield redis.hgetall(p+ids[i]);
            books.push(book);
        }
        //永远只存储 100 条数据
        var len = yield redis.llen(k);
        if(len >= 100){
            yield redis.rpop(k);
        }
        return books;
    },
    /**
     * 书籍同步中锁定更新
     */
    lock: function*(id){
        var redis = this.redis;
        var key = 'book:lcock:'+id;
        if(id){
            yield redis.set(key,true);
            //5分钟自动删除
            yield redis.expire(key,300);
        }
        return yield redis.get(key)
    },
    /**
     * 解除更新锁定
     * @param id
     */
    cleanLock: function*(id){
        var key = 'book:lcock:'+id;
        return yield redis.del(key)
    }
});