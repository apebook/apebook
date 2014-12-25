//类目
var Cat = module.exports = function(){
    this.redis = null;
    this.keyPre = 'cat:';
    this.key = 'cats';
};

Cat.prototype = {
    //获取类目列表
    list: function *(){
        var redis = this.redis;
        var key = this.key;
        return yield redis.smembers(key);
    },
    //给指定类目添加一本书
    postBook: function *(bookName,cat){
        yield this.redis.sadd(this.keyPre+cat,bookName);
        return bookName;
    },
    //新增/编辑一个类目
    post: function*(catName){
        var redis = this.redis;
        var key = this.key;
        yield redis.sadd(key,catName);
        return yield redis.smembers(key);
    }
};