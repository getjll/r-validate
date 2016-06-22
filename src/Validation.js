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

                if(rule.type === 'isRequired')
                    rule.success = !!value;
                else
                    rule.success = rule.method(value);

                if(!rule.success && result.success) {
                    result.success = false;
                    result.message = rule.message;
                }
            });
        }
        return result;
    };
    return Validation;
}));