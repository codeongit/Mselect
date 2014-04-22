//要注意循环体内部的程序段的性能（尽量使用原生操作，采用性能较高的方法实现，但又要考虑浏览器的兼容性问题）
//要注意JQuery的隐式循环,容易导致重复的使用循环操作，有多层循环（多于1层）时就要考虑优化
//要注意 用局部变量保留对象的属性、外部变量的值、选择器取得的对象，从而避免多次查找的损耗
//最后的手段，使用延迟加载“提高”使用性
//编程时对象的生命周期要时刻注意
(function($) {

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
            'placeholder': '请选择...'
        });
        this.$selectableHeader = $('<input>', {
            'class': 'search-input',
            'type': 'text',
            'autocomplete': 'off',
            'placeholder': '请输入过滤待选项...'
        });
        this.$selectionHeader = $('<input>', {
            'class': 'search-input',
            'type': 'text',
            'autocomplete': 'off',
            'placeholder': '请输入过滤待选项...'
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
                //初始化输入框  缓存选区的选项
                var elementOptions = ms[0].options;
                var selectablerowcache = [];
                var selectionrowcache = [];
                var selectedText = [];
                for (var i = 0; i < elementOptions.length; i++) {
                    if (elementOptions[i].selected) {
                        selectionrowcache.push(elementOptions[i]);
                        selectedText.push(elementOptions[i].text);
                    } else {
                        selectablerowcache.push(elementOptions[i]);
                    }
                };

                that.selectablerowcache = selectablerowcache;
                that.selectionrowcache = selectionrowcache;
                that.$input.attr('value', selectedText.join(","));

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
                var val, timeout, selectiontimeout, testQuery = function(query, txt) {
                        for (var i = 0; i < query.length; i += 1) {
                            if (txt.indexOf(query[i]) === -1) {
                                return false;
                            }
                        }
                        return true;
                    }
                that.$selectionHeader.on('keyup', function() {
                    val = $(this).val();
                    that.$selection.msSearch(val, selectiontimeout, testQuery, that.selectionrowcache);
                });
                that.$selectableHeader.on('keyup', function() {
                    val = $(this).val();
                    that.$selectable.msSearch(val, timeout, testQuery, that.selectablerowcache);
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
                        if (!($target.is(that.$container) || $target.is(that.$container.find('*')) || $target.is(that.$input)) && that.$container.css('display') != 'none') that.$container.hide();
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
                        that.$container.css("display", "block").css({
                            top: (offset.top + that.$input[0].offsetHeight) + 'px',
                            left: offset.left + 'px'
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
                selectionOptions = that.$selection[0].options,
                selectablefrag = document.createDocumentFragment(),
                selectionfrag = document.createDocumentFragment();
            for (var i = 0, len = options.length; i < len; i++) {
                var option = options[i];
                if (option.selected) {
                    selectionfrag.appendChild(option.cloneNode(true));
                } else {
                    selectablefrag.appendChild(option.cloneNode(true));
                }
            }
            that.$selectable.append(selectablefrag);
            that.$selection.append(selectionfrag);
        },

        'select': function() {
            var msOptions = this.$element[0].options,
                selectedValues = moveSelection(this.$selectable, this.$selection),
                selectablerowcache = [],
                selectionrowcache = [],
                selectedText = [],
                option, value;
            for (var i = 0, len = msOptions.length; i < len; i++) {
                option = msOptions[i]
                value = option.value;
                if (jQuery.inArray(value, selectedValues) > -1) {
                    option.selected = true;
                }
                if (option.selected) {
                    selectionrowcache.push(option);
                    selectedText.push(option.text);
                } else {
                    selectablerowcache.push(option);
                };
            };
            this.selectablerowcache = selectablerowcache;
            this.selectionrowcache = selectionrowcache;
            this.$input.attr('value', selectedText.join(","));

        },

        'deselect': function() {
            var msOptions = this.$element[0].options,
                selectedValues = moveSelection(this.$selection, this.$selectable),
                selectablerowcache = [],
                selectionrowcache = [],
                selectedText = [],
                option, value;
            for (var i = 0, len = msOptions.length; i < len; i++) {
                option = msOptions[i]
                value = this.value;
                if (jQuery.inArray(value, selectedValues) > -1) {
                    option.selected = false;
                }
                if (option.selected) {
                    selectionrowcache.push(option);
                    selectedText.push(option.text);
                } else {
                    selectablerowcache.push(option);
                };
            };
            this.selectablerowcache = selectablerowcache;
            this.selectionrowcache = selectionrowcache;
            this.$input.attr('value', selectedText.join(","));
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

    $.fn.msSearch = function(val, timeout, testQuery, rowcache) {
        var that = this;
        var Options = that[0].options;
        window.clearTimeout(timeout);
        timeout = window.setTimeout(function() {

            var docfrag = document.createDocumentFragment();
            var query = val.toLowerCase().split(' '),
                val_empty = (val.replace(' ', '').length === 0);
            that.html('');
            for (var i = 0, len = rowcache.length; i < len; i++) {
                if (val_empty || testQuery(query, rowcache[i].text.toLowerCase())) {
                    docfrag.appendChild(rowcache[i].cloneNode(true));
                } else {}
            }

            that.append(docfrag);
        }, 100);

    }

    function moveSelection($fromSelection, $toSelection) {
        var toSelection = $toSelection[0];
        var fromSelection = $fromSelection[0];
        var fromSelectionOptions = fromSelection.options;
        var fromSelectionLentgh = fromSelectionOptions.length;
        var selectedValues = [];
        var tofrag = document.createDocumentFragment();
        var fromfrag = document.createDocumentFragment();
        for (var i = 0; i < fromSelectionLentgh; i++) {
            var option = fromSelectionOptions[i];
            if (option.selected) {
                selectedValues.push(option.getAttribute('value'));
                //重新创建会快些

                tofrag.appendChild(option.cloneNode(true));
                // fromSelection.removeChild(option);
                // fromSelectionLentgh--;
                // i--;

            } else {
                fromfrag.appendChild(option.cloneNode(true));
            }
        };
        toSelection.appendChild(tofrag);
        //针对IE8下remove操作过慢的修正
        $fromSelection.html('');
        fromSelection.appendChild(fromfrag);

        return selectedValues;
    }
})(window.jQuery);