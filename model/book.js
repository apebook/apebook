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
    //添加/修改书籍信息
    post: function *(data){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var name = data.name;
        var id = yield self.id('name',name);
        //不存在该书籍
        if(id === -1){
            id = yield self.addId();
            data.id = id;
            data.create = _.now();
        }
        yield redis.hmset(keyPre+id,data);
        //类目model
        var mCat = self.app.model.cat;
        //类目下添加此书
        return yield mCat.postBook(data.name,data.cat);
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
    }
});