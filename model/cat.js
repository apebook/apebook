/**
 * 类目管理
 */
var cats = require('../config/cat');
var _ = require('../base/util');
var Cat = module.exports = function(){
  this.redis = null;
  this.keyPre = 'cat:';
};

Cat.prototype = {
  all: function(){
    return cats;
  },
  //给指定类目添加一本书
  postBook: function *(bookId,cat){
    var redis = this.redis;
    var keyPre = this.keyPre;

    if(cats.indexOf(cat)===-1) return false;

    yield redis.sadd(keyPre+cat,bookId);
    //从其他类别中删除
    for(var i=0;i<cats.length;i++){
      var c = cats[i];
      if(c !== cat){
        var bookIds = yield redis.smembers(keyPre + c);
        if(bookIds.length>0){
          for(var j=0;j<bookIds.length;j++){
            var id = bookIds[j];
            if(id === bookId){
              yield redis.srem(keyPre + c,id);
            }
          }
        }
      }
    }

    return bookId;
  }
};