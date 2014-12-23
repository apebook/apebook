//向应用注册路由
var admin = require('./admin');
module.exports = function(app){
    //首页
    app.get('/index',function *(){
        yield this.render('index',{title:'apebook'});
    });
};