const popUp = (function() {

    let toggles = {
        'On/Off': {
            value: true,
        },
        'showPercentage': {
            value: true,
        },
    }

    /**
     * Initializing the popup
     */
    function load() {
        listenToChanges();
        loadFromStorage();
    }

    /**
     * Listening to every toggle change
     * and reacting by adding / removing the cookie
     */
    function listenToChanges() {
        const bg = chrome.extension.getBackgroundPage();

        document.addEventListener('click', function(e) {
            if(e.target.className === '_tlushimPopupToggle') {
                toggles[e.target.title].value = e.target.checked;
                setToggles();

                if (e.target.title === 'On/Off' && bg)
                    bg.Background.coreFunctions("toggleExtension");
                    
                if (e.target.title === 'showPercentage' && bg) {
                    bg.Background.coreFunctions("refreshExtension");
                }
            }
        });
    }

    /**
     * Sending all the toggles to the background
     */
    function setToggles() {
        chrome.runtime.sendMessage({method: "setItems", object: toggles});
    }

    /**
     * Loading the data from storage
     */
    function loadFromStorage() {
        chrome.runtime.sendMessage({method: "getItem", key: Object.keys(toggles)}, function(response) {
            if(Object.keys(response).length === 0) {
                setToggles();
                loadFromStorage();
            }
            else {
                Object.keys(response).forEach(key => {
                    toggles[key].value = response[key].value;
                    const input = document.querySelector('._tlushimPopupToggle[title="' + key + '"]');
                    if (input) {
                        input.checked = response[key].value;
                        input.value = response[key].value;
                    }
                    else
                        console.error(key + ' input not found');
                });
            }
        });
    }

    return {
        load: load
    }
})();

popUp.load();