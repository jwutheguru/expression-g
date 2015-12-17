"use strict";

/**
 *      ======== ENTRY POINT ========
 * Document DOMContentedLoaded Event Handler.
 * This event is triggered when user clicks on the ExpressionG plugin icon.
 * Therefore this is the entry point for the extension.
 */
document.addEventListener('DOMContentLoaded', function() {

    // Grab page elements
    var expressionInput     = document.getElementById('__eg-expression__');
    var prevButton          = document.getElementById('__eg-prev__');
    var nextButton          = document.getElementById('__eg-next__');

    var tabId;

    /**
     * @type {TabState} - tabState is an object containing information about this current tab.
     *      Properties are: isActive, searchString, searchRegex, matchCount, matchIndex.
     *      See TabState in background.js for more information (@see TabStateManager.TabState)
     */
    var tabState = {}; // starts as blank object

    var doWait = false; // boolean flag for deferring events when messages are being passed.

    /**
     * Immediately-invoked upon page load. 
     * Grab tabId, tabState, and set search string in input (if tab was previously in active search)
     */
    (function init() {

        // Ask Chrome about current active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // After Chrome responds, send message to background page for this tab's state

            tabId = tabs[0].id;

            var message = {
                'sender': 'popup',
                'target': 'background',
                'request': 'getTabState',
                'data': {
                    tabId: tabId
                }
            };

            chrome.runtime.sendMessage(message, function(response) {
                // After background page responds with this tab's tabState

                // If background page holds a tabState for this tab, assign it.
                if (!response.error && response.data && response.data.tabState) {
                    tabState = response.data.tabState;
                    expressionInput.value = tabState.searchString;
                }
            });
        });

    })();

    function handleExpressionInputKeypress(event) {

        switch (event.keyCode) {

            // Enter key
            case 13:
                console.log('[POP] Enter keypress');
                debugger;

                var inputString = expressionInput.value.trim();

                // if first run or if user changes input string, redo search
                if (!tabState || Object.keys(tabState).length === 0 || 
                        tabState.searchString.trim() === '' || 
                        tabState.searchString !== inputString) {

                    var isPreviouslyActive = tabState.isActive;

                    tabState = {
                        isActive: true,
                        searchString: inputString,
                        searchRegex: stringToRegex(inputString),
                        matchCount: 0,
                        matchIndex: 0
                    };

                    updateTabState(tabState, function(response) {
                        debugger;
                        // After background page responds with successful update

                        if (isPreviouslyActive) {
                            clearSearch(doSearch);
                        }
                        else {
                            doSearch();
                        }
                    });



                }
                else { // if search string didn't change, 'Enter' key advances search result on page

                }

            break;

            // Escape key
            case 27:
                console.log('[POP] Enter keypress');
                debugger;



            break;

        }
    }

    function stringToRegex(str) {
        // TODO
        return new RegExp(str, 'gim');
    }

    function updateTabState(tabState, callback) {
        var message = {
            'sender': 'popup',
            'target': 'background',
            'request': 'updateTabState',
            'data': {
                tabId: tabId,
                tabState: tabState
            }
        };

        if (typeof callback === 'function')
            chrome.runtime.sendMessage(message, callback);
        else
            chrome.runtime.sendMessage(message);
    }

    function clearSearch(callback) {
        var message = {
            'sender': 'popup',
            'target': 'content',
            'request': 'clearSearch',
            'data': { }
        };

        if (typeof callback === 'function')
            chrome.tabs.sendMessage(tabId, message, callback);
        else
            chrome.tabs.sendMessage(tabId, message);
    }

    // function clearSearchResults(callback) {
    //     var message = {
    //         command: 'clear',
    //     };

    //     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    //         chrome.tabs.sendMessage(tabs[0].id, message, function(res) {
    //             if (typeof callback === 'function')
    //                 callback.call(null, res);
    //         });
    //     });
    // }

    function doSearch(callback) {
        var message = {
            'sender': 'popup',
            'target': 'content',
            'request': 'doSearch',
            'data': {
                tabState: tabState
            }
        };

        if (typeof callback === 'function')
            chrome.tabs.sendMessage(tabId, message, callback);
        else
            chrome.tabs.sendMessage(tabId, message);
    }

    // function doSearch(regexStr) {
    //     regexStr = regexStr.trim();

    //     var message = {
    //         command: 'search',
    //         regexStr: regexStr
    //     };

    //     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    //         chrome.tabs.sendMessage(tabs[0].id, message);
    //     });
    // }

    // Set up event handler
    expressionInput.addEventListener('keypress', handleExpressionInputKeypress);

});