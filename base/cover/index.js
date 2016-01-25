var createCover = require('./draw');
var resize = require('./lib/resize');
module.exports = {
    /**
     * 生成封面
     * @param output
     * @param config
     * {
            "title": "My Book",
            "author": "Author",
            "font": {
                "size": null,
                "family": "Impact",
                "color": "#FFF"
            },
            "size": {
                "w": 1800,
                "h": 2360
            },
            "background": {
                "color": "#09F"
            }
        }
     * @returns {Promise}
     */
    render: function(output,config){
        return createCover(output,config).then(function(result){
            if(result){
                //生成小图
                return resize(output,output.replace('cover.jpg','cover_small.jpg'),{width:config.size.w/2,height:config.size.h/2});
            }
        });
    }
};