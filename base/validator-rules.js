module.exports = function(validator){
    validator.extendCheck({
        //英文、-、数字
        isUri: function(str){
            return /^[0-9a-zA-Z][0-9a-zA-Z-]+[0-9a-zA-Z]$/.test(str);
        },
        //密码，英文、数字
        isPassword: function(str){
            return /^[A-Za-z0-9]{6,22}$/.test(str);
        }
    })
};