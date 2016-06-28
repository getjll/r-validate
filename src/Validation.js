/**
 * Validation 统一收集验证模块 以便一次调用
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            typeof define === 'function' ? define(factory) :
                (global.Validation = factory());
}(this, function(){
    'use strict';
    if(!Regular){
        return new Throw('Regular is undefined');
    }
    var _ = Regular.util;
    var Validation = Regular.extend({
        name: 'validation',
        template: '{#inc this.$body}',
        config: function () {
            // 验证模块
            this.controls = [];
            _.extend(this.data, {});
            this.supr();
        },
        /**
         * 遍历收集的子组件
         * @param unwantedValidation 不需要验证
         * @returns {{results: Array, success: boolean, message: string}}
         */
        validate: function (unwantedValidation) {
            var conclusion = {
                results: [],
                success: true,
                message: ''
            };

            this.controls.forEach(function (control) {
                var result = control.validate(unwantedValidation);
                conclusion.results.push(result);
                if (!result.success) {
                    conclusion.success = false;
                    conclusion.message = conclusion.message || result.message;
                }
            });

            return conclusion;
        }
    });
    var registerValidateCache = {};
    /**
     * 注册的验证方法
     * @param name  验证的方法名
     * @param validateMethod  具体验证的方法
     * @param message  验证失败时的提示信息
     * @returns {*}
     */
    Validation.register = function(name, validateMethod, message){
        var type = _.typeOf(name);
        if(type === 'object'){
            for(var key in name){
                if(name.hasOwnProperty(key)){
                    Validation.register(key, name[key].method || name[key], name[key].message);
                }
            }
            return;
        }
        if(!name){
            throw Error('register name is required');
        }
        if(_.typeOf(validateMethod) !== 'function'){
            throw Error(name + " method is'not function");
        }
        if(type === 'string' && registerValidateCache[name]){
            return registerValidateCache[name];
        }
        registerValidateCache[name] = {
            method: validateMethod,
            message: message || ''
        };
    };


    Validation.register({
        isRequired: {
            method: function(value){
                return !!(value);
            },
            message: '不可为空'
        },
        isEmail: {
            method: function(value){
                return !value || /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value);
            },
            message: '邮箱格式不正确'
        }
    });

    var registerGroupValidateCache = {};
    Validation.registerGroup = function(name, option){
        if(!name || _.typeOf(name) !== 'string'){
            throw Error('First arguments name is required and String');
        }
        var typeOption = _.typeOf(option);
        if(typeOption !== 'object'){
            throw Error('Second arguments is required and Object');
        }
        var registerGroup = registerGroupValidateCache[name];
        if(registerGroup){
            return registerGroup;
        }
        var cache = registerGroupValidateCache[name] = [];
        var item = null;
        var registerCache = null;
        var message = '';
        var method = function(){};
        var itemType = '';
        for(var key in option){
            if(option.hasOwnProperty(key)){
                item = option[key];
                itemType = _.typeOf(item);
                registerCache = registerValidateCache[key];
                if(itemType === 'boolean'){
                    if(registerCache){
                        message = registerCache.message;
                        method = registerCache.method;
                    }else{
                        throw Error(item.name + 'is no register');
                    }
                }else if(itemType === 'object'){
                    message = item.message?item.message:registerCache.message;
                    method = item.method?item.method:registerCache.method;
                }
                cache.push({
                    method: method,
                    message: message
                })
            }
        }
    };
    Validation.getRegisterGroupCache = function(name){
        return registerGroupValidateCache[name];
    };
    Validation.registerGroup('isRequired&&isEmail' ,{
        isRequired: true,
        isEmail: true
    });

    /**
     * 验证的方法
     * @param value  需要验证的值
     * @param rules  验证的规则列表 {type: type, message: ''} or {method: function(){},message}
     * @param unwantedValidation  不需要验证  用于移除页面已经验证出现提示dom
     * @returns {{success: boolean, message: string}}
     */
    Validation.validate = function (value, rules, unwantedValidation) {
        var result = {
            success: true,
            message: ''
        };
        if(!unwantedValidation){
            rules.forEach(function (rule) {
                rule.success = true;
                var type = rule.type;
                var vailidate = registerValidateCache[type];
                var message = rule.message;
                if(!vailidate && type){
                    throw Error(type + ' is no register');
                }

                var method = _.typeOf(rule.method) === 'function'? rule.method:
                            vailidate && _.typeOf(vailidate.method) === 'function' ? vailidate.method: function(){};
                message = message || vailidate.message;
                rule.success = method(value);

                if(!rule.success && result.success) {
                    result.success = false;
                    result.message = message;
                }
            });
        }
        return result;
    };
    return Validation;
}));