//要注意循环体内部的程序段的性能（尽量使用原生操作，采用性能较高的方法实现）
//要注意JQuery的隐式循环,容易导致重复的使用循环操作，有多层循环（多于1层）时就要考虑优化
//要注意 用局部变量保留对象的属性、外部变量的值、选择器取得的对象，从而避免多次查找的损耗
//最后的手段，使用延迟加载“提高”使用性
//编程时对象的生命周期要时刻注意
(function ($) {

  "use strict ";

var MultiSelect = function(element, options) {
    this.options = options;
    this.$element = $(element);
    this.selectablerowcache = [];
    this.selectionrowcache = [];
    this.$container = $('<div>', {
        'class': 'ms-container'
    });
    this.$input = $('<input>', {
        'class': 'ms-input',
        'type': 'text',
        'readonly': 'true',
        'placeholder':'请选择...'  
    });
    this.$selectableHeader = $('<input>', {
        'class': 'search-input',
        'type': 'text',
        'autocomplete':'off',
        'placeholder':'请输入过滤待选项...'
    });
    this.$selectionHeader = $('<input>', {
        'class': 'search-input',
        'type': 'text',
        'autocomplete':'off',
        'placeholder':'请输入过滤待选项...'
    });
    this.$insertButtonContainer = $('<div>', {
        'style': 'position: absolute;top: 35%;left: 42%;'
    });
    this.$removeButtonContainer = $('<div>', {
        'style': 'position: absolute;top: 48%;left: 42%;'
    });
    this.$insertButton = $("<button onmouseout = \"this.className = 'ms-Button';\" onmouseover=\"this.className = 'ms-ButtonOver';\" class=\"ms-Button\" title=\"将选定的项目添加至您的选择\" type=\"button\"><span>插入</span><img width=\"16\" height=\"16\" border=\"0\" align=\"top\" class=\"msInsertImg\" alt=\"将选定的项目添加至您的选择\" src=\"images/blank.gif\"></button>");
    this.$removeButton = $("<button onmouseout=\"this.className = 'ms-Button';\" onmouseover=\"this.className = 'ms-ButtonOver';\" class=\"ms-Button\" title=\"从选择列表中删除\" type=\"button\" ><img width=\"16\" height=\"16\" border=\"0\" align=\"top\" class=\"msRemoveImg\" alt=\"从选择列表中删除\" src=\"images/blank.gif\"><span>删除</span></button>");
    this.$selectableContainer = $('<div>', {
        'class': 'ms-selectable'
    });
    this.$selectionContainer = $('<div>', {
        'class': 'ms-selection'
    });
    this.$selectable = $('<select>', {
        'id': 'ms-selectable',
        'class': 'ms-list',
        'tabindex': '-1',
        'multiple': 'multiple'
    });
    this.$selection = $('<select>', {
        'id': 'ms-selection',
        'class': 'ms-list',
        'tabindex': '-1',
        'multiple': 'multiple'
    });
};

MultiSelect.prototype = {
    constructor: MultiSelect,

    init: function() {
        var that = this,
        ms = this.$element;
        that.$input.insertBefore(ms);
        if (ms.next('.ms-container').length === 0) {
            ms.css({
                position: 'absolute',
                left: '-9999px'
            });
            ms.attr('id', ms.attr('id') ? ms.attr('id') : Math.ceil(Math.random() * 1000) + 'multiselect');
            that.$container.attr('id', 'ms-' + ms.attr('id'));
            that.generateLisFromOption();       
             //初始化输入框  这种方法还很慢
             // var text = that.$element.find('option:selected').map(function() {
             //     return jQuery(this).text();
             // }).get();
            var elementOptions = ms[0].options;
            var selectablerowcache =[];
            var selectionrowcache =[];
            var selectedText = [];
            //反向遍历 检测值即第二个参数为固定值是可用
            for (var i = elementOptions.length - 1; i >= 0; i--) {
                if(elementOptions[i].selected){
                    selectionrowcache.push(elementOptions[i]);
                    selectedText.push(elementOptions[i].text);
                }else{
                    selectablerowcache.push(elementOptions[i]);
                }
            };
            that.selectablerowcache =selectablerowcache;
            that.selectionrowcache = selectionrowcache;
            that.$input.attr('value',selectedText.join(","));
            
            that.$selectableContainer.append(that.$selectableHeader);
                
            that.$selectableContainer.append(that.$selectable);
            if (that.options.selectableFooter) {
                that.$selectableContainer.append(that.options.selectableFooter);
            }


                that.$selectionContainer.append(that.$selectionHeader);
            
            that.$selectionContainer.append(that.$selection);
            if (that.options.selectionFooter) {
                that.$selectionContainer.append(that.options.selectionFooter);
            }

            that.$container.append(that.$selectableContainer);
            that.$insertButtonContainer.append(that.$insertButton);
            that.$removeButtonContainer.append(that.$removeButton);
            that.$container.append(that.$insertButtonContainer);
            that.$container.append(that.$removeButtonContainer);
            that.$container.append(that.$selectionContainer);
            that.$container.appendTo("body");
            // that.selectablerowcache=that.$element.find('option').not(':selected').map(function() {
            //     return this;
            // });
            //  that.selectionrowcache=that.$element.find('option').filter(':selected').map(function() {
            //      return this;
            //  });
            var val,timeout,selectiontimeout,testQuery=function (query, txt) {
                for (var i = 0; i < query.length; i += 1) {
                    if (txt.indexOf(query[i]) === -1) {
                        return false;
                    }
                }
                return true;
            }
            that.$selectionHeader.on('keyup', function () {
              val = $(this).val();
              that.$selection.msSearch(val,selectiontimeout,testQuery,that.selectionrowcache);
            });
            that.$selectableHeader.on('keyup', function () {
              val = $(this).val();
              that.$selectable.msSearch(val,timeout,testQuery,that.selectablerowcache);
            });

            that.$insertButton.on('click',
            function() {
                that.select();
            });
            that.$removeButton.on('click',
            function() {
                that.deselect();
            });
            //multiselect控件的失去焦点事件
            $(document).on('mousedown.myselect',
            function(e) {
                var element = e.srcElement || e.target,
                $target = $(element);
                //判断一下是否打开
                if (! ($target.is(that.$container) || $target.is(that.$container.find('*')) || $target.is(that.$input)) && that.$container.css('display') != 'none') that.$container.hide();
            });
            that.$input.on('keydown',
            function(e) {
                if (e.which === 8) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            that.$input.on('click',
            function() {  
                // 应该改为添加到body标签上后再定位 

                //关的时候有闪烁   container.slideToggle(300);
                var offset = that.$input.offset();
                that.$container.css("display", "block").css( {
                    top : (offset.top + that.$input[0].offsetHeight) + 'px',
                    left : offset.left + 'px'
                });
                that.$container.show();
            });
            //IE下option双击无效
            that.$selectable.dblclick(function() {
                that.select();
            });
            that.$selection.dblclick(function() {
                that.deselect();
            });
            ms.on('focus',
            function() {
                that.$selectable.focus();
            });
        }

        if (typeof that.options.afterInit === 'function') {
            that.options.afterInit.call(that, that.$container);
        }
    },

    'generateLisFromOption': function() {
        var that = this,
        options = that.$element[0].options,
        selectableOptions = that.$selectable[0].options,
        selectedOptions = that.$selection[0].options;
                    //取属性操作应该放在循环外以提高性能
                     var optionsLength=options.length;
                     var selectedIndex=0;
                     var selectableIndex=0;
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            var anOption = document.createElement('option');
            anOption.text = option.text;
            anOption.value = option.value;
            if (option.selected) {
                selectedOptions[selectedIndex++] = anOption;
            } else {
                selectableOptions[selectableIndex++] = anOption;
            }
        }
    },

    'select': function() {
        var that = this,
        ms = that.$element;

        var selectedValues = moveSelection('ms-selection','ms-selectable');
            var selectablerowcache =[];
            var selectionrowcache =[];
            var selectedText = [];
         var selected = ms.find('option').each(function(){
            var value =this.value;
            if(jQuery.inArray(value, selectedValues) > -1){
                this.selected=true;
            }
            if (this.selected) {
                selectionrowcache.push(this);
                selectedText.push(this.text);
            }else{
                selectablerowcache.push(this);
                };
         });
            that.selectablerowcache =selectablerowcache;
            that.selectionrowcache = selectionrowcache;
            that.$input.attr('value',selectedText.join(","));

    },

    'deselect': function() {
        var that = this,
        ms = that.$element,
         selectedValues = moveSelection('ms-selectable','ms-selection'),
             selectablerowcache =[],
             selectionrowcache =[],
             selectedText = [],
          selected = ms.find('option').each(function(){
            var value =this.value;
            if(jQuery.inArray(value, selectedValues) > -1){
                this.selected=false;
            }
            if (this.selected) {
                selectionrowcache.push(this);
                selectedText.push(this.text);
            }else{
                selectablerowcache.push(this);
                };
         });
            that.selectablerowcache =selectablerowcache;
            that.selectionrowcache = selectionrowcache;
            that.$input.attr('value',selectedText.join(","));
    }
};

$.fn.multiSelect = function() {
    var option = arguments[0],
    args = arguments;

    return this.each(function() {
        var $this = $(this),
        data = $this.data('multiselect'),
        options = $.extend({},
        $.fn.multiSelect.defaults, $this.data(), typeof option === 'object' && option);

        if (!data) {
            $this.data('multiselect', (data = new MultiSelect(this, options)));
        }

        if (typeof option === 'string') {
            data[option](args[1]);
        } else {
            data.init();
        }
    });
};

$.fn.multiSelect.defaults = {
    keySelect: [32],
    dblClick: false,
    keepOrder: false,
    cssClass: ''
};

$.fn.multiSelect.Constructor = MultiSelect;

// Moves the selection to the select box specified
// usage $('nameofselectbox').moveSelectionTo(destination_selectbox)
$.fn.moveSelectionTo = function() {
    var dest = arguments[0];
    var values = [];
    this.each(function() {
        var optionsLength =  this.options.length;

        var destOptionsLength =  dest[0].options.length;
        for (var x = 0; x < optionsLength; x++) {
            var option = this.options[x];
            if (option.selected) {
                values.push(option.value);
                dest.addOption(option,destOptionsLength);
                this.remove(x);
                destOptionsLength++;
                optionsLength--;
                //$(this).triggerHandler('option-removed', option);
                x--; // Move x back one so that we'll successfully check again to see if it's selected.
            }
        }
    });
    return values;
}

// Adds an option to a select box
// usage $('nameofselectbox').addOption(optiontoadd);
$.fn.addOption = function() {
    var option = arguments[0];
    var index = arguments[1];
    this.each(function() {
        //had to alter code to this to make it work in IE
        var anOption = document.createElement('option');
        anOption.text = option.text;
        anOption.value = option.value;
        this.options[index] = anOption;
        //$(this).triggerHandler('option-added', anOption);
        return false;
    });
}

$.fn.msSearch = function(val,timeout,testQuery,rowcache){
      var that =this;
            var Options = that[0].options;
              window.clearTimeout(timeout);
              timeout = window.setTimeout(function () {
                            var query = val.toLowerCase().split(' '),
                      val_empty = (val.replace(' ', '').length === 0);
                    //jQuery empty和只写Options.length=0方法IE下显示有问题
                    for(var i=0;i<Options.length;i++){
                    that[0].remove(i);
                    }
                    Options.length =0;
                    for (var i = 0, len = rowcache.length; i < len; i++) {
                      if (val_empty || testQuery(query, rowcache[i].text.toLowerCase())) {
                      var anOption = document.createElement('option');
                          anOption.text = rowcache[i].text;
                          anOption.value = rowcache[i].value;
                          Options[Options.length] = anOption;
                      } else {
                      }
                    }
              }, 100);

}
function moveSelection(fromSelectionId,toSelectionId){
        var fromSelection =document.getElementById(fromSelectionId);
        var toSelection =document.getElementById(toSelectionId);
        var fromSelectionOptions = fromSelection.getElementsByTagName('option');
        var toSelectionOptions = toSelection.getElementsByTagName('option');
        var toSelectionLentgh = toSelectionOptions.length;
        var selectedValues =[];
        var docfrag = document.createDocumentFragment();
        for (var i = 0; i < toSelectionLentgh; i++) {
            var option = toSelectionOptions[i];
            if (option.selected) {
                selectedValues.push(option.value);
                //重新创建会快些
         var anOption = document.createElement('option');
        anOption.text = option.text;
        anOption.value = option.value;
                docfrag.appendChild(anOption);
                toSelection.removeChild(option);
                toSelectionLentgh--;
                i--;

            }
        };
fromSelection.appendChild(docfrag);
return selectedValues;
}
}) (window.jQuery);
