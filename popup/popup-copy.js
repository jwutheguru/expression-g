document.addEventListener('DOMContentLoaded', function() {
    
    var expressionInput = document.getElementById('__eg-expression__');
    var prevButton = document.getElementById('__eg-prev__');
    var nextButton = document.getElementById('__eg-next__');

    expressionInput.addEventListener('keypress', function(event) {
        if (event.keyCode === 13) { // Enter
            var regexStr = expressionInput.value;
            if (!isValidRegexStr(regexStr))
                return;

            regexStr = sanitizeRegexStr(regexStr);

            clearSearchResults(function() {                
                doSearch(regexStr);
            });
        }
        else if (event.keyCode === 27) { // Escape
            clearSearchResults();
        }
    });

    function isValidRegexStr(regexStr) {
        // TODO
        return true;
    }

    function sanitizeRegexStr(regexStr) {
        regexStr.replace(/\\/g, '\\');

        // trim beginning and ending '/'
        // if (regexStr[0] === '/')
        //     regexStr = regexStr.substring(1);
        // if (regexStr[regexStr.length - 1] == '/')
        //     regexStr = regext.substring(0, regexStr.length - 1);

        return regexStr;
    }

    function clearSearchResults(callback) {
        var message = {
            command: 'clear',
        };

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, function(res) {
                if (typeof callback === 'function')
                    callback.call(null, res);
            });
        });
    }

    function doSearch(regexStr) {
        regexStr = regexStr.trim();

        var message = {
            command: 'search',
            regexStr: regexStr
        };

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message);
        });
    }

});