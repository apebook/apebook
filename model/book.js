var _ = require('../base/util');
var Base = require('./base');
//书籍model
var Book = module.exports = function(){
    this.keyPre = 'book:';
};

Book.prototype = _.extend({},Base,{
    //通过书名获取一本书
    get: function *(name){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var id = yield self.id('name',name);
        if(id >= 0){
            return yield redis.hgetall(keyPre+id);
        }else{
            return null;
        }
    },
    //添加/修改书籍信息
    post: function *(data){
        var self = this;
        if(!data.name){
            return _.mError('书名不可以为空');
        }
        if(!data.cat){
            return _.mError('必须选择一个类目');
        }
        var redis = self.redis;
        var keyPre = self.keyPre;
        var name = data.name;
        var id = yield self.id('name',name);
        //不存在该书籍
        if(id === -1){
            //增长个id
            id = yield self.autoId(true);
            data.id = id;
            yield self.addId(id);
        }
        yield redis.hmset(keyPre+id,data);
        //类目model
        var mCat = self.app.model.cat;
        //类目下添加此书
        yield mCat.postBook(data.name,data.cat);
        return {"success":true};
    }
});