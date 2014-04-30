//要注意循环体内部,interval函数,经常触发的事件中的程序段的性能
//尽量使用原生操作，但又要考虑浏览器的兼容性问题
//要注意JQuery的隐式循环
//要注意 用局部变量保留对象的属性、外部变量的值、选择器取得的对象,数组的取值，从而避免多次查找的损耗
//使用createDocumentFragment减少dom操作
//尽量避免使用jQuery选择器的使用，使用时尽量指定context
//把处理时间分布开来，使用延迟加载“提高”使用性,预处理操作等
//有时修改了处理流程,一些需要优化的地方就不再必要了
//注意消除程序中的重复,提高程序的可读性
//编程时对象的生命周期要时刻注意,防止内存泄露
//不要同时想多种状态的情况，不要钻牛角尖，把流程写下来帮助分析


(function($, window, undefined) {

  'use strict';

  function MSelect(originSelect) {
    this.originSelect = originSelect;
    this.selectableOptionCache = [];
    this.selectionOptionCache = [];
    this.selectableOptionSercher = null;
    this.selectionOptionSercher = null;
    this.delayedTime = 300;
    this.searchedTimeoutID = null;
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

  }

  MSelect.prototype = {
    constructor: MSelect,
    init: function() {
      var multiSelect = this,
        originSelect = this.originSelect;

      originSelect.style.display = 'none';
      multiSelect.buildContainer().refreshInput().refreshOptionCache().registerListener();
      multiSelect.$input.insertBefore(originSelect);
      multiSelect.$container.appendTo('body');

      //multiselect控件的失去焦点事件
      $(document).on('mousedown.document',
        function(e) {
          var element = e.srcElement || e.target,
            $target = $(element);
          //判断一下是否打开
          if (!($target.is(multiSelect.$container) || $target.is(multiSelect.$container.find('*')) || $target.is(multiSelect.$input)) && multiSelect.$container.css('display') !== 'none') {
            multiSelect.$container.hide();
          }
        });

    },
    'buildContainer': function() {
      var multiSelect = this;
      multiSelect.buildOptionsFrom(multiSelect.originSelect)
        .buildSelectableContainer()
        .buildSelectionContainer();
      multiSelect.$insertButtonContainer.append(multiSelect.$insertButton);
      multiSelect.$removeButtonContainer.append(multiSelect.$removeButton);
      multiSelect.$container.append(multiSelect.$selectableContainer, multiSelect.$insertButtonContainer, multiSelect.$removeButtonContainer, multiSelect.$selectionContainer);

      return multiSelect;
    },
    'buildOptionsFrom': function(originSelect) {
      var multiSelect = this,
        options = originSelect.options,
        selectablefrag = document.createDocumentFragment(),
        selectionfrag = document.createDocumentFragment();

      for (var i = 0, len = options.length; i < len; i++) {
        var option = options[i];
        var cloneOption = option.cloneNode(true);
        cloneOption.setAttribute('ms-index', i);
        if (option.selected) {
          selectionfrag.appendChild(cloneOption);
          multiSelect.selectionOptionCache.push(cloneOption);
        } else {
          selectablefrag.appendChild(cloneOption);
          multiSelect.selectableOptionCache.push(cloneOption);
        }
      }
      multiSelect.$selectableSelect.append(selectablefrag);
      multiSelect.$selectionSelect.append(selectionfrag);

      return multiSelect;
    },
    'buildSelectableContainer': function() {
      var multiSelect = this;
      multiSelect.$selectableContainer.append(multiSelect.$selectableHeader, multiSelect.$selectableSelect);
      return multiSelect;
    },
    'buildSelectionContainer': function() {
      var multiSelect = this;
      multiSelect.$selectionContainer.append(multiSelect.$selectionHeader, multiSelect.$selectionSelect);
      return multiSelect;
    },
    'refreshOptionCache': function() {
      //有bug

      var multiSelect = this;
      // multiSelect.selectableOptionSercher = new OptionSearcher(multiSelect.$selectableSelect[0].options);
      // multiSelect.selectionOptionSercher = new OptionSearcher(multiSelect.$selectionSelect[0].options);
      // multiSelect.selectionOptionCache = multiSelect.$selectionSelect[0].cloneNode(true);
      // multiSelect.selectableOptionCache = multiSelect.$selectableSelect[0].cloneNode(true);
      return multiSelect;
    },
    'refreshInput': function() {
      var multiSelect = this;
      multiSelect.$input.text('已选中' + multiSelect.$selectionSelect[0].options.length + '项');
      return multiSelect;
    },
    'search': function(targetOptions, queryString) {
      var matchedOptions = document.createDocumentFragment();
      var queryList = queryString.toLowerCase().split(' '),
        isEmpty = (queryList.length === 0);
      for (var i = 0, len = targetOptions.length; i < len; i++) {
        if (isEmpty || this.isMatched(queryList, targetOptions[i].text.toLowerCase())) {
          matchedOptions.appendChild(targetOptions[i]);
        } else {}
      }
      return matchedOptions;
    },
    'isMatched': function(queryList, targetText) {
      for (var i = 0, len = queryList.length; i < len; i++) {
        if (targetText.indexOf(queryList[i]) === -1) {
          return false;
        }
      }
      return true;
    },
    'registerListener': function() {
      var multiSelect = this;

      multiSelect.$input.on('click.input',
        function showContainer() {
          //关的时候有闪烁   container.slideToggle(300);
          var offset = multiSelect.$input.offset();
          multiSelect.$container.css('display', 'block').css({
            top: (offset.top + multiSelect.$input[0].offsetHeight) + 'px',
            left: offset.left + 'px'
          });
          multiSelect.$container.show();
        });

      multiSelect.$selectableHeader.on('keyup.selectableHeader',
        function searchFromSelectableSelect() {
          var queryString = this.value;
          var selectableSelect = multiSelect.$selectableSelect[0];

          window.clearTimeout(multiSelect.searchedTimeoutID);

          multiSelect.searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = multiSelect.search(multiSelect.selectableOptionCache, queryString);
            selectableSelect.innerHTML = '';
            selectableSelect.appendChild(matchedOptions);
          }, multiSelect.delayedTime);

        });
      multiSelect.$selectableSelect.on({
        //双击和点按钮的事件区分开来
        'dblclick.selectableSelect': $.proxy(multiSelect.select, multiSelect),
        'change.selectableSelect': function() {
          var selectableOptions = multiSelect.$selectableSelect[0].options;
          var msOptions = multiSelect.originSelect.options;
          for (var i = 0, len = selectableOptions.length; i < len; i++) {
            if (selectableOptions[i].selected) {
              msOptions[selectableOptions[i].getAttribute('ms-index')].selected = true;
            } else {
              msOptions[selectableOptions[i].getAttribute('ms-index')].selected = false;
            }
          }
        }
      });
      multiSelect.$selectionHeader.on('keyup.selectionHeader',
        function searchFromSelectionSelect() {
          var queryString = this.value;
          var selectionSelect = multiSelect.$selectionSelect[0];

          window.clearTimeout(multiSelect.searchedTimeoutID);

          multiSelect.searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = multiSelect.search(multiSelect.selectionOptionCache, queryString);
            selectionSelect.innerHTML = '';
            selectionSelect.appendChild(matchedOptions);
          }, multiSelect.delayedTime);
        });
      multiSelect.$selectionSelect.on({
        'dblclick.selectionSelect': $.proxy(multiSelect.deselect, multiSelect),
        'change.selectionSelect': function() {
          var selectionOptions = multiSelect.$selectionSelect[0].options;
          var msOptions = multiSelect.originSelect.options;
          for (var i = 0, len = selectionOptions.length; i < len; i++) {
            if (selectionOptions[i].selected) {
              msOptions[selectionOptions[i].getAttribute('ms-index')].selected = false;
            } else {
              msOptions[selectionOptions[i].getAttribute('ms-index')].selected = true;
            }
          }
        }
      });
      multiSelect.$insertButton.on('click.insertButton',
        function() {
          multiSelect.select();
        });
      multiSelect.$removeButton.on('click.removeButton',
        function() {
          multiSelect.deselect();
        });
    },
    'select': function() {
      var selectedOptions = this.moveSelectedOption(this.$selectableSelect, this.$selectionSelect);
      this.refreshInput();
      var multiSelect = this;

      var selectableOptionCache = [];
      for (var i = 0, len = multiSelect.selectableOptionCache.length; i < len; i++) {
        var cacheOption = multiSelect.selectableOptionCache[i];
        if ($.inArray(cacheOption,selectedOptions)>-1) {
          multiSelect.selectionOptionCache.push(cacheOption);
        } else {

          selectableOptionCache.push(cacheOption);
        }

      }
      multiSelect.selectableOptionCache = selectableOptionCache;

    },
    'deselect': function() {
      var selectedOptions = this.moveSelectedOption(this.$selectionSelect, this.$selectableSelect);
      this.refreshInput();
      var selectionOptionCache = [];
      var multiSelect = this;

      for (var i = 0, len = multiSelect.selectionOptionCache.length; i < len; i++) {
        var cacheOption = multiSelect.selectionOptionCache[i];
        if ($.inArray(cacheOption, selectedOptions) > -1) {
          multiSelect.selectableOptionCache.push(cacheOption);
        } else {
          selectionOptionCache.push(cacheOption);
        }
      }
      multiSelect.selectionOptionCache = selectionOptionCache;

    },
    'moveSelectedOption': function($fromSelect, $toSelect) {
      var toSelect = $toSelect[0];
      var fromSelect = $fromSelect[0];
      var fromSelectOptions = fromSelect.options;
      var selectedOptions = [];
      var tofrag = document.createDocumentFragment();
      var fromfrag = document.createDocumentFragment();
      for (var i = 0, len = fromSelectOptions.length; i < len; i++) {
        var option = fromSelectOptions[i];
        var cloneOption = option.cloneNode(true);
        if (option.selected) {
          //重新创建会快些
          tofrag.appendChild(cloneOption);
          selectedOptions.push(option);
        } else {
        //这里是为了 fromfrag 在缓存中找的到
          fromfrag.appendChild(option);
          len--;
          i--;
        }
      }
      fromSelect.innerHTML = '';
      fromSelect.appendChild(fromfrag);
      toSelect.appendChild(tofrag);



      return selectedOptions;
    }
  };

  function OptionSearcher(targetOptions) {
    this.targetOptions = targetOptions;
  }
  OptionSearcher.prototype = {
    'search': function(queryString) {
      var matchedOptions = document.createDocumentFragment();
      var queryList = queryString.toLowerCase().split(' '),
        isEmpty = (queryList.length === 0);
      var targetOptions = this.targetOptions;
      for (var i = 0, len = targetOptions.length; i < len; i++) {
        if (isEmpty || this.isMatched(queryList, targetOptions[i].text.toLowerCase())) {
          matchedOptions.appendChild(targetOptions[i].cloneNode(true));
        } else {}
      }
      return matchedOptions;
    },
    'isMatched': function(queryList, targetText) {
      for (var i = 0, len = queryList.length; i < len; i++) {
        if (targetText.indexOf(queryList[i]) === -1) {
          return false;
        }
      }
      return true;
    }
  };
  $.fn.multiSelect = function() {
    return this.each(function() {
      var mSelect = new MSelect(this);
      mSelect.init();
    });
  };


})(jQuery, window);