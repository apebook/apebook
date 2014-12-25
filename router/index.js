//向应用注册路由
var admin = require('./admin');
var book = require('./book');
var github = require('./github');
module.exports = function(app){
    //首页
    app.get('/',function *(){
        yield this.render('index',{title:'apebook'});
    });

    book(app);
    github(app);
};