var Canvas = require('canvas');

var canvas = new Canvas(200, 270);
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, width, height);

ctx.fillStyle = "#000";
ctx.font = '48px';
ctx.fillText("测试", 10, 50);

// Create streams
var out = fs.createWriteStream('../lris-koa-demo/public/test.jpg');
var stream = canvas.jpegStream();

stream.on('data', function(chunk){
    console.log(chunk);
    out.write(chunk);
});
