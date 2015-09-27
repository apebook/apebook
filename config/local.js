//本地调试环境配置
var path = require('path');
module.exports = {
    "env":"local",
    "host": 'http://localhost:8080/',
    "kissyPkg": 'http://localhost:3333/src',
    github:{
        clientID: '1f70a5a2b666fc22b5c0',
        clientSecret: '3d81d447d49cd7368dd00a74c700fa7ecf53bb4f',
        callbackURL: 'http://localhost:9090/github/callback',
        scope: ['user','public_repo','read:repo_hook','write:repo_hook'],
        userKey: 'github_user',
        timeout: 10000
    }
};