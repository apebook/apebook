//数据库操作基类
//增加操作一致的id操作能力

var _ = require('../base/util');

module.exports = {
    setId: function *(){
        var id = yield self.id('name',name);
    },
    //获取/设置自动增长id
    //incr 是否设置
    autoId: function *(incr,keyPre){
        var key = keyPre || this.keyPre +'autoId';
        if(incr){
            yield this.redis.incr(key);
        }
        return yield this.redis.get(key);
    },
    //增长id，并把id添加到列表中
    addId: function *(keyPre){
        var self = this;
        //增长个id
        var id = yield self.autoId(true,keyPre);
        yield this.redis.rpush((keyPre || this.keyPre) +'ids',id);
        return id;
    },
    ids: function *(keyPre){
        return yield this.redis.lrange(keyPre || this.keyPre+'ids',0,-1);
    },
    //通过字段来捞取id
    id: function *(field,value){
        var self = this;
        var redis = self.redis;
        var ids = yield redis.lrange(self.keyPre+'ids',0,-1);
        var id = -1;

        for(var i=0;i<ids.length;i++) {
            var val = yield redis.hmget(self.keyPre+ids[i],field);
            if(value === val[0]){
                id = ids[i];
            }
        }

        return id;
    },
    //获取指定字段的值
    field: function*(id,field){
        var self = this;
        var redis = self.redis;
        var data = yield redis.hmget(self.keyPre+id,field)
        return data[0];
    }
};