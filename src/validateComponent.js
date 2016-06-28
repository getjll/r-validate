/**
 * 验证模块基类
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            typeof define === 'function' ? define(factory) :
                (global.validateComponent = factory());
}(this, function(){
    'use strict';
    if(!Regular){
        return
    }
    var dom = Regular.dom;
    var _ = Regular.util;
    var createMessageDOM = function(item, message){
        var elem = item.elem;
        var messageDOM = document.createElement('span');
        messageDOM.innerText = message;
        messageDOM.className = 'u-tip u-tip-error';
        item.messageDOM = messageDOM;
        elem.parentNode.insertBefore(messageDOM, elem.nextSibling);
        dom.addClass(elem,'has-error');
    };

    var updateMessage = function(messageDOM, message){
        messageDOM && messageDOM.innerText
        && messageDOM.innerText != message
        && (messageDOM.innerText = message);
    };

    var clearMessageDOM = function(item){
        var elem = item.elem;
        var messageDOM = item.messageDOM;
        item.messageDOM && dom.remove(messageDOM);
        item.messageDOM = null;
        dom.delClass(elem,'has-error');
    };

    var resultFn = function(result, item){
        var messageDOM = item.messageDOM;
        if (!result.success) {
            var message = result.message;

            !messageDOM? createMessageDOM(item, message):
                messageDOM.innerText != message? updateMessage(messageDOM, message): null;
        }else{
            messageDOM && clearMessageDOM(item);
        }
    };

    var isSimpleValidate = function(option){
        return option.rules && typeof option.rules == 'string';
    };

    var getRegisterGroup = function(name){
        return Validation.getRegisterGroupCache(name.rules);
    };

    var setValidateItem = function(item, value){
        var isSimple = isSimpleValidate(value);
        if(!isSimple){
            return;
        }
        var rules  = getRegisterGroup(value);
        if(!rules){
            rules = [{
                type: value.rules,
                message: value.message
            }];
        }
        item.rules = rules;
        item.useItemRules = true;
    };
    return Regular.extend({
        config: function () {
            _.extend(this.data, {
                //需要验证的节点列表
                validateList:[]
            });
            this.supr();

            var $outer = this.$outer;
            if($outer && $outer instanceof Validation) {
                $outer.controls.push(this);

                this.$on('destroy', function() {
                    var index = $outer.controls.indexOf(this);
                    $outer.controls.splice(index, 1);
                });
            }
        },
        /**
         * 遍历组件内需要验证的列表
         * @param unwantedValidation 是否不需要验证
         * @returns {{success: boolean}}
         */
        validate: function(unwantedValidation) {
            var conclusion = {
                success: true,
                message: ''
            };
            this.data.validateList.forEach(function(item){
                var elem = item.elem;
                var value = item.value;
                var rules = item.rules;
                var result = Validation.validate(value, rules, unwantedValidation);

                if (!result.success && !elem.disabled) {
                    conclusion.success = false;
                    conclusion.message = result.message;
                }
                resultFn(result, item);
            });
            return conclusion;
        }
    }).directive({
        /**
         * 用法 r-validate={{value: value, rules: rules}}
         * @param option {value: value, rules: []}
         *              value: 校验的数据
         *              rules: 验证的规则 Array
         */
        'r-validate': function(element, option){
            var item = {
                //验证值
                value: null,
                //验证规则
                rules: null,
                //提示信息节点
                messageDOM: null,
                elem: element
            };
            var data = this.data;
            var validateList = data.validateList;
            var optionValue = option.get(this);

            setValidateItem(item, optionValue);

            this.$watch(option, function(newValue, oldValue){
                var value = item.value = newValue.value;
                var rules = item.rules = item.useItemRules? item.rules: newValue.rules;
                //首次不验证
                if(oldValue === undefined){
                    validateList.push(item);
                    return;
                }

                //是否实时验证
                if(newValue.immediately){
                    var result = Validation.validate(value, rules);
                    resultFn(result, item);
                }

            }, true);

            //element销毁时会调用
            return function(){
                validateList.forEach(function(validateItem, index, _this){
                    if(validateItem === item){
                        clearMessageDOM(item);
                        _this.splice(index, 1);
                    }
                });
            }
        }
    });
}));
