"use strict";

/**
 * @module TabStateManager
 *      A static helper to keep track of the plugin state of each tabs.
 *      Internally, data is kept as an object with keys of {number} tabId 
 *      to values of {TabState} tabState (@see TabStateManager.TabState)
 *
 *      Public Methods: 
 *          setTabState({number} tabId, {TabState} tabState)
 *          getTabState({number} tabId)
 *          updateTabState({number} tabId, {TabState} tabState)
 *          clearTabState({number} tabId)
 *          clearTabStates()
 */
var TabStateManager = (function() {

    /**
     * @typedef {object}    TabState - Information on the plugin state of a specific tab
     * @prop    {boolean}   isActive - Whether the plugin is active or not (i.e. is user searching?)
     * @prop    {string}    searchString - The user's input search string
     * @prop    {RegExp}    searchRegex - The user's input search string as a JS RegExp object
     * @prop    {number}    matchCount - The number of search results
     * @prop    {number}    matchIndex - The current match (i.e. when user is cycling thru search results)
     */

    /**
     * @prop {object.<number, TabState>} tabStates
     *      An object (collection) of {number} tabId to {TabState} tabState.
     */
    var tabStates = {};

    /**
     * @method Sets the tabState for the specified tabId.
     * @param {number} tabId
     * @param {TabState} tabState
     * @return {TabState} The TabState that was saved.
     */
    function setTabState(tabId, tabState) {
        tabStates[tabId] = tabState;
        return tabState;
    }

    /**
     * @method Sets the tabState for the specified tabId.
     * @param {number} tabId
     * @return {TabState} The TabState for the specified tabId.
     */
    function getTabState(tabId) {
        return tabStates[tabId];
    }

    /**
     * @method Updates the tabState for specified tabId. If no tab state exists, sets it instead.
     * @param {number} tabId
     * @param {TabState} tabState - Partial TabState object, values are merged with existing
     * @return {TabState} The TabState that was saved.
     */
    function updateTabState(tabId, tabState) {
        var currentTabState = getTabState(tabId);

        if (!currentTabState)
            currentTabState = {};

        for (var prop in tabState) {
            currentTabState[prop] = tabState[prop];
        }

        return setTabState(tabId, currentTabState);
    }

    /**
     * @method Removes the stored tabState for the specified tabId.
     * @param {number} tabId
     */
    function clearTabState(tabId) {
        if (tabStates[tabId])
            delete tabStates[tabId];
    }

    /**
     * @method Removes the all stored tabStates.
     */
    function clearTabStates() {
        tabStates = {};
    }

    /** 
     * @exports - Public Methods
     */
    return {
        setTabState: setTabState,
        getTabState: getTabState,
        updateTabState: updateTabState,
        clearTabState: clearTabState,
        clearTabStates: clearTabStates
    };

})();

/* 
 * Chrome Startup Event
 * @param {function} - The event handler
 */
chrome.runtime.onStartup.addListener(function() {
    console.log('[BG] chrome.runtime.onStartup');
});

/* 
 * Tab Change Event
 * @param {function} - The event handler
 */
chrome.tabs.onActivated.addListener(function(tab) {
    console.log('[BG] chrome.browserAction.onClicked. tab: ', tab);

    var tabId = tab.tabId;
    var tabState = TabStateManager.getTabState(tabId);

    // see if current tab has active search. If so, place a 'on' badge on the plugin icon.
    if (tabState && tabState.isActive)
        chrome.browserAction.setBadgeText({ text: 'on', tabId: tabId });
    else
        chrome.browserAction.setBadgeText({ text: '', tabId: tabId });
});

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
    console.log('[BG] chrome.runtime.onMessage. Message: ', message) //, ' | Sender: ', sender);

    /**
     * @typedef {object} Message - Standard message object for in-plugin communication.
     * @prop    {string} sender - The sender process ('popup', 'content', 'background')
     * @prop    {string} target - The process meant to interpret message ('popup', 'content', 'background')
     * @prop    {string} request - The requested action
     * @prop    {object} data - Data for the requested action
     */

     // If the message's target isn't 'background', disregard it. 
    if (message.target !== 'background')
        return;
    
    var data = message.data; // aliasing the message's request data for convenience.

    switch (message.request) {

        case 'getTabState':
            console.log('[BG] onMessage "getTabState(tabId)". tabId: ', data.tabId);
            var tabState = TabStateManager.getTabState(data.tabId);

            var responseData = {
                tabState: tabState
            };

            sendResponse({
                error: null,
                data: responseData
            });
        break;

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

        case 'search':


            sendResponse({
                error: null
            });
        break;


        case 'clear':

            sendResponse({
                error: null
            });
        break;

    }

});