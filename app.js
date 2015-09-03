//http://www.apebookjs.org
// Author: 明河 <minghe36@126.com>
var _ = require('./base/util');
var koa = require('koa');
//配置文件
var config = require('./config');
var router = require('koa-router');
var onerror = require('koa-onerror');
//xtpl模板引擎对koa的适配
var xtplApp = require('./base/xtpl');

var session = require('koa-generic-session');
var redisStore = require('koa-redis')(config.redis);
var githubAuth = require('koa-github');
var app = koa();
app.config = config;
//co-redis实例
app.redis = redisStore.client;
app.context.redis = app.redis;
//xtemplate模板渲染
xtplApp.render(app,{
    //配置模板目录redis
    views: config.viewDir
});

app.context.config = config;
//渲染html页面
//与xtpl的不同是自动注入配置项
app.context.html = xtplApp.html;

//log记录
var Logger = require('mini-logger');
var logger = Logger({
    dir: config.logDir,
    categories:['log'],
    format: '[{category}]-YYYY-MM-DD[.log]'
});
app.context.error = function(msg,v){
    if(typeof msg === 'string'){
        msg = new Date().toString()+' '+msg;
    }
    console.log(msg,v||'');
    logger.error(msg,v||'');
};
app.context.log = function(msg,v){
    if(typeof msg === 'string'){
        msg = new Date().toString()+' '+msg;
    }
    console.log(msg,v||'');
    logger.log(msg,v||'');
};

//oss存储
var oss = require('./base/oss');
app.context.oss = oss.connect(config.oss);


//session中间件
app.name = 'apebook-session';
app.keys = ['keys', 'keykeys'];
app.use(session({
    store: redisStore,
    prefix: 'apebook:sess:',
    key: 'apebook.sid'
}));

//github账号登录校验
app.use(githubAuth(config.github));

//错误捕获输出
onerror(app);

//post body 解析
var bodyParser = require('koa-bodyparser');
app.use(bodyParser());

//数据校验
var validator = require('koa-validator');
var rules = require('./base/validator-rules');
rules(validator);
app.use(validator());

//使用跟express相似的路由器
app.use(router(app));

//加载数据库model
var model = require('./model/index');
model(app);

//应用路由
var appRouter = require('./router/index');
appRouter(app);

var apiRouter = require('./api/index');
apiRouter(app);

app.listen(config.port);
console.log('listening on port %s',config.port);
module.exports = app;
