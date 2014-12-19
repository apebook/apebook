//向应用注册路由
var admin = require('./router/admin');
module.exports = function(app){
    admin(app);
};