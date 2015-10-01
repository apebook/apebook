/**
 * 书籍的变更历史
 */
var _ = require('../base/util');

module.exports = {
  /**
   * 获取书籍变更记录
   */
  list: function*(){
    var query = this.request.query;
    var start = query.start || 0;
    var limit = query.limit || 10;
    var id = query.id;
    if(!id){
      this.body = {success:false,msg:'id 参数不可以为空'};
    }
    var mHistory = this.model.history;
    var historys = yield mHistory.list(id,start,limit);
    _.json.bind(this)(historys);
  }
};