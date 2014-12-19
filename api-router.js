//向应用注册api路由
//api路由遵循restful风格
var repo = require('./api/repo');
module.exports = function(app){
    repo(app);
};