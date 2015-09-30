//书籍相关的api
var _ = require('../base/util');
var BookCtrl = require('../base/book');
var ctlBook = require('../controller/book');
var check = require('../base/check-middleware');
module.exports = function(app){
    //更新书籍信息
    app.post('/api/book/post',check.apiLogin,check.apiPostBookExist,ctlBook.post);

    //书籍封面
    app.post('/api/book/cover',check.apiLogin,ctlBook.cover);
    //判断是否已经存在书籍url
    app.get('/api/book/exist',ctlBook.exist);
    //判断是否已经存在该书籍名称
    app.get('/api/book/exist-name',ctlBook.existName);
    //获取数据信息
    app.param('id',check.bookExist).get('/api/book/:id',ctlBook.getById);

    //同步书籍
    app.post('/api/book/sync',check.apiPostBookExist,ctlBook.sync);


};