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
      'style': 'display:block'
    });
    this.$stubContainer = $('<div>', {
      'style': 'position: relative;'
    });
    this.$dropdown = $('<div>', {
      'class': 'ms-dropdown'
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
      multiSelect.build().registerListener();
      multiSelect.$container.insertBefore(originSelect);

      //multiselect控件的失去焦点事件
      $(document).on('click.document',
        function() {
          // var element = e.srcElement || e.target,
          //   $target = $(element);
          //判断一下是否打开
          // if (!($target.is(multiSelect.$dropdown) || $target.is(multiSelect.$dropdown.find('*')) || $target.is(multiSelect.$input)) && multiSelect.$dropdown.css('display') !== 'none') {
          multiSelect.$dropdown.hide();

          // }
        });
      multiSelect.$stubContainer.on('click', function(event) {
        event.stopPropagation();
      });

    },
    'build': function() {
      var multiSelect = this,
        selectedCount = 0,
        selectablefrag = document.createDocumentFragment(),
        selectionfrag = document.createDocumentFragment();

      for (var i = 0, len = this.originSelect.length; i < len; i++) {
        var option = this.originSelect[i];
        option.setAttribute('ms-index', i);
        var cloneOption = option.cloneNode(true);
        if (option.selected) {
          selectionfrag.appendChild(cloneOption);
          multiSelect.selectionOptionCache.push(option);
          selectedCount++;
        } else {
          selectablefrag.appendChild(cloneOption);
          multiSelect.selectableOptionCache.push(option);
        }
      }
      multiSelect.$input.text('已选中' + selectedCount + '项');
      multiSelect.$selectableSelect.append(selectablefrag);
      multiSelect.$selectionSelect.append(selectionfrag);
      multiSelect.$selectableContainer.append(multiSelect.$selectableHeader, multiSelect.$selectableSelect);
      multiSelect.$selectionContainer.append(multiSelect.$selectionHeader, multiSelect.$selectionSelect);
      multiSelect.$insertButtonContainer.append(multiSelect.$insertButton);
      multiSelect.$removeButtonContainer.append(multiSelect.$removeButton);
      multiSelect.$dropdown.append(multiSelect.$selectableContainer, multiSelect.$insertButtonContainer, multiSelect.$removeButtonContainer, multiSelect.$selectionContainer);
      multiSelect.$stubContainer.append(multiSelect.$dropdown);
      multiSelect.$container.append(multiSelect.$input, multiSelect.$stubContainer);
      return multiSelect;
    },
    'registerListener': function() {
      var multiSelect = this;

      multiSelect.$input.on('click.input',
        function showDropdown(event) {
          //关的时候有闪烁   dropdown.slideToggle(300);
          multiSelect.$dropdown.show();
          event.stopPropagation();
        });

      multiSelect.$selectableHeader.on('keyup.selectableHeader',
        function searchFromSelectableSelect() {
          var queryString = this.value;
          var selectableSelect = multiSelect.$selectableSelect[0];

          multiSelect.cancelTimeout();

          multiSelect.searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = multiSelect.search(multiSelect.selectableOptionCache, queryString);
            selectableSelect.innerHTML = '';
            selectableSelect.appendChild(matchedOptions);
          }, multiSelect.delayedTime);

        });

      multiSelect.$selectionHeader.on('keyup.selectionHeader',
        function searchFromSelectionSelect() {
          var queryString = this.value;
          var selectionSelect = multiSelect.$selectionSelect[0];

          multiSelect.cancelTimeout();

          multiSelect.searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = multiSelect.search(multiSelect.selectionOptionCache, queryString);
            selectionSelect.innerHTML = '';
            selectionSelect.appendChild(matchedOptions);
          }, multiSelect.delayedTime);
        });

      multiSelect.$selectableSelect.on('dblclick.selectableSelect',
        function selectSingleOption() {
          multiSelect.moveSingleOption(multiSelect.$selectableSelect, multiSelect.$selectionSelect, true);
          multiSelect.update();
        }
      );

      multiSelect.$selectionSelect.on('dblclick.selectionSelect',
        function deselectSingleOption() {
          multiSelect.moveSingleOption(multiSelect.$selectionSelect, multiSelect.$selectableSelect, false);
          multiSelect.update();
        }
      );

      multiSelect.$insertButton.on('click.insertButton',
        function selectOptions() {
          multiSelect.moveSelectedOptions(multiSelect.$selectableSelect, multiSelect.$selectionSelect, true);
          multiSelect.update();
        });

      multiSelect.$removeButton.on('click.removeButton',
        function deselectOptions() {
          multiSelect.moveSelectedOptions(multiSelect.$selectionSelect, multiSelect.$selectableSelect, false);
          multiSelect.update();
        });
    },
    'cancelTimeout': function() {
      window.clearTimeout(this.searchedTimeoutID);
    },
    'search': function(targetOptions, queryString) {
      var matchedOptions = document.createDocumentFragment();
      var queryList = queryString.toLowerCase().split(' '),
        isEmpty = (queryList.length === 0);
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
    },
    'moveSingleOption': function($fromSelect, $toSelect, isSelected) {
      var fromSelect = $fromSelect[0];
      var toSelect = $toSelect[0];
      var fromSelectOptions = fromSelect.options;
      var i = fromSelectOptions.length;

      while (i--) {
        var option = fromSelectOptions[i];
        if (option.selected) {
          option.selected = false;
          toSelect.appendChild(option);
          this.originSelect[option.getAttribute('ms-index')].selected = isSelected;
          return;
        }
      }
    },
    'moveSelectedOptions': function($fromSelect, $toSelect, isSelected) {
      var fromSelect = $fromSelect[0];
      var toSelect = $toSelect[0];
      var fromSelectOptions = fromSelect.options;
      var tofrag = document.createDocumentFragment();
      var fromfrag = document.createDocumentFragment();

      for (var i = 0, len = fromSelectOptions.length; i < len; i++) {
        var option = fromSelectOptions[i];
        var cloneOption = option.cloneNode(true);
        if (option.selected) {
          //重新创建会快些
          tofrag.appendChild(cloneOption);
          this.originSelect[option.getAttribute('ms-index')].selected = isSelected;
        } else {
          fromfrag.appendChild(cloneOption);
        }
      }
      //remove操作太慢了
      fromSelect.innerHTML = '';
      fromSelect.appendChild(fromfrag);
      toSelect.appendChild(tofrag);
    },
    'update': function() {
      var selectableOptionCache = [];
      var selectionOptionCache = [];
      var selectedCount = 0;
      //只有这种方案了，保存cache的顺序成本太高
      for (var i = 0, len = this.originSelect.length; i < len; i++) {
        var option = this.originSelect[i];
        if (option.selected) {
          selectionOptionCache.push(option);
          selectedCount++;
        } else {
          selectableOptionCache.push(option);
        }

      }

      this.$input.text('已选中' + selectedCount + '项');
      this.selectionOptionCache = selectionOptionCache;
      this.selectableOptionCache = selectableOptionCache;
    }
  };
  $.fn.multiSelect = function() {
    return this.each(function() {
      var mSelect = new MSelect(this);
      mSelect.init();
    });
  };
})(jQuery, window);