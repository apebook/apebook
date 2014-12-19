# 像写NodeJs一样写KISSY代码

Kissy的模块代码需要Kissy.add()的包裹，比如：

    KISSY.add(function (S, Node) {
        var $ = Node.all;
    }, {
        requires: ['node']
    });
    
也可以接近CMD的写法：

    KISSY.add(function (S, require) {
        var $ = require('node').all;
    });
    

但还是看着不爽，完全CMD模块的写法:

    var $ = require('node').all;    
    var Demo = function(){};
    module.exports = Demo;
    

去掉add()包裹神清气爽，基本与写NodeJs的体验一样啦~

当然这样的代码无法在浏览器环境中运行...

我们需要个工具帮我们将上述的代码编译成带KISSY.add()的代码，比如将上面代码编译成：

    KISSY.add('demo/index',["node"],function(S ,require, exports, module) {
        var $ = require('node').all;
        var Demo = function(){};
        module.exports = Demo;
    });
    

淘杰同学开发了个[gulp-kmc][1]（gulp插件），就可以满足上述需求。

    npm install --save-dev gulp-kmc
    

引用gulp依赖和配置变量：

    var gulp = require('gulp');
    var kmc = require('gulp-kmc');
    var src = ".",
        dest = "./build";
    
    //包配置
    var pkg = "demo";
    

配置kmc插件：

    kmc.config({
        depFilePath:dest+'/mods.js',
        packages:[{
            name: pkg,
            ignorePackageNameInUri:true,
            combine:false,
            base: src
        }]
    });
    

配置kmc任务：

    gulp.task('kmc', function() {
        gulp.src(src+"/index.js")
            //转换cmd模块为kissy模块
            .pipe(kmc.convert({
                fixModuleName:true,
                ignoreFiles: ['-min.js']
            }))
            //合并文件
            .pipe(kmc.combo({
                minify: true,
                ext:"-min.js",
                files:[{
                    src: src+'/index.js',
                    dest: dest+'/index.js'
                }]
            }))
            .pipe(gulp.dest(dest));
    });
    

配置default任务：

    gulp.task('default', ['kmc']);
    

自动监听js文件改变，打包文件：

    gulp.task('watch', function() {
        gulp.watch(src+'/**/*.js', ['kmc']);
    });
    

### demo代码：

    var S = KISSY;
    if (S.Config.debug) {
        var debugPath = "../build";
        S.config({
            packages:[
                {
                    name:"demo",
                    path:debugPath,
                    charset:"utf-8",
                    ignorePackageNameInUri:true
                }
            ]
        });
    }
    

调试的包配置路径不能配置到源码，只能配置到编译后的文件。

 [1]: https://www.npmjs.org/package/gulp-kmc