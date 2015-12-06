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
    /**
     * 通过用户名来获取用户
     * @param name
     */
    getByName: function*(name){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;
        var id;
        if(_.isNumber(name)){
            id = name;
        }else{
            id = yield self.id('name',name);
        }
        if(id === -1) return false;
        var user = yield redis.hgetall(keyPre+id);
        //存在github账号绑定
        if(user.bindGithub==='true'){
            user.github = yield this.github(user.id);
        }
        var avatar = user.avatar;
        if(!avatar && user.github){
            user.avatar = user.github.avatar_url.split('?')[0];
        }
        if(!user.avatar){
            user.avatar = '//a.apebook.org/avatar/default-avatar.png';
        }
        return user;
    },
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
        return yield this.getByName(data.name||Number(data.id));
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
    },
    /**
     * 通过github来获取用户
     * @param name
     */
    getUserIdByGithubName: function*(name){
        var self = this;
        var redis = self.redis;
        var keyPre = self.githubKeyPre;
        //获取所有存在github绑定的用户
        var keys = yield redis.keys(keyPre+'*');
        var userId;
        for(var i=0;i<keys.length;i++) {
            var userName = yield redis.hmget(keys[i],'login');
            if(userName[0] === name){
                userId = keys[i].split(':')[1];
            }
        }
        return Number(userId);
    },
    //用户头像
    avatar: function*(user){
        var avatar = user.avatar;
        if(!avatar && user.bindGithub==='true'){
            var githubUser = yield this.github(user.id);
            avatar = githubUser.avatar_url;
        }
        if(!avatar){
            avatar = '//a.apebook.org/avatar/default-avatar.png';
        }
        return avatar;
    },
    /**
     * 作者发布的书籍
     */
    books: function*(userId,bookId){
        var key = this.keyPre+userId+':books';
        if(bookId){
            yield this.redis.del('cache:'+key);
            return yield this.redis.rpush(key,bookId);
        }

        var mBook = this.model.book;
        var books = yield this.data({
            key : key,
            action: this._list,
            params: [{key:key,keyPre:mBook.keyPre,start:0,field:'create'}]
        });
        return books;
    },
    _list: function*(config){
        var ids = yield this.sort(config);
        var mBook = this.model.book;
        return yield mBook.getListByIds(ids,true);
    },
    /**
     * 获取作者发布的书籍数量
     */
    bookCount: function*(userId){
        var key = this.keyPre+userId+':books';
        var ids = yield this.redis.lrange(key,0,-1);
        return ids.length||0;
    },
    /**
     * 用户角色
     * @param userId
     */
    role: function*(userId,role){
        var self = this;
        var redis = self.redis;
        var keyPre = self.keyPre;

        if(role){
            yield redis.hmset(keyPre+userId,{role:role});
        }
        return yield redis.hgetall(keyPre+userId,'role');
    },
    /**
     * 判断是否是本人的图书
     */
    isSelfBook: function*(userId,bookId){
        var isSelfBook = false;
        var books = yield this.books(userId);
        if(books.length){
            isSelfBook = books.some(function(book){
                return book.id === bookId;
            });
        }
        return isSelfBook;
    },
    /**
     * 用户token
     * @param name
     */
    token: function*(name,isSet){
        var redis = this.redis;
        var key = this.keyPre+'token:'+name;
        if(isSet){
            var value = name;
            if(process.env.TOKEN_KEY){
                value += process.env.TOKEN_KEY;
            }
            var token = _.md5(value);
            yield redis.set(key,token);
            //2个小时后失效
            yield redis.expire(key,120*60);
        }
        return yield redis.get(key);
    },
    /**
     * 获取所有的用户
     */
    all: function*(){
        var p = this.keyPre;
        var redis = this.redis;
        var ids = yield this.ids();
        var users = [];
        for(var i=0;i<ids.length;i++){
            var user = yield redis.hgetall(p+ids[i]);
            users.push(user);

        }
        return users;
    }
});