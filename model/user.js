//用户管理模块
var _ = require('../base/util');
var Base = require('./base');
var crypto = require('crypto');


var User = module.exports = function(){
    this.redis = null;
    this.keyPre = 'user:';
    this.githubKeyPre = 'github-user:';
};

User.prototype = _.extend({},Base, {
    //添加/修改一个用户
    //demo data
    post: function *(data){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var id = data.id;
        if(!id && data.name){
            id = yield self.id('name',data.name);
        }
        if(id === -1){
            id = yield self.addId();
            data.id = id;
            data.create = _.now();
            if(!data.role) data.role = 'user';
        }
        if(data.password){
            //密码使用md5编码
            data.password = _.md5(data.password);
        }

        yield redis.hmset(keyPre+id,data);
        return yield this.data(id);
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
    },
    //设置github账号
    github: function*(userId,data){
        var self = this;
        var redis = self.redis;
        var keyPre = self.githubKeyPre;

        if(data){
            yield redis.hmset(keyPre+userId,data);
            yield self.post({
                id: userId,
                //给已经绑定的用户打标
                bindGithub: true
            })
        }

        return yield redis.hgetall(keyPre+userId);
    }
});