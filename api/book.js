//书籍相关的api
var _ = require('../base/util');
var BookCtrl = require('../base/book');
var ctlBook = require('../controller/book');
var check = require('../base/check-middleware');
var ctlHistory = require('../controller/history');
module.exports = function(app){
    //更新书籍信息
    app.post('/api/book/post',check.apiLogin,check.apiPostBookExist,check.isYourBook,ctlBook.post);
    //书籍封面
    app.post('/api/book/cover',check.apiLogin,ctlBook.cover);
    //判断是否已经存在书籍url
    app.get('/api/book/exist',ctlBook.exist);
    //判断是否已经存在该书籍名称
    app.get('/api/book/exist-name',ctlBook.existName);
    //书籍的变更记录
    app.get('/api/book/history',ctlHistory.list);
    //图书的数据
    app.get('/api/book/data',check.apiLogin,check.isYourBook,ctlBook.apiData);
    //获取数据信息
    app.param('id',check.bookExist).get('/api/book/:id',ctlBook.getById);

    //同步书籍
    app.post('/api/book/sync',check.apiPostBookExist,check.isYourBook,ctlBook.sync);
    //hook
    app.post('/api/book/:id/sync',ctlBook.hook);
};