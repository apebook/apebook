var parse = require('co-body');
var _ = require('../base/util');
var urllib = require('co-urllib');

//书籍相关的路由
module.exports = function(app){
    var mBook = app.model.book;
    var mCat = app.model.cat;
    var config = app.config;
    //选择创建书籍的方式
    app.get('/new',function *(){
        var data = {title:'选择创建书籍的方式'};
        yield this.render('new',data);
    });
    //关联github
    app.get('/new/github',function *(){
        var data = {title:'创建一本新书'};
        data.cats = yield mCat.list();
        var query = this.request.query;
        if(query.error){
            data.error = query.error;
        }

        if(query.user && query.repo){
            var user = this.session['user'];
            if(!user){

            }
            //不是github登陆的用户
            if(!user.login === query.user){

            }

            var api = 'https://api.github.com/repos/'+user.login+'/'+query.repo;
            var authOptions = {
                dataType: 'json'
            };
            var result = yield urllib.request(api, authOptions);
            data = result.data;
            this.session.book = {
                description : data.description,
                html_url: data.html_url,
                forks_count: data.forks_count,
                stargazers_count: data.stargazers_count,
                watchers_count: data.watchers_count,
                updated_at: data.updated_at,
                user: user.login,
                repo: query.repo
            };
            this.redirect('/new/direct');
        }
        yield this.render('association-github',data);
    });

    app.post('/new/github',function *(){
        var body = yield parse(this, { limit: '1kb' });
        var user = body.user;
        var repo = body.repo;
        if(!user || !repo){
            this.redirect('/new/github?error='+'github用户名或仓库名不可以为空');
        }

        var callbackURL = this.url+'?user='+user + '&repo='+repo;
        var router = config.githubPath+callbackURL;
        this.redirect(router);
    });

    //创建书籍表单页面
    app.get('/new/direct',function *(){
        var data = {title:'创建一本新书'};
        data.cats = yield mCat.list();
        var query = this.request.query;
        if(query.error){
            data.error = query.error;
        }
        if(this.session.book){
            data = _.extend(data,this.session.book);
            delete this.session.book;
        }
        yield this.render('new-direct',data);
    });

    //创建书籍
    app.post('/new',function *(){
        var body = yield parse(this, { limit: '1kb' });
        var data = yield mBook.post(body);
        //出错了，跳转到表单创建页面
        if(!data.success){
            this.redirect('/new?error='+data.msg);
        }else{
            if(body.user && body.repo){
                var api = 'https://api.github.com/repos/'+body.user+'/'+body.repo+'/hooks';
                var authOptions = {
                    type:'post',
                    data:{
                        events: ["push","pull_request"],
                        name: "web",
                        active: true,
                        config: {
                            "url":"http://www.apebook.org/api/github/hook",
                            "content_type":"json"
                        }
                    },
                    dataType: 'json'
                };
                var result = yield urllib.request(api, authOptions);
                body.hook = true;
                yield mBook.post(body);
            }
            //跳转到我的书籍
            this.redirect('/'+body.name+'/dashboard');
        }
    });
    //书籍控制台
    app.get('/:name/dashboard',function*(){
        var self = this;
        var params = self.params;
        var bookName = params['name'];
        var data = yield mBook.get(bookName);
        yield this.render('book-dashboard',data);
    });
};