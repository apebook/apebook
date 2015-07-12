//书籍渲染库

var _ = require('underscore');
var shell = require('./shell');
var fse = require('co-fs-extra');
var fs = require('co-fs');
var defaultConfig = {
    src: 'book-md/',
    dest: 'book-html/'
};
var Book = module.exports = function (config) {
    var self = this;
    config = _.extend(defaultConfig,config);
    if (config) {
        _.each(config, function (value, key) {
            self[key] = value;
        });
    }
};

Book.prototype = {
    //渲染md成html
    render: function *(user, book) {
        var self = this;
        var src = self.bookPath(user,book);
        var dest = self.dest+path;
        var output = yield shell.exec('gitbook build '+src+' --output='+dest);
        //build 成功
        if(/Successfully built/.test(output)){
            return true;
        }else{
            return output;
        }
    },
    //拉取代码
    pull: function *(book){
        var self = this;
        var user = book.userName;
        var bookName = book.uri;
        var src = self.bookPath(user,bookName);
        var exists = yield fs.exists(src);
        if(!exists){
            return {success:false,msg:'该书籍目录不存在！'};
        }

        var output = yield shell.exec('cd '+src+' && git pull');
        //已经是最新
        if(/Already up-to-date/.test(output)){
            return {'success':true,'change':false,'msg':'不存在变更的内容'};
        }else{
//                From https://github.com/minghe/blog
//                    4683d29..c7b9663  master     -> origin/master
//                Updating 4683d29..c7b9663
//                Fast-forward
//                2015/auth.md | 145 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                    1 file changed, 145 insertions(+)
//                create mode 100644 2015/auth.md
            var data = [];
            //新增的节
            if(/create mode 100644 (.+)\.md/.test(output)){

            }
            return {'success':true,'change':true,data:data};
        }
    },
    //克隆仓库
    clone: function *(user, book){
        var self = this;
        var path = user + '/'+book;
        var repoPath = 'https://github.com/'+path + '.git';
        var src = self.src+user;
        //创建用户名目录
        yield fse.ensureDir(src);
        var output = yield shell.exec('cd '+ src + ' && git clone ' + repoPath);
        if(/Cloning into/.test(output)){
            return true;
        }else{
            return output;
        }
    },
    //github仓库是否符合book规范
    isBook: function *(user, book){
        var self = this;
        var src = self.bookPath(user,book);
        var hasBookJson = yield fs.exists(src + '/book.json');
        var hasReadme = yield fs.exists(src + '/README.md');
        var hasSummary = yield fs.exists(src + '/SUMMARY.md');
        return hasBookJson && hasReadme && hasSummary;
    },
    bookPath: function(user, book){
        var path = user + '/'+book;
        return this.src + path;
    },
    //获取章节摘要
    sectionRemark: function *(path){
        var sectionPath = this.bookPath + '/'+path;
        var content = yield fs.readFile(sectionPath);
    }
};