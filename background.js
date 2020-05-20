var Background = (function() {

    /**
     * Installing the background plugin
     */
    function install() {
        listenToMessages();
    }

    /**
     * Running functions from popup into core
     * @param passed_message
     */
    function coreFunctions(passed_message) {
        
        if (passed_message === 'toggleExtension') {
            toggleExtension(passed_message);
        }
        else if (passed_message === 'refreshExtension') {
            toggleExtension(passed_message);
        }
        else {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if ( !tabs.length) return;

                chrome.tabs.sendMessage(tabs[0].id, {message: passed_message});
            });
        }
    }

    function toggleExtension(passed_message) {
        chrome.windows.getAll({populate:true}, function(windows) {
            windows.forEach(function(window) {
                window.tabs.forEach(function(tab) {
                    if(tab.url && tab.url.indexOf('tlushim.co.il') !== -1)
                        chrome.tabs.sendMessage(tab.id, {message: passed_message});
                });
            });
        });
    }

    /**
     * Listening to the messages
     */
    function listenToMessages() {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            switch (request.method) {
                case 'setItems':
                    setItems(request.object);
                    return false;
                case 'getItem':
                    getItem(request.key, sendResponse);
                    return true;
            }
        });
    }

    /**
     * Getting an item/s from the storage
     * @param key
     * @param sendResponse
     */
    function getItem(key, sendResponse) {
        if (typeof key === 'string') {
            key = [key];
        }
        chrome.storage.local.get(key, function(result) {
            sendResponse(result);
        });
    }

    /**
     * Saving the given obj to the storage
     * @param obj
     */
    function setItems(obj) {
        chrome.storage.local.set(obj);
    }

    return {
        install: install,
        coreFunctions: coreFunctions
    }
})();

Background.install();