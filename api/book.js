//书籍相关的api
var _ = require('../base/util');
var shell = require('../base/shell');
var BookCtrl = require('../base/book');

var ctlBook = require('../controller/book');
var check = require('../base/check-middleware');
module.exports = function(app){
    var bookCtrl = new BookCtrl();
    //更新书籍信息
    app.post('/api/book/post',check.apiLogin,check.apiPostBookExist,ctlBook.post);

    //书籍封面
    app.post('/api/book/cover',check.apiLogin,ctlBook.cover);

    //同步书籍
    app.post('/api/book/sync',check.apiPostBookExist,function *(){
        var body = yield this.request.body;
        var id = body.id;
        this.log('[/api/book/sync] :');
        this.log(body);
        var mBook = this.model.book;
        var book = this.book;
        //没有绑定github仓库
        if(!book.bindGithub){
            _.error.bind(this)('请先绑定github仓库');
            return false;
        }
        var pullResult = yield bookCtrl.pull(book);
        if(!pullResult.success){
            this.error(pullResult);
        }else{
            //存在文件变更，渲染html
            if(pullResult.change){
                var renderResult = yield bookCtrl.render(book.userName,book.uri);
                //渲染失败
                if(!renderResult.success){
                    this.error(renderResult);
                    pullResult =  renderResult;
                }else{
                    //渲染成功后，将文件上传到oss
                    // var renderResult = yield bookCtrl.render(book.userName,book.uri);
                    var result = yield bookCtrl.pushOss(book.userName,book.uri,this.oss,this.config.ossBuckets.book);
                    this.log('upload to oss :');
                    this.log(result);
                    //最新更新时间写入数据库
                    yield mBook.post({id:id,updateTime:_.now()});
                }
            }
        }
        this.body = pullResult;
    });


};