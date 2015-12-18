"use strict";

var __ExpressionG = (function() {

    /**
     * @type {TabState} - tabState is an object containing information about this current tab.
     *      Properties are: isActive, searchString, searchRegex, matchCount, matchIndex.
     *      See TabState in background.js for more information (@see TabStateManager.TabState)
     */
    var tabState = {
        isActive: false, // content script doesn't care about active state
        searchString: '',
        searchRegex: null,
        matchCount: 0,
        matchIndex: 0
    };

    var _HIGHLIGHT_ID_TEMPLATE = "__expression-g-match-%ID%__";
    var _HIGHLIGHT_CLASS = "__expression-g-highlight__";
    var _HIGHLIGHT_FOCUS_CLASS = "__expression-g-highlight-focus__";

    /**
     * Gets tabState
     * @return {TabState} tabState
     */
    function getTabState() {
        return tabState;
    }

    /**
     * Sets tabState
     * @param {TabState} newTabState - The new tabState
     */
    function setTabState(newTabState) {
        tabState = newTabState;
        tabState.searchRegex = stringToRegex(tabState.searchString); // duplicating this function here cause for some reason, RegExp object is not being passed properly.
    }

    /**
     * NOTE: This is duplicated from popup.js for the time being
     * Parses a regex string into its regex body and regex flags
     * @param {string} str - raw string
     * @return {RegExp} Javascript Regular Expression object (RegExp) 
     */
    function stringToRegex(str) {
        // TODO
        return new RegExp(str, 'gim');
    }

    /**
     * @private
     * Creates an element for the text to be highlighted.
     * Highlight Nodes are <mark> tags with specified id and class.
     * @param {string} text - Text content of the node
     * @param {number} matchIndex - The highlight's index number (used for id)
     * @return {HTMLElement} The <mark> element
     */
    function _createHighlightNode(text, matchIndex) {
        var highlightNode = document.createElement('mark');
        var textNode = document.createTextNode(text);

        highlightNode.id = _HIGHLIGHT_ID_TEMPLATE.replace('%ID%', matchIndex);
        highlightNode.classList.add(_HIGHLIGHT_CLASS);

        highlightNode.appendChild(textNode);

        return highlightNode;
    }

    /**
     * @private
     * Performs a regex search on the text content of a node.
     * Nodes that have search matches will be broken apart.
     * Un-matched text portions will become its own text node.
     * Matched text portions will become a highlight element with matched text as content (@see _createHighlightNode).
     * The un-matched text and matched text portions will be placed in order as the new node content,
     * in place of its original text node content.
     * @param {HTMLElement} node - The HTML element to process
     * @param {RegExp} searchRegex - The RegExp object to search with
     */
    function _processNode(node, searchRegex) {
        var nodeText = node.nodeValue; // this is the text content
        var matches = nodeText.match(searchRegex); // matched text becomes an array of strings

        if (!matches || matches.length === 0)
            return;

        var textIndex = 0; // index to beginning text
        var parentNode = node.parentNode;
        var replacementNode = document.createDocumentFragment(); // create temporary element

        // for every match in the matches array,
        // make the text portion from the previous matchIndex (or beginning) as a new textNode
        // and make the current match as a new element that highlights the current match (@see _createHighlightNode).
        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            var matchIndex = nodeText.indexOf(match, textIndex); // index of search match (after textIndex)

            // create textNode of un-matched text from after previous search match (or beginning)
            // to right before this current text match.
            var prevTextPortionNode = document.createTextNode(
                nodeText.substring(textIndex, matchIndex)
            );
            replacementNode.appendChild(prevTextPortionNode); // append to temporary element

            // create a highlight node out of the matched text
            var highlightNode = _createHighlightNode(match, tabState.matchCount);

            replacementNode.appendChild(highlightNode); // and append to temporary element

            textIndex = matchIndex + match.length; // move the index to right after this current text match

            tabState.matchCount += 1; // increment number of matches found in this tab
        }

        // After all matched texts have been made into a highlight element,
        // make all remaining text portion as a final textNode
        var remainderTextPortionNode = document.createTextNode(
            nodeText.substring(textIndex)
        );
        replacementNode.appendChild(remainderTextPortionNode);

        // Finally replace the original text content with the new temporary element
        parentNode.replaceChild(replacementNode, node);
    }

    /**
     * Performs a regex search on the entire page by processing every node that is a textNode.
     */
    function doSearch() {
        if (tabState.searchString.trim() === '')
            return;

        document.body.normalize();

        var nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);

        var nodesToProcess = [];
        var currentNode;

        while (currentNode = nodeIterator.nextNode()) {
            nodesToProcess.push(currentNode);
        }

        for (var i = 0; i < nodesToProcess.length; i++) {
            _processNode(nodesToProcess[i], tabState.searchRegex);
        }

        if (tabState.matchCount > 0) // if this page does have matches, start off by highlighting first one
            _focusMatchIndex(0);
    }

    /**
     * Clears all search results and highlights on page
     */
    function clearSearch() {
        resetTabState();

        var selectorString = 'mark.' + _HIGHLIGHT_CLASS;
        var highlightNodes = document.querySelectorAll(selectorString);

        for (var i = 0; i < highlightNodes.length; i++) {
            var highlightNode = highlightNodes[i];

            var textNode = document.createTextNode(highlightNode.textContent);

            highlightNode.parentNode.insertBefore(textNode, highlightNode);
            highlightNode.parentNode.removeChild(highlightNode);
        }

        document.body.normalize();
    }

    /**
     * @private
     * Unfocuses the selected matchIndex. Unfocuses removes the focus css class.
     * @param {number} matchIndex
     */
    function _unfocusMatchIndex(matchIndex) {
        var selectorString = 'mark#' + _HIGHLIGHT_ID_TEMPLATE.replace('%ID%', matchIndex);
        var highlightNode = document.querySelector(selectorString);

        if (!highlightNode)
            return;

        highlightNode.classList.remove(_HIGHLIGHT_FOCUS_CLASS);
    }

    /**
     * @private
     * Focuses the selected matchIndex. Focus simply applies the focus css class
     * @param {number} matchIndex
     */
    function _focusMatchIndex(matchIndex) {
        var selectorString = 'mark#' + _HIGHLIGHT_ID_TEMPLATE.replace('%ID%', matchIndex);
        var highlightNode = document.querySelector(selectorString);

        if (!highlightNode)
            return;

        highlightNode.classList.add(_HIGHLIGHT_FOCUS_CLASS);

        highlightNode.scrollIntoViewIfNeeded(true);
    }

    /**
     * Moves the focus onto the next search result.
     */
    function focusNextMatch() {
        _unfocusMatchIndex(tabState.matchIndex);
        tabState.matchIndex = (++tabState.matchIndex) % tabState.matchCount;
        _focusMatchIndex(tabState.matchIndex);
    }

    /**
     * Moves the focus onto the previous search result.
     */
    function focusPrevMatch() {
        _unfocusMatchIndex(tabState.matchIndex);
        tabState.matchIndex = (--tabState.matchIndex) % tabState.matchCount;
        _focusMatchIndex(tabState.matchIndex);
    }

    /**
     * Resets tabState
     */
    function resetTabState() {
        tabState = {
            isActive: false,
            searchString: '',
            searchRegex: null,
            matchCount: 0,
            matchIndex: 0
        };
    }

    /** 
     * @exports - Public Methods
     */
    return {
        getTabState: getTabState,
        setTabState: setTabState,
        doSearch: doSearch,
        clearSearch: clearSearch,
        focusNextMatch: focusNextMatch,
        focusPrevMatch: focusPrevMatch,
        resetTabState: resetTabState
    };

})();

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
            console.log('[Content] onMessage "setTabState(tabState)". tabState: ', data.tabState);

            __ExpressionG.setTabState(data.tabState);

            sendResponse({
                error: null
            });
        break;

        case 'doSearch':
            console.log('[Content] onMessage "doSearch(tabState)". tabState: ', data.tabState);

            __ExpressionG.setTabState(data.tabState);
            __ExpressionG.doSearch();

            sendResponse({
                error: null,
                tabState: __ExpressionG.getTabState()
            });
        break;


        case 'clearSearch':
            console.log('[Content] onMessage "clearSearch()".');

            __ExpressionG.clearSearch();

            sendResponse({
                error: null,
                tabState: __ExpressionG.getTabState()
            });
        break;

        case 'focusNextMatch':
            console.log('[Content] onMessage "focusNextMatch()".');

            __ExpressionG.focusNextMatch();

            sendResponse({
                error: null,
                tabState: __ExpressionG.getTabState()
            });
        break;

        case 'focusPrevMatch':
            console.log('[Content] onMessage "focusPrevMatch()".');

            __ExpressionG.focusPrevMatch();

            sendResponse({
                error: null,
                tabState: __ExpressionG.getTabState()
            });
        break;

    }

});