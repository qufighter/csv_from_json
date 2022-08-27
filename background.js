chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.enable){
		chrome.action.setIcon({tabId:sender.tab ? sender.tab.id : request.tabId, path:{19:'images/icon19.png',38:'images/icon38.png'}}, function(){})
		sendResponse({});
	}else if(request.disable){
		chrome.action.setIcon({tabId:sender.tab ? sender.tab.id : request.tabId, path:{19:'images/inactive/icon19.png',38:'images/inactive/icon38.png'}}, function(){})
		sendResponse({});
    }else if(request.getJsonFile){
        var fromTab = sender.tab ? sender.tab.id : null;
        var source = sender.source;
        //console.log('request.getJsonFile', fromTab, request.getJsonFile);
        fetch(request.getJsonFile)
        .then(function(response){return response.text()})
        .then(function(responseText){
            if( fromTab && source !='popup' ){
                chrome.tabs.sendMessage(fromTab,{gotJsonDocument:responseText},function(r){});
            }else{
                chrome.runtime.sendMessage({gotJsonDocument:responseText}, function(r){});
            }
        })
        .catch((error) => {
          console.error('Error:', error, request);
        });
        
        sendResponse({});
	}else{
		sendResponse({});
	}
});
