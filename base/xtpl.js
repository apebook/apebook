var xtpl = require('xtpl/lib/xtpl');
var Path = require('path');
var _ = require('./util');
var moment = require('moment');

function xtplRender(path, data) {
    return function (done) {
        xtpl.renderFile(path, data, done);
    };
}

module.exports = {
    render: function(app, option){
        var views = option.views;
        var extname = option.extname || 'xtpl';
        //添加自定义命令扩展
        this.command(xtpl);

        function *render(path, data, opt) {
            var html = yield xtplRender(Path.resolve(views, path + '.' + extname), data);
            if (!opt || opt.write !== false) {
                this.type = 'html';
                this.body = html;
            }
            return html;
        }

        app.context.render = render;
        return app;
    },
    //自定义命令扩展
    command: function(xtpl){
        //最近时间
        xtpl.XTemplate.addCommand('nearestTime',function(scope, option){
            var time = Number(option.params[0]);
            if(!time) return '';
            return moment(time).fromNow();
        })
    },
    html: function*(path, data){
        data = _.extend({},data,this.config);
        //错误信息
        var errors = this.session._errors;
        data.errors = {};
        if(errors){
            data.errors = errors;
            delete this.session._errors;
        }
        //存在表单提交的数据
        var body = this.session._body || {};
        if(body){
            data.body = body;
            delete this.session._body;
        }
        //用户session
        data.user = this.session.user;
        data.githubUser = this.session[this.config.github.userKey] || {};
        //页面标题
        if(this.title) data.title = this.title;
        yield this.render(path, data);
        return true;
    }
};
