//首页

var _ = require('../base/util');

module.exports = {
    index: function *(){
        var user = _.user.bind(this)();
        var mBook = this.model.book;
        var myBooks = [];
        var data = {};
        //已经登录
        if(user){
            data.myBooks = yield mBook.list(user.id,'userId');
            data.nav = 'my-book';
        }
        yield this.html('index',data);
    }
};