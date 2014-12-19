[Koa.js][1]是下一代的node.js框架，由Express团队开发，通过生成器（generators JavaScript 1.7新引入的，用于解决回调嵌套的方案），减少异步回调，提高代码的可读性和可维护性，同时改进了错误处理（Express的错误处理方式相当糟糕）。

Koa非常小，只有550的代码(ps：这个数字不准，只要知道Koa很精巧即可)，但依旧提供了web应用常用的一整套方法，同时拥有强悍的拓展性。

（PS:阿里几个前端团队已经在做基于Koa的上层应用框架，虽然目前Express仍然是主流，相信Koa才是未来。）

## Installing Node

由于使用了JavaScript 1.7得新特性，所以Koa要求Node版本至少在 **0.11.x** 以上。

推荐安装 [n][2] 模块，可以使用Node版本之间的切换。

    sudo npm install -g n
    sudo n stable
    

（ps：stable 使用最新稳定的Node版本）

node 命令运行js文件脚本时，需要加上参数 **--harmony**。

比如运行app.js，使用如下命令：

    node --harmony app.js
    

为了日后运行方便，可以设置个别名：

    alias nod="node --harmony"
    

这样日后运行，依旧只要使用：

    node app.js
    

教程下面所有的代码都可以在bhanuc的[github][3]中找到。

（PS：按照国际惯例，接下来应该有个 Hello world 环节，但要讲清楚Koa，必须先讲清楚Generators）。

## 什么是Generators？

generators是ES-6非常重要的部分，如果你有 Lua, Python, Scheme, Smalltalk 使用 generators的经验，那么你可以快速上手。

定义一个 generator 函数：

    var generator_func = function* () { };
    

接下来我们要用到 **yield**关键字，用于停止执行和保存当前的堆栈。

我们通过一个数字的例子来演示其用法：

    var r = 3;
    
    function* infinite_ap(a) {
        for( var i = 0; i < 3 ; i++) {
            a = a + r ;
            yield a;
        }
    }
    
    var sum = infinite_ap(5);
    
    console.log(sum.next()); // returns { value : 8, done : false }
    console.log(sum.next()); // returns { value : 11, done: false }
    console.log(sum.next()); // returns { value : 14, done: false }
    console.log(sum.next()); //return { value: undefined, done: true }
    

infinite_ap generator定义了一个执行3次的循环，每次执行，给a变量加3。

yield a 会暂停执行并保存当前堆栈，返回当前的a。

当第一次调用 **sum.next()** 时 返回的a变量值是5 + 3，同理第二次调用 **sum.next()** ，a变量值是8 +3，知道循环执行结束，返回**done:true**标识。

（PS:更详细的Generators介绍请看[《使用 (Generator) 生成器解决 JavaScript 回调嵌套问题》][4]）

## 安装 Koa

sudo npm install koa --save

安装成功后，我们来个 Hello World ,app.js内容如下：

    var koa = require('koa');
    var app = kao();
    
    app.use(function *(){
        this.body = "Hello World !!!";
    });
    
    app.listen(3000);
    

运行 **node --harmony app.js** 后访问<http://localhost:3000> 试试，页面打印出了"Hello World !!!"，就是这么简单！

## Koa 的控制流

Koa是一个包含了一个生成器中间件（middleware generator）函数数组的对象，而每个generator的执行顺序是流的关键。

    var koa = require('koa');
    var app = koa();
    
    app.use(function* (next) {
        //在流到下一个generator前执行
        //顺序1
        console.log("A");
        yield next;
    
        //留意这是最后执行，因为是在upstream的最后一个事件
        // 顺序6
        console.log("B");
    });
    
    app.use(function* (next) {
        // 顺序2
        console.log("C");
    
        yield next;
    
        // 顺序5
        console.log("D");
    });
    
    app.use(function* () {
        // 顺序3
        console.log("E");
        this.body = "hey guys";
        // 顺序4
        console.log("F");
    
    });
    
    app.listen(3000);
    

**yield next;** 前是 downstreaming，回调向下执行，当执行结束后，开始 upstreaming ，会向上执行yield next; 后的逻辑。

所以上面代码打印的结果是 **A-B-C-D-E-F**。

（ps：koa.use(function)会向应用注入个中间件。）

## 结尾

这是 JavaScript generators 和 Koa.js 第一部分的全部内容，generators 是学习和使用 Koa.js 的先决条件。

下一篇的教程，我们将深入学习Koa.js，并使用Koa.js创建个简单应用。

原文链接：[《Introduction to Generators & Koa.js: Part 1》][5]

 [1]: http://koajs.com/
 [2]: https://www.npmjs.org/package/n
 [3]: https://github.com/bhanuc/koa-article
 [4]: http://huangj.in/765
 [5]: http://code.tutsplus.com/tutorials/introduction-to-generators-koajs-part-1--cms-21615