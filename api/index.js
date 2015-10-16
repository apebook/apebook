//向应用注册api路由
var cat = require('./cat');
var book = require('./book');
var user = require('./user');
var github = require('./github');
module.exports = function(app){
    cat(app);
    book(app);
    user(app);
    github(app);
};