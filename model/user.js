//用户管理模块
var _ = require('../base/util');
var Base = require('./base');
var crypto = require('crypto');


var User = module.exports = function(){
    this.redis = null;
    this.keyPre = 'user:';
};

User.prototype = _.extend({},Base, {
    //添加/修改一个用户
    //demo data
    post: function *(data){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        //是否存在用户名
        var id = yield self.id('name',data.name);
        if(id === -1){
            id = yield self.addId();
            data.id = id;
            data.create = _.now();
            if(!data.role) data.role = 'user';
        }

        //密码使用md5编码
        data.password = _.md5(data.password);
        //头像
        data.avatars = _.md5(data.email);

        yield redis.hmset(keyPre+id,data);
    },
    //获取用户数据
    data: function*(id){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        return yield redis.hgetall(keyPre+id);
    },
    //判断用户是否已经存在
    isExist: function*(name,key){
        var self = this;
        if(!key) key = 'name';
        var id = yield self.id(key,name);
        return id !== -1;
    },
    //校验用户密码
    authPassword: function*(id,password){
        var self = this;
        password = _.md5(password);
        var p = yield self.field(id,'password');
        return p === password;
    }
});