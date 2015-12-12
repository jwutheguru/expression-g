document.addEventListener('DOMContentLoaded', function() {

    var expressionInput = document.getElementById('__eg-expression__');
    var prevButton = document.getElementById('__eg-prev__');
    var nextButton = document.getElementById('__eg-next__');

    var tabId;
    var tabState;

    (function init() {
        debugger;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            tabId = tabs[0].id;

            var message = {
                'sender': 'popup',
                'target': 'background',
                'command': 'tabState',
                'data': {
                    tabId: tabId
                }
            };

            chrome.runtime.sendMessage(message, function(response) {
                if (response && response.tabState) {
                    tabState = response.tabState;
                    expressionInput.value = tabState.searchString;
                }
            });
        });

    })();

});