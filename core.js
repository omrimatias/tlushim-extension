const url = String(window.location.href);

/**
 * Listening to the messages
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {        
    switch(request.message) {
        case 'toggleExtension':
            Tlushim.toggle();
            break;
        case 'refreshExtension':
            Tlushim.refresh();
            break;
    }
});

if (url.indexOf('www.tlushim.co.il') !== -1) {
    chrome.runtime.sendMessage({method: "getItem", key: ['On/Off', 'showPercentage', 'showTimeOnBlank']}, function (response) {
        
        if (response['On/Off'] === undefined || response['On/Off'].value)
            Tlushim.install({
                showPercentage: response['showPercentage'] === undefined || response['showPercentage'].value,
                showTimeOnBlank: response['showTimeOnBlank'] === undefined || response['showTimeOnBlank'].value,
            });
    });
}
