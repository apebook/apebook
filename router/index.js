//向应用注册路由
var admin = require('./admin');
var book = require('./book');
var user = require('./user');
var ossTest = require('./oss-test');
var _ = require('../base/util');

module.exports = function(app){
    var mBook = app.model.book;
    //首页
    app.get('/',function *(){
        var user = _.user.bind(this)();
        //已经登录
        if(user){
            var list = yield mBook.list();
        }
        yield this.html('index',{});
    });

    book(app);
    user(app);

    ossTest(app);
};