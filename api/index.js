//向应用注册api路由
var cat = require('./cat');
module.exports = function(app){
    cat(app);
};