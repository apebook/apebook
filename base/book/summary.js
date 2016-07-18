//从 git pull 的更新日志中分析出图书的更新内容
//demo
//remote: Compressing objects: 100% (3/3), done.
//    remote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 0
//Unpacking objects: 100% (3/3), done.
//    From https://github.com/apebook/guide
//    * branch            master     -> FETCH_HEAD
//ae3e24b..df47dbc  master     -> origin/master
//Updating ae3e24b..df47dbc
//Fast-forward
//SUMMARY.md | 2 ++
//1 file changed, 2 insertions(+)

var gitbookParsers = require('gitbook-parsers');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

//目录文件是否存在变更
function summaryHasChange(log){
    return /SUMMARY\.md/.test(log);
}

module.exports = {
    /**
     * 将目录字符串转成 json
     * @param summaryFilePath
     */
    json: function(summaryFilePath){
        return new Promise(function(r){
            var extension = path.extname(summaryFilePath);
            var content = fs.readFileSync(summaryFilePath, "utf-8");
            console.log(content);
            var parser = gitbookParsers.get(extension);
            return parser.summary(content).then(function(content){
                r(content);
            });
        });
    },
    /**
     * 获取变更内容
     * @param updateLog
     * @param newSummary
     * @param oldSummary
     */
    updateData: function(updateLog,newSummary,oldSummary){
        var summaryChange = summaryHasChange(updateLog);
        //目录不存在变更
        if(!summaryChange) return [];

        var newChapters = [];

        //遍历新的目录
        _.each(newSummary.chapters,function(chapter){
            var existChapter = false;
            var oldIndex = -1;

            _.each(oldSummary.chapters,function(oldChapter,i){
                if(chapter.title === oldChapter.title && chapter.path === oldChapter.path){
                    existChapter = true;
                    oldIndex = i;
                }
            });

            //老的目录不存在该章
            //就简单的，直接添加到变更数组
            if(!existChapter){
                chapter.status = 'add';
                //新增的章
                newChapters.push(chapter);
            }else{
                //已经存在相同的章内容
                //比对节
                var newArticles = [];
                _.each(chapter.articles,function(article){
                    var existArticle = false;
                    _.each(oldSummary[oldIndex].articles,function(oldArticle){
                        if(article.title === oldArticle.title && article.path === oldArticle.path){
                            existArticle = true;
                        }
                    });
                    if(!existArticle){
                        newArticles.push(article);
                    }
                });
                //如果存在变更的章节，添加到数组中
                if(newArticles.length){
                    newChapters.push({
                        //不需要显示章的内容
                        status: 'modify',
                        articles: newArticles
                    });
                }
            }
        });

        return newChapters;
    }
};