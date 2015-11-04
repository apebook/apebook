var _ = require('../base/util');
var debug = require('debug')('apebook');
var githubApi = require('../base/github-api');
var check = require('../base/check-middleware');
var ctlBook = require('../controller/book');
//书籍相关的路由
module.exports = function(app){
    //创建书籍表单页面
    app.get('/new',check.login,ctlBook.bookForm);
    //书籍详情
    app.param('uri',check.uriExist).get('/book/:uri',ctlBook.detail);

    //书籍控制台
    app.param('id',check.bookExist).get('/book/:id/dashboard',check.login,check.isYourBook,ctlBook.dashboard);
    app.param('id',check.bookExist).get('/book/:id/setting',check.login,check.isYourBook,ctlBook.setting);
    app.param('id',check.bookExist).post('/book/:id/setting',check.login,check.isYourBook,ctlBook.saveSetting);
    app.param('id',check.bookExist).get('/book/:id/bind-github',check.login,check.isYourBook,ctlBook.bindGithubPage);
    app.param('id',check.bookExist).post('/book/:id/bind-github',check.login,check.isYourBook,ctlBook.bindGithub);

    //创建书籍
    app.post('/new',check.login,ctlBook.create);

    app.param('id',check.bookExist).get('/book/:id/data',check.login,ctlBook.data);
};