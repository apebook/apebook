//书籍渲染库

var _ = require('underscore');
var shell = require('./shell');
var fse = require('co-fs-extra');
var fs = require('co-fs');
var marked = require('marked');
var defaultConfig = {
    src: 'book-md/',
    dest: 'book-html/',
    themes:{
        apebook:'./theme/apebook',
        blog:'./theme/blog'
    }
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
    render: function *(theme) {
        var self = this;
        var user = this.user;
        var book = this.book;
        var src = self.bookPath();
        //确定绑定的仓库是否符合gitbook规范
        var isBook = yield this.isBook();
        if(!isBook){
            return {'success':false,'msg':'仓库不符合gitbook规范'};
        }
        yield fse.ensureDir(self.dest+user);
        var path = self.dest+user+'/'+book;
        yield fse.ensureDir(path);
        try{
            var bookJson = yield fse.readFile(src+'/book.json');
            if(!bookJson){
                return {'success':false,'msg':'不存在book.json'};
            }
            bookJson = JSON.parse(bookJson);
            bookJson.theme = theme || this.themes['apebook'];
            bookJson.output = path;
            var data = this.data;
            bookJson.githubUser = data.githubUser;
            bookJson.githubRepo = data.githubRepo;
            bookJson.bookId = data.id;
            bookJson.apebookHost = this.apebookHost;
            if(self.env !== 'local'){
                bookJson.localAssetHost = bookJson.assetHost;
            }
            yield fse.writeFile(src+'book.json',JSON.stringify(bookJson));
            var output = yield shell.exec('gitbook build '+src);
            yield shell.exec('cd '+src+' && ' +'git reset --hard');
        }catch(e){
            console.log(e);
            output = '书籍渲染失败';
        }
        console.log(output);
        //build 成功
        if(/Done, without error/.test(output)){
            return {'success':true};
        }else{
            return {'success':false,'msg':output};
        }
    },
    //将文件push到oss存储
    pushOss: function*(){
        var user = this.user;
        var book = this.book;
        var oss = this.oss;
        var bucket = this.bucket;
        var path = this.dest+user+'/'+book;
        return yield oss.dir(path,'./'+user+'/'+book,bucket);
    },
    //拉取代码
    pull: function *(){
        var self = this;
        var user = this.user;
        var bookName = this.book;
        var output;
        //不存在目录用户，先予以创建
        yield fse.ensureDir(this.src+user);
        //不存在仓库目录，先予以创建，并clone 代码
        var src = self.bookPath();
        var isExist = yield fse.exists(src);
        yield fse.ensureDir(src);
        if(!isExist){
            //克隆仓库
            output = yield this.clone(this.githubUrl,src);
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
    isBook: function *(){
        var self = this;
        var src = self.bookPath();
        var hasBookJson = yield fs.exists(src + '/book.json');
        var hasReadme = yield fs.exists(src + '/README.md');
        var hasSummary = yield fs.exists(src + '/SUMMARY.md');
        return hasBookJson && hasReadme && hasSummary;
    },
    bookPath: function(){
        var user = this.user;
        var book = this.book;
        var path = user + '/'+book;
        return this.src + path;
    },
    //书籍介绍
    readMe: function*(){
        var src = this.bookPath();
        var url = src + '/' + 'README.md';
        return yield this.renderMd(url);
    },
    //书籍章节
    summary: function*(){
        var src = this.bookPath();
        var url = src + '/' + 'SUMMARY.md';
        return yield this.renderMd(url);
    },
    //章节数
    chapterCount: function*(){
        var src = this.bookPath();
        var url = src + '/' + 'SUMMARY.md';
        var exist = yield fs.exists(url);
        if(!exist) return 0;
        var content = yield fs.readFile(url);
        content = content.toString();
        return content.split('*').length-1;
    },
    //渲染md文件成html
    renderMd: function*(url){
        if(!url) return '';
        var exist = yield fs.exists(url);
        if(!exist) return '';
        var data = yield fs.readFile(url);
        data = data.toString();
        var tokens = marked.lexer(data);
        return marked.parser(tokens);
    }
};