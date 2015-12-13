//应用配置文件
//Author: minghe <minghe36@126.com>

var path = require('path');
var local = require('./local');
var _ = require('../base/util');
var config = {
    title:'apebook 猿书 程序员的图书馆',
    appName: 'apebook',
    //端口号配置
    port: 8080,
    host: 'http://apebook.org/',
    coverHost:'//cover.apebook.org/',
    //书籍地址
    bookHost:'//book.apebook.org',
    assetHost:'//a.apebook.org',
    //kissy 静态资源的包配置
    kissyPkg: 'http://a.apebook.org',
    //是否开启调试，调试的情况下会输出错误信息
    debug: true,
    // 是否开启快照
    snapshot: true,
    //redis数据库连接配置
    redis:{
        host: 'localhost',
        port: 7777
    },
    //github配置
    github:{
        clientID: '1f70a5a2b666fc22b5c0',
        clientSecret: 'xxxx',
        callbackURL: 'http://www.apebook.org/github/callback',
        scope: ['user','public_repo','admin:repo_hook','admin:org_hook','read:org'],
        userKey: 'github_user',
        timeout: 120000
    },
    //触发github授权的路由
    githubPath:'/github/auth?redirect_uri=',
    //邮箱配置
    //http://submail.cn/
    mail:{
        appid: '10815',
        appkey: 'xxxx',
        signtype: 'normal',
        from:'adminer@mail.apebook.org'
    },
    //邮箱模板
    mailProject:{
        //注册用户使用的激活邮箱
        join:'v07Wj'
    },
    //模板所在的目录
    viewDir: path.join(__dirname,'..','view'),
    logDir: path.join(__dirname,'..', 'log'),
    //静态文件所在的目录
    staticDir: path.join(__dirname,'..', 'public'),
    //github仓库同步位置
    repoDir: path.join(__dirname,'..', 'repo'),
    "oss":{
        accessKeyId: 'R7wBScg51UDJv06B',
        accessKeySecret: 'xxxx',
        bucket: 'apebook',
        region: 'oss-cn-hangzhou'
    },
    "ossBuckets":{
        asset: 'apebook-asset',
        book: 'apebook-book',
        cover: 'apebook-cover'
    },
    //错误页面
    errorPage:path.join(__dirname,'..', 'view','error.html')
};
if(process.env.NODE_ENV == 'local'){
    config = _.extend(config,local);
}

if(process.env.OSS){
    config.oss.accessKeySecret = process.env.OSS;
}
if(process.env.GITHUB){
    config.github.clientSecret = process.env.GITHUB;
}
if(process.env.MAIL_KEY){
    config.mail.appkey = process.env.MAIL_KEY;
}
if(process.env.TOKEN_KEY){
    config.tokenKey = process.env.TOKEN_KEY;
}
//redis 数据库的密码
if(process.env.REDIS_PASS){
    config.redis.pass = process.env.REDIS_PASS;
}
var occupation = require('./occupation');
config.occupations = occupation;
var cats = require('./cat');
//分类
config.cats = cats;
//编程语言
config.langs = require('./lang');
module.exports = config;