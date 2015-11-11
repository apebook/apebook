var _ = require('../base/util');

module.exports = {
  /**
   * 书籍管理
   */
  books: function*(){
    var mBook = this.model.book;
    var data = {};
    data.books = yield mBook.all();
    yield this.html('admin/books',data);
  },
  /**
   * 用户管理
   */
  users: function*(){
    var mUser = this.model.user;
    var data = {};
    data.users = yield mUser.all();
    yield this.html('admin/users',data);
  }
};