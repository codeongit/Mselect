//要注意循环体内部的程序段的性能（尽量使用原生操作，采用性能较高的方法实现，但又要考虑浏览器的兼容性问题）
//要注意JQuery的隐式循环,容易导致重复的使用循环操作，有多层循环（多于1层）时就要考虑优化
//要注意 用局部变量保留对象的属性、外部变量的值、选择器取得的对象，从而避免多次查找的损耗
//把处理时间分布开来，使用延迟加载“提高”使用性,预处理操作等
//有时修改了处理流程,一些需要优化的地方就不再必要了
//编程时对象的生命周期要时刻注意,防止内存泄露

(function($) {

  'use strict';

  var MultiSelect = function(element) {
    this.$element = $(element);
    this.selectableRowcache = [];
    this.selectionRowcache = [];
    this.$container = $('<div>', {
      'class': 'ms-container'
    });
    this.$input = $('<div>', {
      'class': 'ms-input'
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
      'placeholder': '请输入过滤已选项...'
    });
    this.$insertButtonContainer = $('<div>', {
      'style': 'position: absolute;top: 35%;left: 42%;'
    });
    this.$removeButtonContainer = $('<div>', {
      'style': 'position: absolute;top: 48%;left: 42%;'
    });
    this.$insertButton = $('<button onmouseout = "this.className = \'ms-Button\';" onmouseover="this.className = \'ms-ButtonOver\';" class="ms-Button" title="将选定的项目添加至您的选择" type="button"><span>插入</span><img width="16" height="16" border="0" align="top" class="msInsertImg" alt="将选定的项目添加至您的选择" src="images/blank.gif"></button>');
    this.$removeButton = $('<button onmouseout="this.className = \'ms-Button\';" onmouseover="this.className = \'ms-ButtonOver\';" class="ms-Button" title="从选择列表中删除" type="button" ><img width="16" height="16" border="0" align="top" class="msRemoveImg" alt="从选择列表中删除" src="images/blank.gif"><span>删除</span></button>');
    this.$selectableContainer = $('<div>', {
      'class': 'ms-selectable'
    });
    this.$selectionContainer = $('<div>', {
      'class': 'ms-selection'
    });
    this.$selectableSelect = $('<select>', {
      'id': 'ms-selectable',
      'class': 'ms-list',
      'tabindex': '-1',
      'multiple': 'multiple'
    });
    this.$selectionSelect = $('<select>', {
      'id': 'ms-selection',
      'class': 'ms-list',
      'tabindex': '-1',
      'multiple': 'multiple'
    });
  };

  MultiSelect.prototype = {
    constructor: MultiSelect,
    init: function() {
      var multiSelect = this,
        ms = this.$element;
      multiSelect.$input.insertBefore(ms);
      ms.hide();
      multiSelect.generateLisFromOption();
      multiSelect.$selectableContainer.append(multiSelect.$selectableHeader, multiSelect.$selectableSelect);
      multiSelect.$selectionContainer.append(multiSelect.$selectionHeader, multiSelect.$selectionSelect);
      multiSelect.$insertButtonContainer.append(multiSelect.$insertButton);
      multiSelect.$removeButtonContainer.append(multiSelect.$removeButton);
      multiSelect.$container.append(multiSelect.$selectableContainer, multiSelect.$insertButtonContainer, multiSelect.$removeButtonContainer, multiSelect.$selectionContainer);
      multiSelect.$container.appendTo('body');
      var val, timeout, selectiontimeout, testQuery = function(query, txt) {
          for (var i = 0, len = query.length; i < len; i++) {
            if (txt.indexOf(query[i]) === -1) {
              return false;
            }
          }
          return true;
        };
      multiSelect.$selectionHeader.on('keyup', function() {
        val = $(this).val();
        multiSelect.$selectionSelect.msSearch(val, selectiontimeout, testQuery, multiSelect.selectionRowcache);
      });
      multiSelect.$selectableHeader.on('keyup', function() {
        val = $(this).val();
        multiSelect.$selectableSelect.msSearch(val, timeout, testQuery, multiSelect.selectableRowcache);
      });

      multiSelect.$insertButton.on('click',
        function() {
          multiSelect.select();
        });
      multiSelect.$removeButton.on('click',
        function() {
          multiSelect.deselect();
        });
      //multiselect控件的失去焦点事件
      $(document).on('mousedown.myselect',
        function(e) {
          var element = e.srcElement || e.target,
            $target = $(element);
          //判断一下是否打开
          if (!($target.is(multiSelect.$container) || $target.is(multiSelect.$container.find('*')) || $target.is(multiSelect.$input)) && multiSelect.$container.css('display') !== 'none') {
            multiSelect.$container.hide();
          }
        });
      multiSelect.$input.on('click',
        function() {
          //关的时候有闪烁   container.slideToggle(300);
          var offset = multiSelect.$input.offset();
          multiSelect.$container.css('display', 'block').css({
            top: (offset.top + multiSelect.$input[0].offsetHeight) + 'px',
            left: offset.left + 'px'
          });
          multiSelect.$container.show();
        });
      //IE下option双击无效
      multiSelect.$selectableSelect.on({
        'dblclick': function() {
          multiSelect.select();
        },
        'change': function() {
          var selectableOptions = multiSelect.$selectableSelect[0].options;
          var msOptions = ms[0].options;
          for (var i = 0, len = selectableOptions.length; i < len; i++) {
            if (selectableOptions[i].selected) {
              msOptions[selectableOptions[i].getAttribute('ms-index')].selected = true;
            } else {
              msOptions[selectableOptions[i].getAttribute('ms-index')].selected = false;
            }
          }
        }
      });
      multiSelect.$selectionSelect.on({
        'dblclick': function() {
          multiSelect.deselect();
        },
        'change': function() {
          var selectionOptions = multiSelect.$selectionSelect[0].options;
          var msOptions = ms[0].options;
          for (var i = 0, len = selectionOptions.length; i < len; i++) {
            if (selectionOptions[i].selected) {
              msOptions[selectionOptions[i].getAttribute('ms-index')].selected = false;
            } else {
              msOptions[selectionOptions[i].getAttribute('ms-index')].selected = true;
            }
          }
        }
      });
    },
    'generateLisFromOption': function() {
      var multiSelect = this,
        options = multiSelect.$element[0].options,
        selectablefrag = document.createDocumentFragment(),
        selectionfrag = document.createDocumentFragment();

      for (var i = 0, len = options.length; i < len; i++) {
        var option = options[i];
        var cloneOption = option.cloneNode(true);
        cloneOption.setAttribute('ms-index', i);
        if (option.selected) {
          selectionfrag.appendChild(cloneOption);
        } else {
          selectablefrag.appendChild(cloneOption);
        }
      }
      multiSelect.$selectableSelect.append(selectablefrag);
      multiSelect.$selectionSelect.append(selectionfrag);
      this.setInput();
      this.setRowcache();
    },
    'moveSelectedOption': function($fromSelect, $toSelect) {
      var toSelect = $toSelect[0];
      var fromSelect = $fromSelect[0];
      var fromSelectOptions = fromSelect.options;
      var tofrag = document.createDocumentFragment();
      var fromfrag = document.createDocumentFragment();
      for (var i = 0, len = fromSelectOptions.length; i < len; i++) {
        var option = fromSelectOptions[i];
        if (option.selected) {
          //重新创建会快些
          tofrag.appendChild(option.cloneNode(true));
        } else {
          fromfrag.appendChild(option.cloneNode(true));
        }
      }
      toSelect.appendChild(tofrag);
      //针对IE8下remove操作过慢的修正
      $fromSelect.html('');
      fromSelect.appendChild(fromfrag);

    },
    'setRowcache': function() {
      this.selectableRowcache = this.$selectableSelect[0].cloneNode(true);
      this.selectionRowcache = this.$selectionSelect[0].cloneNode(true);

    },
    'setInput': function() {
      this.$input.text('已选中' + this.$selectionSelect[0].options.length + '项');
    },
    'select': function() {
      this.moveSelectedOption(this.$selectableSelect, this.$selectionSelect);
      this.setInput();
      this.setRowcache();
    },
    'deselect': function() {
      this.moveSelectedOption(this.$selectionSelect, this.$selectableSelect);
      this.setInput();
      this.setRowcache();
    }
  };

  $.fn.multiSelect = function() {
    return this.each(function() {
      var mSelect = new MultiSelect(this);
      mSelect.init();
    });
  };
  $.fn.msSearch = function(val, timeout, testQuery, rowcache) {
    var multiSelect = this;
    window.clearTimeout(timeout);

    timeout = window.setTimeout(function() {

      var docfrag = document.createDocumentFragment();
      var query = val.toLowerCase().split(' '),
        isEmpty = (query.length === 0);
      //使用jQuery的方法防止内存泄露
      multiSelect.html('');
      for (var i = 0, len = rowcache.length; i < len; i++) {
        if (isEmpty || testQuery(query, rowcache[i].text.toLowerCase())) {
          docfrag.appendChild(rowcache[i].cloneNode(true));
        } else {}
      }

      multiSelect.append(docfrag);
    }, 100);

  };

})(window.jQuery);