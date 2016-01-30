var fs = require('fs');
var Canvas = require('canvas');
var path = require('path');

function resize(jpgPath, output, nSize) {

    return new Promise(function(resolve,reject) {
        try{
            var input = path.resolve(__dirname,'../../../',jpgPath);
            var img = new Canvas.Image();

            img.onload = function(){
                if (!nSize.height) nSize.height = (img.height*nSize.width)/img.width;
                var canvas = new Canvas(nSize.width, nSize.height);
                var ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(img, 0, 0, nSize.width, nSize.height);

                var out = fs.createWriteStream(output);
                var stream = canvas.createJPEGStream();

                stream.on('data', function(chunk){
                    out.write(chunk);
                });
                stream.on('end', function() {
                    console.log('resize success');
                    resolve(true);
                });
            };

            // WARNING:
            // This is a hack to fix "Premature end of JPEG file" errors
            // Basically that error happens because data isn't flushed to the disk
            // By doing this setTimeout, we are forcing Node to go back to it's event loop
            // where it finishes the I/O and flushes the data to disk
            setTimeout(function() {
                img.src = input;
            }, 0);
        }catch(err){
            console.log('resize error');
            console.log(err);
            resolve(false);
        }

    });
}

module.exports = resize;
