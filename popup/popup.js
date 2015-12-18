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
    var nextButton          = document.getElementById('__eg-next__');
    var prevButton          = document.getElementById('__eg-prev__');

    var tabId;

    /**
     * @type {TabState} - tabState is an object containing information about this current tab.
     *      Properties are: isActive, searchString, searchRegex, matchCount, matchIndex.
     *      See TabState in background.js for more information (@see TabStateManager.TabState)
     */
    var tabState = {  // starts as a default object
        isActive: false,
        searchString: '',
        searchRegex: null,
        matchCount: 0,
        matchIndex: 0
    };

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

    /**
     * Handle Keypress Events on the search textbox.
     * Keys listened for are "Enter" (keyCode 13) and "Escape" (keyCode 27)
     * @param {HTMLEvent} event - The event object
     */
    function handleExpressionInputKeypress(event) {

        switch (event.keyCode) {

            // Enter key
            case 13:
                console.log('[POP] Enter keypress');

                // Read textbox value
                var inputString = expressionInput.value.trim();

                // if first run or if user changes input string, redo search
                if (!tabState || Object.keys(tabState).length === 0 || 
                        tabState.searchString.trim() === '' || 
                        tabState.searchString !== inputString) {

                    var isPreviouslyActive = tabState.isActive;

                    // Update the tabState with new input string.
                    // If user cleared out textbox, this tab is no longer active.
                    tabState = {
                        isActive: inputString !== '' ? true : false,
                        searchString: inputString,
                        searchRegex: stringToRegex(inputString),
                        matchCount: 0,
                        matchIndex: 0
                    };

                    // Update background process's store of tabStates before handling next steps.
                    updateTabState(tabState, function(response) {
                        // After background page responds with successful update

                        if (!tabState.isActive) { // if user cleared out textbox
                            clearSearch();
                        }
                        else if (isPreviouslyActive) { // if user changed search string in textbox
                            clearSearch(function() { 
                                doSearch();
                            });
                        }
                        else { // first run
                            doSearch();
                        }
                    });

                }
                else { // if search string didn't change, 'Enter' key advances search result on page
                    focusNextMatch();
                }

            break;

            // Escape key
            case 27: // TODO
                console.log('[POP] Escape keypress');
                debugger;



            break;

        }
    }

    /**
     * Parses a regex string into its regex body and regex flags.
     * @param {string} str - raw string
     * @return {RegExp} Javascript Regular Expression object (RegExp) 
     */
    function stringToRegex(str) {
        // TODO
        return new RegExp(str, 'gim');
    }

    /**
     * Messages the background process to update the state of this tab.
     * @param {TabState} tabState - tabState information to be saved in background's collection of tabStates
     * @param {function} callback - Callback function for Chrome's sendMessage callback
     */
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

    /**
     * Messages the content process to clear its search results.
     * @param {function} callback - Callback function for Chrome's sendMessage callback
     */
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

    /**
     * Messages the content process to perform a search.
     * @param {function} callback - Callback function for Chrome's sendMessage callback
     */
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

    /**
     * Messages the content process to focus the next search result.
     * @param {function} callback - Callback function for Chrome's sendMessage callback
     */
    function focusNextMatch() {
        if (!tabState.isActive)
            return;

        var message = {
            'sender': 'popup',
            'target': 'content',
            'request': 'focusNextMatch',
            'data': { }
        };

        chrome.tabs.sendMessage(tabId, message);
    }

    /**
     * Messages the content process to focus the previous search result.
     * @param {function} callback - Callback function for Chrome's sendMessage callback
     */
    function focusPrevMatch() {
        if (!tabState.isActive)
            return;

        var message = {
            'sender': 'popup',
            'target': 'content',
            'request': 'focusPrevMatch',
            'data': { }
        };

        chrome.tabs.sendMessage(tabId, message);
    }

    // Set up event handler
    expressionInput.addEventListener('keypress', handleExpressionInputKeypress);
    nextButton.addEventListener('click', focusNextMatch);
    prevButton.addEventListener('click', focusPrevMatch);

});