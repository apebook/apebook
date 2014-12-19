//github oauth校验

module.exports = function (options){
    options = options || {};
    if (!options.clientID || !options.clientSecret || !options.callbackURL) {
        throw new Error('github auth need clientID, clientSecret and callbackURL');
    }
    var app = options.app;
    app.get('/github/login',function *(next){

    });
};