//首页

var _ = require('../base/util');

module.exports = {
    index: function *(){
        var user = _.user.bind(this)();
        var mBook = this.model.book;
        var myBooks = [];
        //已经登录
        if(user){
            myBooks = yield mBook.list(user.id,'userId');
        }
        yield this.html('index',{myBooks:myBooks});
    }
};