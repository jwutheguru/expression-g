var TabStateManager = (function() {

    var tabStates = {};

    function setTabState(tabId, tabState) {
        tabStates[tabId] = tabState;
        return tabState;
    }

    function getTabState(tabId) {
        return tabStates[tabId];
    }

    function updateTabState(tabId, tabStateUpdate) {
        var tabState = getTabState(tabId);

        if (!tabState)
            tabState = {};

        for (var prop in tabStateUpdate) {
            tabState[prop] = tabStateUpdate[prop];
        }

        return setTabState(tabId, tabState);
    }

    function clearTabState(tabId) {
        if (tabStates[tabId])
            delete tabStates[tabId];
    }

    function clearTabStates() {
        tabStates = {};
    }

    return {
        setTabState: setTabState,
        getTabState: getTabState,
        clearTabState: clearTabState,
        clearTabStates: clearTabStates
    };

})();

chrome.runtime.onStartup.addListener(function() {
    console.log('chrome.runtime.onStartup');
});

chrome.tabs.onActivated.addListener(function(tab) {
    console.log('chrome.browserAction.onClicked ' + tab);

    var tabId = tab.tabId;
    var tabState = TabStateManager.getTabState(tabId);

    if (!tabState) {
        var coinFlip = !!(~~(Math.random() * 2));

        if (coinFlip) {
            var state = {
                isActive: true,
                searchString: 'blah'
            };

            tabState = TabStateManager.setTabState(tabId, state);
        }
    }

    if (tabState && tabState.isActive)
        chrome.browserAction.setBadgeText({ text: 'on' });
    else
        chrome.browserAction.setBadgeText({ text: '' });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.group('[Background] chrome.runtime.onMessage');
    console.log(message);
    console.groupEnd();

    if (message.target !== 'background')
        return;
    
    switch (message.command) {

        case 'tabState':
            var tabState = TabStateManager.getTabState(message.data.tabId);
            console.log(tabState);
            sendResponse({
                tabState: tabState
            });
        break;

        case 'search':


            sendResponse({
                success: true
            });
        break;


        case 'clear':

            sendResponse({
                success: true
            });
        break;

    }

});