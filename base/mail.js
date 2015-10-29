var Mail = require('submail').Mail;
var _ = require('../base/util');
module.exports = {
  /**
   * 发送邮件
   * @param config
   */
  send: function(config){
    this.log('发送邮件：');
    this.log(config);
    if(!config.project){
      console.log('project 参数不存在');
      return false;
    }
    var globalConfig = this.config.mail;
    var mail = new Mail(globalConfig);

    mail.add_to(config.to);
    mail.add_to_name(config.name);
    mail.set_from(globalConfig.from);
    mail.set_project(config.project);
    if(config.vars){
      _.each(config.vars,function(value,key){
        mail.add_var(key,value);
      })
    }

    mail.send();
  }
};