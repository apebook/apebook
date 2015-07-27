var _ = require('../base/util');
var ctlUser = require('../controller/user');
var check = require('../base/check-middleware');

module.exports = function(app) {

    //上传头像
    app.post('/api/avatar',check.apiLogin,ctlUser.avatar);
};