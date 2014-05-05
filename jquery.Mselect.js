(function($, window, document, undefined) {

  'use strict';

  function buildMSelect(originSelect) {
    var selectableOptionCache = [],
      selectionOptionCache = [],
      delayedTime = 300,
      searchedTimeoutID = null,
      $container = $('<div>', {
        'style': 'display:block'
      }),
      $stubContainer = $('<div>', {
        'style': 'position: relative;'
      }),
      $dropdown = $('<div>', {
        'class': 'ms-dropdown'
      }),
      $input = $('<div>', {
        'class': 'ms-input'
      }),
      $selectableHeader = $('<input>', {
        'class': 'search-input',
        'type': 'text',
        'autocomplete': 'off',
        'placeholder': '请输入过滤待选项...'
      }),
      $selectionHeader = $('<input>', {
        'class': 'search-input',
        'type': 'text',
        'autocomplete': 'off',
        'placeholder': '请输入过滤已选项...'
      }),
      $insertButtonContainer = $('<div>', {
        'style': 'position: absolute;top: 35%;left: 42%;'
      }),
      $removeButtonContainer = $('<div>', {
        'style': 'position: absolute;top: 48%;left: 42%;'
      }),
      $insertButton = $('<button onmouseout = "this.className = \'ms-Button\';" onmouseover="this.className = \'ms-ButtonOver\';" class="ms-Button" title="将选定的项目添加至您的选择" type="button"><span>插入</span><img width="16" height="16" border="0" align="top" class="msInsertImg" alt="将选定的项目添加至您的选择" src="images/blank.gif"></button>'),
      $removeButton = $('<button onmouseout="this.className = \'ms-Button\';" onmouseover="this.className = \'ms-ButtonOver\';" class="ms-Button" title="从选择列表中删除" type="button" ><img width="16" height="16" border="0" align="top" class="msRemoveImg" alt="从选择列表中删除" src="images/blank.gif"><span>删除</span></button>'),
      $selectableContainer = $('<div>', {
        'class': 'ms-selectable'
      }),
      $selectionContainer = $('<div>', {
        'class': 'ms-selection'
      }),
      $selectableSelect = $('<select>', {
        'id': 'ms-selectable',
        'class': 'ms-list',
        'tabindex': '-1',
        'multiple': 'multiple'
      }),
      $selectionSelect = $('<select>', {
        'id': 'ms-selection',
        'class': 'ms-list',
        'tabindex': '-1',
        'multiple': 'multiple'
      });

    function init() {

      originSelect.style.display = 'none';
      build();
      registerListener();
      $container.insertBefore(originSelect);

      //multiselect控件的失去焦点事件
      $(document).on('click.document',
        function() {
          $dropdown.hide();
        });

      $stubContainer.on('click', function(event) {
        event.stopPropagation();
      });

    }

    function build() {
      var selectedCount = 0,
        selectablefrag = document.createDocumentFragment(),
        selectionfrag = document.createDocumentFragment();

      for (var i = 0, len = originSelect.length; i < len; i++) {
        var option = originSelect[i];
        option.setAttribute('ms-index', i);
        var cloneOption = option.cloneNode(true);
        if (option.selected) {
          selectionfrag.appendChild(cloneOption);
          selectionOptionCache.push(option);
          selectedCount++;
        } else {
          selectablefrag.appendChild(cloneOption);
          selectableOptionCache.push(option);
        }
      }
      $input.text('已选中' + selectedCount + '项');
      $selectableSelect.append(selectablefrag);
      $selectionSelect.append(selectionfrag);
      $selectableContainer.append($selectableHeader, $selectableSelect);
      $selectionContainer.append($selectionHeader, $selectionSelect);
      $insertButtonContainer.append($insertButton);
      $removeButtonContainer.append($removeButton);
      $dropdown.append($selectableContainer, $insertButtonContainer, $removeButtonContainer, $selectionContainer);
      $stubContainer.append($dropdown);
      $container.append($input, $stubContainer);
    }

    function registerListener() {
      $input.on('click.input',
        function showDropdown(event) {
          //关的时候有闪烁   dropdown.slideToggle(300);
          $dropdown.show();
          event.stopPropagation();
        });

      $selectableHeader.on('keyup.selectableHeader',
        function searchFromSelectableSelect() {
          var queryString = this.value;
          var selectableSelect = $selectableSelect[0];

          cancelTimeout();

          searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = search(selectableOptionCache, queryString);
            selectableSelect.innerHTML = '';
            selectableSelect.appendChild(matchedOptions);
          }, delayedTime);

        });

      $selectionHeader.on('keyup.selectionHeader',
        function searchFromSelectionSelect() {
          var queryString = this.value;
          var selectionSelect = $selectionSelect[0];

          cancelTimeout();

          searchedTimeoutID = window.setTimeout(function() {
            var matchedOptions = search(selectionOptionCache, queryString);
            selectionSelect.innerHTML = '';
            selectionSelect.appendChild(matchedOptions);
          }, delayedTime);
        });

      $selectableSelect.on('dblclick.selectableSelect',
        function selectSingleOption() {
          moveSingleOption($selectableSelect, $selectionSelect, true);
          update();
        }
      );

      $selectionSelect.on('dblclick.selectionSelect',
        function deselectSingleOption() {
          moveSingleOption($selectionSelect, $selectableSelect, false);
          update();
        }
      );

      $insertButton.on('click.insertButton',
        function selectOptions() {
          moveSelectedOptions($selectableSelect, $selectionSelect, true);
          update();
        });

      $removeButton.on('click.removeButton',
        function deselectOptions() {
          moveSelectedOptions($selectionSelect, $selectableSelect, false);
          update();
        });
    }

    function cancelTimeout() {
      window.clearTimeout(searchedTimeoutID);
    }

    function search(targetOptions, queryString) {
      var matchedOptions = document.createDocumentFragment();
      var queryList = queryString.toLowerCase().split(' '),
        isEmpty = (queryList.length === 0);
      for (var i = 0, len = targetOptions.length; i < len; i++) {
        if (isEmpty || isMatched(queryList, targetOptions[i].text.toLowerCase())) {
          matchedOptions.appendChild(targetOptions[i].cloneNode(true));
        } else {}
      }
      return matchedOptions;
    }

    function isMatched(queryList, targetText) {
      for (var i = 0, len = queryList.length; i < len; i++) {
        if (targetText.indexOf(queryList[i]) === -1) {
          return false;
        }
      }
      return true;
    }

    function moveSingleOption($fromSelect, $toSelect, isSelected) {
      var fromSelect = $fromSelect[0];
      var toSelect = $toSelect[0];
      var fromSelectOptions = fromSelect.options;
      var i = fromSelectOptions.length;

      while (i--) {
        var option = fromSelectOptions[i];
        if (option.selected) {
          option.selected = false;
          toSelect.appendChild(option);
          originSelect[option.getAttribute('ms-index')].selected = isSelected;
          return;
        }
      }
    }

    function moveSelectedOptions($fromSelect, $toSelect, isSelected) {
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
          originSelect[option.getAttribute('ms-index')].selected = isSelected;
        } else {
          fromfrag.appendChild(cloneOption);
        }
      }
      //remove操作太慢了
      fromSelect.innerHTML = '';
      fromSelect.appendChild(fromfrag);
      toSelect.appendChild(tofrag);
    }

    function update() {
      var selectableTempCache = [];
      var selectionTempCache = [];
      var selectedCount = 0;
      //只有这种方案了，保存cache的顺序成本太高
      for (var i = 0, len = originSelect.length; i < len; i++) {
        var option = originSelect[i];
        if (option.selected) {
          selectionTempCache.push(option);
          selectedCount++;
        } else {
          selectableTempCache.push(option);
        }

      }

      $input.text('已选中' + selectedCount + '项');
      selectionOptionCache = selectionTempCache;
      selectableOptionCache = selectableTempCache;
    }
    return {
      'init': init
    };

  }


  $.fn.multiSelect = function() {
    return this.each(function() {
      var mSelect = buildMSelect(this);
      mSelect.init();
    });
  };
})(jQuery, window, document);