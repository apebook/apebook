module.exports = function(validator){
    validator.extendCheck({
        //英文、-、数字
        isUri: function(str){
            return /^[0-9a-zA-Z][0-9a-zA-Z-]+[0-9a-zA-Z]$/.test(str);
        }
    })
};