//书籍渲染库

var _ = require('underscore');
var shell = require('./shell');
var fse = require('co-fs-extra');
var fs = require('co-fs');
var marked = require('marked');
var Gitbook = require('gitbook').Book;
var moment = require('moment');
//生成封面
var cover = require('./cover/index');

//默认配置
var defaultConfig = {
    src: 'book-md/',
    dest: 'book-html/',
    themes:{
        apebook:'./theme/apebook',
        blog:'./theme/blog'
    },
    //默认启用的插件
    "plugins": ['-search']
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
    render: function *(config) {
        var self = this;
        var ctx = self.ctx;
        var user = this.user;
        var book = this.book;
        var src = self.bookPath();
        var hasSrc = yield fs.exists(src);
        if(!hasSrc){
            return {'success':false,'msg':'不存在 '+book+' 目录'};
        }
        //确定绑定的仓库是否符合gitbook规范
        var isBook = yield this.isBook();
        if(!isBook){
            return {'success':false,'msg':'仓库不符合gitbook规范'};
        }
        yield fse.ensureDir(self.dest+user);
        var path = self.dest+user+'/'+book;
        yield fse.ensureDir(path);
        //图书配置
        var bookJson = {};
        bookJson.theme = config && config.theme || self.themes['apebook'];
        bookJson.output = path;
        var data = this.data;
        bookJson.githubUser = data.githubUser;
        bookJson.githubRepo = data.githubRepo;
        bookJson.bookId = data.id;
        bookJson.bookName = book;
        bookJson.apebookHost = this.apebookHost;
        bookJson.assetHost = this.assetHost;
        bookJson.desc = data.desc;
        //本地调试环境
        if(process.env.NODE_ENV !== 'local'){
            bookJson.localAssetHost = bookJson.assetHost;
        }

        bookJson.plugins = this.plugins;
        yield fse.writeFile(src+'/book.json',JSON.stringify(bookJson));
        ctx.log(bookJson);
        ctx.log('src ' + src);
        ctx.log('dest ' + path);
        var gitbook = new Gitbook(src, {
            'config': {
                'output': path
            }
        });
        var output = yield this.generate(gitbook);
        ctx.log(output);
        yield shell.exec('cd '+src+' && ' +'git reset --hard');
        //删除生成的无用的gitbook目录
        yield shell.exec('cd '+path+' && ' +'rm -rf -r gitbook');
        if(output === true){
            ctx.log('build ok!');
            return {'success':true};
        }else{
            ctx.error(output);
            return {'success':false,'error':output};
        }
    },
    generate: function(gitbook){
        return new Promise(function(resolve){
            gitbook.parse().then(function() {
                return gitbook.generate('website');
            }).then(function(){
                resolve(true);
            }).catch(function(err){
                resolve(err);
            });
        });
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
            return {'success':true,'change':false,'msg':'不存在变更的内容',output:output};
        }else{
            return {'success':true,'change':true,output:output};
        }
    },
    //克隆仓库
    clone: function *(githubUrl, src){
        var result = yield shell.exec('cd '+src+' && git init && git remote add origin '+githubUrl);
        console.log(result);
        var output = yield shell.exec('cd '+src+' && git pull origin master');
        console.log(output);
        return output;
    },
    //github仓库是否符合book规范
    isBook: function *(){
        var self = this;
        var src = self.bookPath();
        var hasReadme = yield fs.exists(src + '/README.md');
        var hasSummary = yield fs.exists(src + '/SUMMARY.md');
        return hasReadme && hasSummary;
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
    summary: function*(format){
        var src = this.bookPath();
        var url = src + '/' + 'SUMMARY.md';
        if(format && format === 'json'){
            return yield Summary.json(url);
        }else{
            return yield this.renderMd(url);
        }
    },
    /**
     * 图书更新的章节内容
     * @param updateLog
     * @param oldSummary
     */
    updateChapters: function*(updateLog,oldSummary){
        //var newSummary = yield this.summary('json');
        //yield Summary.updateData(updateLog,newSummary,oldSummary);
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
    },
    /**
     * 封面
     *
     */
    cover: function*(coverinfo,bookData,userData){
        var data = bookData;
        var user = data.userName;
        var book = data.uri;
        var output = this.dest+user+'/'+book+'/cover.jpg';
        var config = {
            title: data.name,
            author:userData && userData.nick || data.userName,
            bg:{},
            "size": {
                "w": 400,
                "h": 540
            }
        };

        //更新时间
        //不存在，使用创建时间
        if(data.updateTime){
            config.update = moment(Number(data.updateTime)).format('YYYY-MM-DD')+ ' update';
        }else{
            config.update = moment(Number(data.create)).format('YYYY-MM-DD')+ ' create';
        }


        if(coverinfo){
            //背景颜色
            if(coverinfo.color){
                config.bg.color = coverinfo.color;
            }

        }else{

            var bgColors = ['#7c8577','#999d9c','#9d9087','#74787c','#4f5555',
                '#6c4c49','#563624','#3e4145','#3c3645','#281f1d','#2f271d',
                '#1b315e','#596032','#ad8b3d'];

            var colorIndex = (parseInt(Math.random()*(14-1)+1))-1;
            config.bg.color = bgColors[colorIndex];
        }

        //是否存在封面背景图片
        var coverBg = this.src +user+'/'+book + '/' +'cover-bg.jpg';
        var existCoverBg = yield fse.exists(coverBg);
        if(existCoverBg){
            config.bg.image = coverBg;
        }
        try{
             yield cover.render(output,config);
        }catch(e){
            console.log(e);
            return false;
        }

        var path = user+'/'+book+'/cover.jpg';

        //返回封面数据
        return {
            ossPath: path,
            color: config.bg.color
        };
    }
};