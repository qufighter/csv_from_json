chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.enable){
		//chrome.pageAction.show(sender.tab.id)
		//pageAction.setIcon closes a pageAction popup that is already showing on Vista, we try to avoid calling this redundantly
		chrome.browserAction.setIcon({tabId:sender.tab.id, path:{19:'images/icon19.png',38:'images/icon38.png'}}, function(){})
		sendResponse({});
	}else if(request.disable){
		//chrome.pageAction.hide()
		chrome.browserAction.setIcon({tabId:sender.tab.id, path:{19:'images/inactive/icon19.png',38:'images/inactive/icon38.png'}}, function(){})
		sendResponse({});
	}else{
		sendResponse({});
	}
});

