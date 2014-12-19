//操作github仓库

var _ = require('./util');
var shell = require('./shell');
var mdFiles = require('./md-files');
var fs = require('fs');
var Github = module.exports = function(config){
    var self = this;
    if(config){
        _.each(config,function(value,key){
            self[key] = value;
        });
    }

};

Github.prototype = {
    //克隆一个库到本地
    clone: function*(user,name){
        var repoDir = this.repoDir;
        var repoPath = 'https://github.com/'+user + '/' + name + '.git';
        var output = yield shell.exec('cd '+ repoDir + ' && mkdir '+user+' && cd '+user+' && git clone ' + repoPath);
        this.body = output;
    },
    //拉取代码更新
    pull: function*(user,name){
        var repoDir = this.repoDir;
        var path = repoDir + '/' + user + '/' + name;
        var output = yield shell.exec('cd '+ path + '&& git pull');
        var data = {};
        //没有内容更新
        if(/Already up-to-date/.test(output)){
            return data;
        }

        var  modifyFiles = output.match(/(\S+\.md)\s+\|\s+\d+\s/g);
        if(!modifyFiles.length) return data;
        modifyFiles = modifyFiles.map(function(file){
            if(/(\S+\.md)\s+\|\s+\d+\s/.test(file)){
                return RegExp.$1;
            }
        });

        //var data = yield mdFiles(path,repoDir);
        return modifyFiles;
    }
};
