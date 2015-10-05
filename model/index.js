var _ = require('../base/util');
//加载所有的model
var modelNames = ['user','book','view','cat','lang','history'];
var models = {};
modelNames.forEach(function(name){
    var Model = require('./'+name);
    models[name] = new Model();
});
module.exports = function(app){
    //添加redis实例到model中
    _.each(models,function(model){
        model.redis = app.redis;
        model.app = app;
        model.model = models;
    });
    //将model挂载在app上，供router使用
    app.model = models;
    app.context.model = models;
    return models;
};