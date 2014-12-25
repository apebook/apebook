//类目管理api
var _ = require('../base/util');
module.exports = function(app){
    var mCat = app.model.cat;
    //添加类目
    app.get('/api/cat/post',function *(){
        var query = this.request.query;
        if(query.name){
            var data = yield mCat.post(query.name);
            _.json.bind(this)(data);
        }else{
            _.error.bind(this)('name不可以为空');
        }
        //_.json.bind(this,data);
    });
};