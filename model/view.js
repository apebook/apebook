//书籍访问数据
var _ = require('../base/util');
var moment = require('moment');
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
    },
    /**
     * 获取图书的访问数据list，用于生成图表
     * @param bookId
     */
    list: function*(bookId,days){
        var self = this;
        var redis = self.redis;
        var times = yield redis.smembers(self.timeKeyPre+bookId);
        return this.daysCount(times,days || 30);
    },
    /**
     * 获取一个时间段内的一天访问量
     * @param times
     * @param days
     * @param start
     */
    daysCount: function(times,days,start){
        var data = {
            x:[],
            y:[]
        };
        if(!times || !times.length){
            return data;
        }
        if(!start){
            start = _.now();
        }
        var oneDayTime = 24*60*60*1000;

        for(var i=days;i>1;i--){
            var dayTime = start - (i*oneDayTime);
            var sDay = moment(dayTime).format("DD/MM");
            data.x.push(sDay);
            var dayTimes = _.filter(times,function(time){
                return Number(time) > dayTime && Number(time) < (dayTime+oneDayTime);
            });
            data.y.push(dayTimes.length);
        }
        return data;
    }
};