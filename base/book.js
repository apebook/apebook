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
        //确定绑定的仓库是否符合gitbook规范
        var isBook = yield this.isBook(user, book);
        if(!isBook){
            return {'success':false,'msg':'仓库不符合gitbook规范'};
        }
        yield fse.ensureDir(self.dest+user);
        var path = self.dest+user+'/'+book;
        yield fse.ensureDir(path);
        try{
            var output = yield shell.exec('gitbook build '+src+' --output='+path);
        }catch(e){
            console.log(e);
            output = '渲染失败，请检查目录格式';
        }
        console.log(output);
        //build 成功
        if(/Successfully built/.test(output)){
            return {'success':true};
        }else{
            return {'success':false,'msg':output};
        }
    },
    //将文件push到oss存储
    pushOss: function*(user,book,oss,bucket){
        var path = this.dest+user+'/'+book;
        return yield oss.dir(path,'./'+user+'/'+book,bucket);
    },
    //拉取代码
    pull: function *(book){
        var self = this;
        var user = book.userName;
        var bookName = book.uri;
        var output;
        //不存在目录用户，先予以创建
        yield fse.ensureDir(this.src+user);
        //不存在仓库目录，先予以创建，并clone 代码
        var src = self.bookPath(user,bookName);
        var isExist = yield fse.exists(src);
        yield fse.ensureDir(src);
        if(!isExist){
            //克隆仓库
            output = yield this.clone(githubUrl,src);
        }else{
            output = yield shell.exec('cd '+src+' && git pull origin master');
        }

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
    clone: function *(githubUrl, src){
        var result = yield shell.exec('cd '+src+' && git init && git remote add origin '+githubUrl);
        console.log(result);
        var output = yield shell.exec('cd '+src+' && git init && git pull origin master');
        console.log(output);
        return output;
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