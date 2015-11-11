//后台管理页面
var util = require('../base/util');
var ctlAdmin = require('../controller/admin');
var check = require('../base/check-middleware');
module.exports = function(app){

    //书籍管理
    app.get('/admin/books',check.login,check.isAdminer,ctlAdmin.books);
    app.get('/admin/users',check.login,check.isAdminer,ctlAdmin.users);
};