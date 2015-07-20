var _ = require('./util');

//用来校验参数与登录的通用中间件
module.exports = {
    //登录检查
    login: function*(next){
        var user = this.session.user;
        //登录
        if(!user){
            this.redirect('/login?redirect_url='+this.originalUrl);
            return false;
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
    }
};