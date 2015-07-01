module.exports = {
    create: function *(){
        var data = {title:'选择创建书籍的方式',type:'select'};
        yield this.html('new',data);
    }
};