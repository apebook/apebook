//本地调试环境配置
var path = require('path');
module.exports = {
    "env":"local",
    "host": 'http://localhost:8080/',
    "kissyPkg": 'http://localhost:3333/src',
    github:{
        clientID: '88e11069c230ba24251b',
        clientSecret: 'xxxx',
        callbackURL: 'http://localhost:8080/github/callback',
        scope: ['user','public_repo','admin:repo_hook','admin:org_hook','read:org'],
        userKey: 'github_user',
        timeout: 10000
    },
    //redis数据库连接配置
    redis:{
        host: 'localhost',
        port: 6379
    }
};