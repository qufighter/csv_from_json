var jsonDocumentString = '';
var loadedCbfs = [];
var docName = window.location.pathname.match(/[\w\.\-]+$/);

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
	if (request.getJsonDoc){
		if( !jsonDocumentString ){
			fetchProbablyJsonDocument(function(){
				chrome.runtime.sendMessage({
					enable:true,
					doc:jsonDocumentString,
					name:docName
				}, function(response){});
			});
			sendResponse();
		}else{
			sendResponse({
				doc:jsonDocumentString,
				name:docName
			});
		}
	}
});

function checkForJSON(){
	//before we send another http request, we might superficially detect json
	var path = window.location.pathname;
	var isProbablyJson = path.match(/\.json$/i);

	// a few ohter ways it might be JSON probably!!

	if( isProbablyJson ){
		fetchProbablyJsonDocument();
	}else{
		var isntJson = path == '/' || path.match(/\.chtml$|\.html$|\.htm|\.xml$|\.js$|\.css$/i)
		if( !isntJson ){
			var firstChar = document.body.innerText.charAt(0);
			if( firstChar == '{' || firstChar == '[' || window.json ){
				fetchProbablyJsonDocument();
			}else{
				console.log('JSON to CSV failed to detect this document as being JSON: ', firstChar);
			}
		}else{
			//console.log('JSON to CSV failed to detect this document as being JSON');
		}
	}
}

function fetchProbablyJsonDocument(cbf){
	if(cbf)loadedCbfs.push(cbf);

	var req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if (req.readyState === 4){
			
			var headers = req.getAllResponseHeaders().toLowerCase();
			//console.log('found following headers:', headers);

			try{
				var docJson = JSON.parse(req.responseText);
				chrome.runtime.sendMessage({enable:true}, function(response){});
				jsonDocumentString = req.responseText;
				callAllLoadedCbf();
				//console.log('seems to be json and is ready')
			}catch(e){
				console.log('was not json', e)

			}
		}
	}
	req.open('GET', document.location, true);
	req.send(null);	
}

function callAllLoadedCbf(){
	for( var x=0,l=loadedCbfs.length; x<l; x++ ){
		loadedCbfs[x]();
	}
	loadedCbfs=[];
}

checkForJSON();
