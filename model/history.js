/**
 * 书籍变更记录
 */
var _ = require('../base/util');
var events = ['create','github','public','action','success','error'];
var Base = require('./base');
var moment = require('moment');

var History = module.exports = function(){
  this.redis = null;
  this.keyPre = 'history:';
};

History.prototype = _.extend({},Base,{
  /**
   * 添加历史事件
   * @returns {*}
   */
  add : function*(bookId,event,content,user){
    var self = this;
    var redis = self.redis;
    var now = _.now();
    var keyPre = this.keyPre+bookId+':';
    //demo history:1:ids
    var id = yield self.addId(keyPre);
    var data = {
      id:id,
      //事件名
      event:event,
      //事件内容
      content:content,
      //发生时间
      create:now,
      //用户
      user:user
    };
    yield redis.hmset(keyPre+id,data);
    return true;
  },
  /**
   * 获取事件列表
   */
  list: function*(bookId,start,limit){
    var self = this;
    var p = this.keyPre+bookId+':';
    var redis = self.redis;
    var config = {
      //降序
      //默认降序
      descOrAsc : 'DESC',
      //排序的字段
      //默认按照创建时间
      field: 'create',
      //取数据时的起始索引
      start: start || 0,
      //默认反馈10条历史数据
      limit: limit || 10
    };
    var params = [p+'ids',config.descOrAsc];
    params.push('BY',p+'*->'+config.field);
    params.push('LIMIT',config.start,config.limit);

    var ids = yield redis.sort(params);
    var events = [];
    for(var i=0;i<ids.length;i++){
      var event = yield redis.hgetall(p+ids[i]);
      if(event){
        event.create = moment(Number(event.create)).fromNow();
      }
      events.push(event);
    }
    return events;
  }
});