//后台管理页面
var util = require('../base/util');
module.exports = function(app){

    app.get('/admin/index',function *(){
        //var token = util.token.bind(this)(this.url);
        this.redirect('/github/auth?redirect_uri='+this.url);
        this.body = '23424';
    });
    //新增一个博客
    app.get('/admin/blog/add',function *(){
        var data = util.extend({title:'新增一个博客'},app.config);
        yield this.render('admin/add',data);
    })
};