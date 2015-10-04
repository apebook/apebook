var _ = require('../base/util');

module.exports = {
    /**
     * 首页
     */
    index: function *(){
        var user = _.user.bind(this)();
        var mBook = this.model.book;
        var data = {};
        //已经登录
        if(user){
            data.myBooks = yield mBook.list(user.id,'userId');
            data.nav = 'my-book';
        }
        yield this.html('index',data);
    },
    /**
     * 图书馆
     */
    library: function*(){
        var data = {};
        var mBook = this.model.book;
        data.nearestBooks = yield mBook.newUpdateList();
        var mLang = this.model.lang;
        data.langs = mLang.all();
        data.welcomeBooks = yield mBook.welcomeList();
        yield this.html('library',data);
    }
};