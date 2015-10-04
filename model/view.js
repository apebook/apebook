//书籍访问数据
var _ = require('../base/util');
var View = module.exports = function(){
    this.redis = null;
    this.keyPre = 'view:';
    this.timeKeyPre = 'view-time:';
};

View.prototype = {
    /**
     * 添加统计数据
     * @param bookId
     * @returns {*}
     */
    incr : function*(bookId,session,mBook){
        var self = this;
        var db = self.redis;
        var now = _.now();
        //已经存在访问不触发统计，防止重复记录
        if(session && session[this.keyPre+bookId]){
            return yield self.count(bookId);
        }
        yield db.incr(self.keyPre+bookId);
        yield db.sadd(self.timeKeyPre+bookId,now);
        session[this.keyPre+bookId] = true;
        var count = yield self.count(bookId);
        yield mBook.post({id:bookId,view:count});
        return count;
    },
    //获取某个书籍的访问量
    count: function*(bookId){
        return Number(yield this.redis.get(this.keyPre+bookId)) || 0;
    }
};