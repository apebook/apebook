var Node = require('node');
var $ = Node.all;

//步骤条
var Stepbar = require('kg/stepbar/2.1.0/index');
require('kg/stepbar/2.1.0/stepbar.css');
var step1 = new Stepbar('#J_Stepbar',{color:'blue'});
step1.render();

//消息通知
var VcNotifications = require('kg/vc-notifications/1.0.2/index');
var notify = new VcNotifications({boxEffect: 'rs',boxCls:'warning'});

$('.J_GithubAsso').on('click',function(){
    notify.notify('正在为您跳转github授权页面，请耐心等待^_^');
});