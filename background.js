chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.enable){
		chrome.action.setIcon({tabId:sender.tab.id, path:{19:'images/icon19.png',38:'images/icon38.png'}}, function(){})
		sendResponse({});
	}else if(request.disable){
		chrome.action.setIcon({tabId:sender.tab.id, path:{19:'images/inactive/icon19.png',38:'images/inactive/icon38.png'}}, function(){})
		sendResponse({});
    }else if(request.getJsonFile){
        var fromTab = sender.tab.id;
        //console.log('request.getJsonFile', fromTab, request.getJsonFile);
        fetch(request.getJsonFile)
        .then(function(response){return response.text()})
        .then(function(responseText){
            chrome.tabs.sendMessage(fromTab,{gotJsonDocument:responseText},function(r){});
        })
        .catch((error) => {
          console.error('Error:', error);
        });
        
        sendResponse({});
	}else{
		sendResponse({});
	}
});
