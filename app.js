//http://www.apebookjs.org
// Author: 明河 <minghe36@126.com>
var koa = require('koa');
//配置文件
var config = require('./config');
var router = require('koa-router');
var onerror = require('koa-onerror');
//xtpl模板引擎对koa的适配
var xtplApp = require('xtpl/lib/koa');
//静态文件cache
var staticCache = require('koa-static-cache');

var session = require('koa-generic-session');
var redisStore = require('koa-redis')(config.redis);
var githubAuth = require('koa-github');
var app = koa();
app.config = config;
//co-redis实例
app.redis = redisStore.client;
//xtemplate模板渲染
xtplApp(app,{
    //配置模板目录redis
    views: config.viewDir
});

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

//静态文件请求
app.use(staticCache(config.staticDir));

//使用跟express相似的路由器
app.use(router(app));

var appRouter = require('./router/index');

appRouter(app);

app.listen(7878);
