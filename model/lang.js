/**
 * 语言管理
 */
var langs = require('../config/lang');
var _ = require('../base/util');
var Base = require('./base');

var Lang = module.exports = function(){
  this.redis = null;
  this.keyPre = 'lang:';
};

Lang.prototype = _.extend({},Base,{
  all: function(){
    return langs;
  },
  /**
   * 是否是合法类目
   */
  isIn:function(lang){
    var langs = this.all();
    return langs.indexOf(lang) > -1;
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
  },
  /**
   * 图书列表
   */
  books: function*(lang,start,limit){
    var keyPre = this.keyPre;
    var mBook = this.model.book;
    var books = yield this.data({
      key : 'lang:books',
      action: this._list,
      params: [{key:keyPre+lang,keyPre:mBook.keyPre,start:0,field:'create'}]
    });
    if(limit){
      return books.slice(start||0,limit||10);
    }
    return books;
  },
  _list: function*(config){
    var ids = yield this.sort(config);
    var mBook = this.model.book;
    return yield mBook.getListByIds(ids);
  }
});