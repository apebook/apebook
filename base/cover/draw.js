var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Canvas = require('canvas');
var titleParts = require('./lib/titleparts');

module.exports = function(output, options) {

    return new Promise(function(resolve,reject){
        options = _.defaults(options || {}, {
            "title": "",
            "author": "",
            "update":"",
            "font": {
                "family": "Arial",
                "color": '#fff'
            },
            "size": {
                "w": 400,
                "h": 540
            },
            "bg":{
                color: '#7c8577'
            }
        });

        var fontColor = options.font.color;
        var w = options.size.w;
        var h = options.size.h;

        var canvas = new Canvas(w, h);
        var Image = Canvas.Image;
        var ctx = canvas.getContext('2d');
        //服务器环境加载字体
        if(process.env.NODE_ENV !== 'local'){
            var Font = Canvas.Font;
            var cnFont = new Font('cnFont', './heiti.ttf');
            cnFont.addFace('./heiti.ttf',   'bold');
            cnFont.addFace('./heiti.ttf', 'normal', 'italic');
            cnFont.addFace('./heiti.ttf', 'bold', 'italic');
            ctx.addFont(cnFont);
        }

        //背景颜色
        ctx.fillStyle = options.bg.color;
        ctx.fillRect(0, 0, w, h);

        //背景图片
        if(options.bg.image){
            var p = path.resolve(__dirname,'../../',options.bg.image);
            var bgImage = fs.readFileSync(p);
            var img = new Image();
            img.src = bgImage;
            ctx.drawImage(img, 0, 0, w, h);
        }

        //主标题
        ctx.fillStyle = fontColor;
        ctx.font = '40px bold Arial';
        var title = options.title;
        var tParts = titleParts(
            title,
            'Arial',
            360,
            50
        );
        var y = 150;
        tParts.map(function(t){
            ctx.fillText(t, 40, y);
            y += 70;
        });

        ctx.fillStyle = fontColor;
        ctx.font = '30px bold Arial';
        ctx.textAlign = 'right';
        //作者
        ctx.fillText(options.author, 360, 400);
        //更新时间
        ctx.fillText(options.update, 360, 440);

        //底部 logo
        ctx.fillStyle = '#57b593';
        ctx.fillRect(0, 480, w, 60);
        ctx.textAlign = 'left';
        ctx.fillStyle = fontColor;
        ctx.fillText("apebook", 70, 520);

        var apebook = fs.readFileSync(__dirname+'/apebook.png');
        var img = new Image();
        img.src = apebook;
        ctx.drawImage(img, 20, 490, 40, 40);

        var out = fs.createWriteStream(output);
        var stream = canvas.jpegStream();

        stream.on('data', function(chunk){
            out.write(chunk);
        });

        stream.on('end', function(){
            resolve(true);
        });
    });
};
