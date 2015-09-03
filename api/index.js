//向应用注册api路由
var cat = require('./cat');
var book = require('./book');
var user = require('./user');
var repo = require('./repo');
module.exports = function(app){
    cat(app);
    book(app);
    user(app);
    repo(app);
};