/**
 * 语言管理
 */
var langs = require('../config/lang');
var _ = require('../base/util');
var Lang = module.exports = function(){
  this.redis = null;
  this.keyPre = 'lang:';
};

Lang.prototype = {
  all: function(){
    return langs;
  },
  //给指定类目添加一本书
  postBook: function *(bookId,lang){
    var redis = this.redis;
    var keyPre = this.keyPre;

    if(langs.indexOf(lang)===-1) return false;

    yield redis.sadd(keyPre+lang,bookId);

    //从其他编程语言中删除
    for(var i=0;i<langs.length;i++){
      var c = langs[i];
      if(c !== lang){
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