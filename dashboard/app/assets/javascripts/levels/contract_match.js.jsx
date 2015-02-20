$(window).load(function() {
  var Example = React.createClass({
    render: function() {
      return <b>Hello React!</b>
    }
  });
  //e.g., React.render(<Example/>, document.getElementById('domains'));

  $('#addButton').click(function()
  {
    var domainItemText = $('#domainItemText').val();
    var domainInput = $('#domainInput').val();
    var domainOptionSelected = $("#domainInput option:selected");
    $('#domainItemText').val('');
    var $div = $('<div/>').addClass('domainItem')
    $div.css("background-color", $(domainOptionSelected).data("color"));
    var $button = $('<button class="domain-x-button">x</button>');
    $div.append($button);
    $div.append($('<div/>').text(domainItemText + ':' + domainInput).addClass('domainItemText'));
    $button.click(function(event) {
      $(event.target.parentElement).remove();
    });
    $('#domainItems').append($div);
  });

  $('.contract select').on('change', function (e) {
    var optionSelected = $("option:selected", this);
    $(this).css("background-color", $(optionSelected).data("color"));
  });

  window.getResult = function()
  {
    if (!window.levelProperties) {
      return;
    }

    var functionName = $('#functionNameText').val();
    var rangeInput = $('#rangeInput').val();
    var items = $('#domainItems').children().map(function(item, element) {
      return $(element).find('.domainItemText')[0].textContent;
    });

    var answers = window.levelProperties['answers'];

    // Order domain inputs alphabetically sorted
    var domainInput = $.makeArray(items).slice().join('|');
    var response = functionName + '|' + rangeInput + '|' + domainInput;
    console.log('input="' + response + '"');

    var checkUserAnswer = checkAnswer.bind(null, functionName, rangeInput, domainInput);
    var resultPerAnswer = answers.map(checkUserAnswer);

    // If any succeeded, we succeed. Otherwise, grab the first error.
    var result = resultPerAnswer.some(function (answerResult) {
      return answerResult === '';
    });
    errorType = result ? null : resultPerAnswer[0];

    return {
      response: response,
      result: result,
      errorType: errorType
    };
  }

  /**
   * Given the user's submission and a correct answer, returns the error type,
   * or empty string if correct.
   */
  function checkAnswer(functionName, rangeInput, domainInput, correctAnswer) {
    var items = correctAnswer.split('|');
    var correctName = items[0];
    var correctRange = items[1];
    var correctDomain = items.slice(2);
    var domainInputItems = domainInput.split('|');

    if (correctName !== functionName) {
      return 'badname';
    }
    if (correctRange !== rangeInput) {
      return 'badrange';
    }
    if (correctDomain.length !== domainInputItems.length) {
      return 'baddomainsize';
    }
    for (var i = 0; i < correctDomain.length; i++) {
      var correctDomainName = correctDomain[i].split(':')[0];
      var correctDomainType = correctDomain[i].split(':')[1];
      var domainName = domainInputItems[i].split(':')[0];
      var domainType = domainInputItems[i].split(':')[1];
      if (correctDomainName !== domainName) {
        return 'baddomainname';
      }
      if (correctDomainType !== domainType) {
        return 'baddomaintype';
      }
    }
    return '';
  }
});

