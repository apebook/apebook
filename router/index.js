//向应用注册路由
var book = require('./book');
var user = require('./user');
var ctlIndex = require('../controller/index');
var _ = require('../base/util');

module.exports = function(app){
    //首页
    app.get('/',ctlIndex.index);
    app.get('/library',ctlIndex.library);

    book(app);
    user(app);
};