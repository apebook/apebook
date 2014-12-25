//数据库操作基类
//增加操作一致的id操作能力

var _ = require('../base/util');

module.exports = {
    //获取/设置自动增长id
    //incr 是否设置
    autoId: function *(incr){
        var key = this.keyPre+'autoId';
        if(incr){
            yield this.redis.incr(key);
        }
        return yield this.redis.get(key);
    },
    //向列表添加一个数据id
    addId: function *(id){
        return yield this.redis.rpush(this.keyPre+'ids',id);
    },
    ids: function *(){
        return yield this.redis.lrange(this.keyPre+'ids',0,-1);
    },
    //通过字段来捞取id
    id: function *(field,value){
        var self = this;
        var redis = self.redis;
        var ids = yield redis.lrange(self.keyPre+'ids',0,-1);
        var id = -1;

        for(var i=0;i<ids.length;i++) {
            var val = yield redis.hmget(self.keyPre+i,field);
            if(value === val){
                id = i;
            }
        }

        return id;
    }
};