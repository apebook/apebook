//http://www.apebookjs.org
// Author: 明河 <minghe36@126.com>
var _ = require('./base/util');
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
var debug = require('debug')('apebook');
var app = koa();
app.config = config;
//co-redis实例
app.redis = redisStore.client;
//xtemplate模板渲染
xtplApp(app,{
    //配置模板目录redis
    views: config.viewDir
});

//渲染html页面
//与xtpl的不同是自动注入配置项
app.context.html = function*(path, data){
    data = _.extend(data,config);
    //错误信息
    var errors = this.session._errors;
    data.errors = {};
    if(errors){
        data.errors = errors;
        delete this.session._errors;
    }
    //存在表单提交的数据
    var body = this.session._body || {};
    if(body){
        data.body = body;
        delete this.session._body;
    }
    //用户session
    data.user = this.session.user;
    yield app.context.render.bind(this)(path, data);
    return true;
};

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
