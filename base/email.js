//注册/找回密码时使用的邮箱
var debug = require('debug')('email');
var urllib = require('co-urllib');
var defaultOptions = {
    tokenKey: 'githubToken',
    signinPath: '/github/auth',
    timeout: 5000,
    scope: ['user'],
    redirect: 'redirect_uri'
};

var Email = module.exports = function(config){

};