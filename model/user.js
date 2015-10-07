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
        var id = yield self.id('name',name);
        var user = yield redis.hgetall(keyPre+id);
        //存在github账号绑定
        if(user.bindGithub==='true'){
            user.github = yield this.github(user.id);
        }
        var avatar = user.avatar;
        if(!avatar && user.github.avatar_url){
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
        return yield this.data(id);
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
        return yield mBook.getListByIds(ids);
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
    }
});