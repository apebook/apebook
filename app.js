//http://www.apebookjs.org
// Author: 明河 <minghe36@126.com>
var _ = require('./base/util');
var koa = require('koa');
//配置文件
var config = require('./config');
var router = require('koa-router');
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
    //配置模板目录
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
var xtpl = require('xtpl/lib/xtpl');
app.context.onerror = function(err){
    var self = this;
    // don't do anything if there is no error.
    // this allows you to pass `this.onerror`
    // to node-style callbacks.
    if (null == err) {
        return;
    }

    this.status = err.status;
    this.type = 'html';
    var msg = err.message;
    if(/request github/.test(msg)){
        msg = 'github 访问太慢，接口调用超时，请刷新页面重试。'+msg;
    }
    xtpl.renderFile(config.viewDir+'/error-page.xtpl', {
        msg: msg,
        stack: err.stack
    }, function(err,html){
        self.res.end(html);
    });

};

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
