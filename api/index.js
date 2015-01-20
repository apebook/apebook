//向应用注册api路由
var cat = require('./cat');
var book = require('./book');
module.exports = function(app){
    cat(app);
    book(app);
};