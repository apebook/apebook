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
        var data = yield redis.hmget(self.keyPre+id,field);
        return data[0];
    },
    /**
     * 带有缓存的数据
     */
    data: function*(config){
        var key = config.key;
        var action = config.action;
        var params = config.params;
        //默认缓存5分钟
        var min = config.min || 5;
        //过滤器
        var filter = config.filter;

        var keyPre = 'cache:';
        var k = keyPre+key;
        var redis = this.redis;
        var data = yield redis.get(k);
        if(data){
            return JSON.parse(data).data;
        }
        data = yield action.apply(this,params);

        if(data){
            if(filter){
                data = filter.call(this,data);
            }
            var strData = JSON.stringify({data:data});
            yield this.redis.set(k,strData);
            yield this.redis.expire(k,min * 60);
        }
        return data;
    },
    /**
     * 排序获取列表
     */
    sort: function*(config){
        var self = this;
        var p = config.keyPre || this.keyPre;
        var key = config.key || p+'ids';
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
        var params = [key,config.descOrAsc];
        params.push('BY',p+'*->'+config.field);
        //是否限制返回的数据个数
        if(config.limit){
            params.push('LIMIT',config.start,config.limit);
        }
        return yield redis.sort(params);
    },
    /**
     * 缓存
     * @param key
     * @param data
     * @param min
     */
    cache: function*(key,data,min){
        var keyPre = 'cache:';
        if(data){
            if(_.isObject(data)){
                data = JSON.stringify(data);
            }
            var k = keyPre+key;
            yield this.redis.set(k,data);
            //默认缓存5分钟
            yield this.redis.expire(k,(min * 60) || (5 * 60));
        }
        return yield this.redis.get(keyPre+key);
    },
    /**
     * 删除缓存
     * @param key
     * @returns {*}
     */
    delCache: function*(key){
        return this.reids.del('cache:'+key);
    }
};