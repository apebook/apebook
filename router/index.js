//向应用注册路由
var admin = require('./admin');
var book = require('./book');
var user = require('./user');
module.exports = function(app){
    //首页
    app.get('/',function *(){
        yield this.html('index',{});
    });

    book(app);
    user(app);
};