"use strict";

var __ExpressionG = (function() {

    var tabState = {
        isActive: false,
        searchString: '',
        searchRegex: null,
        matchCount: 0,
        matchIndex: 0
    };

    var MARK_ID_TEMPLATE = "__expression-g-match-%ID%__";
    

})();



function doSearch() {

}

function clearSearch() {

}

/* 
 * Plugin Message Event
 *      Here we handle messages passed around between 
 *      the plugin's popup, content, and background scripts.
 *
 * @param {object<Message>} message - The Message object sent by plugin. (@see Message)
 * @param {object} sender - Chrome-provided information on sender (includes id and url)
 * @param {function} sendResponse - Callback function to call once request is completed 
 *                                      Must be provided by whatever triggered sendMessage.
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('[Content] chrome.runtime.onMessage. Message: ', message) //, ' | Sender: ', sender);

    /**
     * @typedef {object} Message - Standard message object for in-plugin communication.
     * @prop    {string} sender - The sender process ('popup', 'content', 'background')
     * @prop    {string} target - The process meant to interpret message ('popup', 'content', 'background')
     * @prop    {string} request - The requested action
     * @prop    {object} data - Data for the requested action
     */

     // If the message's target isn't 'content', disregard it. 
    if (message.target !== 'content')
        return;
    //debugger;
    var data = message.data; // aliasing the message's request data for convenience.

    switch (message.request) {

        case 'setTabState':
            console.log('[BG] onMessage "setTabState(tabId, tabState)". tabId: ', data.tabId, ' | tabState: ', data.tabState);
            var tabState = TabStateManager.setTabState(data.tabId, data.tabState);

            if (tabState && tabState.isActive)
                chrome.browserAction.setBadgeText({ text: 'on', tabId: data.tabId });
            else
                chrome.browserAction.setBadgeText({ text: '', tabId: data.tabId });
            
            sendResponse({
                error: null,
                tabState: tabState
            });
        break;

        case 'updateTabState':
            console.log('[BG] onMessage "updateTabState(tabId, tabState)". tabId: ', data.tabId, ' | tabState: ', data.tabState);
            var tabState = TabStateManager.updateTabState(data.tabId, data.tabState);

            if (tabState && tabState.isActive)
                chrome.browserAction.setBadgeText({ text: 'on', tabId: data.tabId });
            else
                chrome.browserAction.setBadgeText({ text: '', tabId: data.tabId });
            
            sendResponse({
                error: null,
                tabState: tabState
            });
        break;

        case 'doSearch':


            sendResponse({
                error: null
            });
        break;


        case 'clearSearch':

            sendResponse({
                error: null
            });
        break;

    }

});