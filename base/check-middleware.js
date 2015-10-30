var _ = require('./util');
/**
 * 是否是 api 路由
 * @param p
 */
function isApi(p){
    return /\/api\//.test(p);
}
/**
 * 路由错误时的处理
 */
function *error(msg){
    if(isApi(this.req.url)){
        _.error.bind(this)(msg);
    }else{
        yield this.html('error',{msg:msg});
    }
}

//用来校验参数与登录的通用中间件
module.exports = {
    //登录检查
    login: function*(next){
        var user = this.session.user;
        //登录
        if(!user){
            this.session.back = this.url;
            this.redirect('/login');
            return false;
        }
        //账号没有激活
        if(user.activate !== "true"){
            this.redirect('/activate');
        }
        yield next;
    },
    //接口登录检查
    apiLogin: function*(next){
        var user = this.session.user;
        //登录
        if(!user){
            this.body = {'success':false,login:false,msg:'请先登录'};
            return false;
        }
        this.user = user;
        yield next;
    },
    //检查书籍是否存在
    bookExist: function*(id,next){
        if(!id){
            this.error('%s param is not exist',id);
            yield this.html('error',{msg:'id参数不存在！'});
            return false;
        }else{
            var mBook = this.model.book;
            this.id = id;
            var book = yield mBook.getById(id);
            if(!book){
                this.error('%s book is not exist',id);
                yield this.html('error',{msg:'不存在该书籍！'});
                return false;
            }
            this.book = book;
            yield next;
        }
    },
    //判断uri参数是否存在
    uriExist: function*(uri,next){
        if(!uri){
            this.error('%s param is not exist',uri);
            yield this.html('error',{msg:'uri参数不存在！'});
            return false;
        }else{
            var mBook = this.model.book;
            var id = yield mBook.id('uri',uri);
            var book = yield mBook.getById(id);
            if(!book){
                this.error('%s book is not exist',uri);
                yield this.html('error',{msg:'不存在该书籍！'});
                return false;
            }
            this.book = book;
            yield next;
        }
    },
    //post 判断是否存在书籍id
    apiPostBookExist: function*(next){
        var body = yield this.request.body;
        var id = body.id;
        if(!id){
            _.error.bind(this)('书籍id不可以为空');
            return false;
        }else{
            var mBook = this.model.book;
            this.id = id;
            var book = yield mBook.getById(id);
            if(!book){
                this.error('%s book is not exist',id);
                _.error.bind(this)('书籍不存在');
                return false;
            }
            this.book = book;
            yield next;
        }
    },
    /**
     * 是否是管理员
     * @param next
     */
    isAdminer: function*(next){
        var user = this.session('user');
        if(user.role === 'admin'){
            yield next;
        }else{
            this.error('you is not adminer');
            yield error.bind(this)('您不是管理员，没有权限操作该页面');

        }
    },
    /**
     * 是否是本人的书籍
     * @param next
     */
    isYourBook: function*(next){
        var user = this.session['user'];
        var book = this.book;
        if(!book){
            var id = this.params.id || this.request.query.id;
            var mBook = this.model.book;
            this.id = id;
            book = yield mBook.getById(id);
            this.book = book;
        }
        var mUser = this.model.user;
        var isYourBook = yield mUser.isSelfBook(user.id,book.id);
        if(isYourBook){
            this.isYourBook = true;
            yield next;
        }else{
            this.error(book.id+' book is not your');
            yield error.bind(this)('您不是该图书作者，没有权限操作该页面');
        }
    }
};