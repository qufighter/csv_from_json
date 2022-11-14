var tabid=0,winid=0,jsonloaded=false;
var xcellController;
//var docJsObj = null;
var docJsName = '';
var currentTab;
var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
var alreadyGotDocument = false;

function _gel(g){
	return document.getElementById(g);
}

// getting messages from our sandbox'd frame...
window.addEventListener("message", function(ev){
    // anticipation: ev.data is JSON doc
    console.log('csv_from_json sandbox sent message to popup...', Object.keys(ev.data))
    if( ev.data.gotmsg || ev.data.gotdoc ){
        
        var messagesArr = [];
        var messageArea = _gel('messages');
        try{
            console.log('mesages', ev.data.gotmsg)
            messagesArr = JSON.parse(ev.data.gotmsg);
        }catch(e){
            // todo handle this
            console.error('message parse failure', e);
        }
        for( var m=0; m<messagesArr.length; m++ ){
            Cr.elm('div',{},[Cr.txt(messagesArr[m])],messageArea);
        }
        
        var result = [];
        try{
            result = JSON.parse(ev.data.gotdoc);
            if( messagesArr.length < 1 ){
                localStorage["lastScript"] = _gel('transform').value; // we may wish to cache more script than the last good one....
                console.warn('successful script was saved... ')
            }
        }catch(e){
            // todo handle this
            console.error('doc result parse failure', e);
        }
        previewJsonDoc(result);
    }
});


function popupimage(mylink, windowname)
{
	var w=Math.round(window.outerWidth*1.114),h=Math.round(window.outerHeight*1.15);
	chrome.windows.create({url:mylink.href,width:w,height:h,type:"panel"},function(win){});
	return false;
}

function popOut(){
	popupimage({href:chrome.runtime.getURL('popup.html')+'#'+winid},"JSON to CSV : Chrome Extension");
	ev.preventDefault();
}

function revealTab(ev){
	chrome.tabs.update(tabid,{active:true});
	chrome.windows.update(winid,{focused:true}); // drawAttention:true
	chrome.windows.getCurrent({}, function(window){
		chrome.windows.update(window.id,{focused:true});
	});
	ev.preventDefault();
}

function dataToFile(data, type, saveFileName){
	var binary = atob(data);
	var array = [];
	for(var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	return new File([new Uint8Array(array)], saveFileName, {type: type});
}

function makeSaveButton(saveBtn, fileName, data){
	saveBtn.download=unescape(fileName);
	data = new Blob(["\ufeff", data]);
	saveBtn.href = URL.createObjectURL(data);
}

function parseJsArea(ev){

    var messageArea = _gel('messages');
    Cr.empty(messageArea);
    
    removeNotice();
    
	var jsScript = _gel('transform').value;
    _gel('sandboxed_frame').contentWindow.postMessage('want-new-result-for:'+jsScript, '*');

}


function gotJsonDoc(name, doc){
    if(alreadyGotDocument){
        //console.warn("we already got a document, so this one will be ignored:", name, doc);
        console.warn("we already got a document, so this one will be ignored");
        return;
    }else{
        console.log("DOCUMENT LOADED (popup.js)");
    }
	if(!doc) return;
    

    var currentValue=_gel('transform').value;
    if( !currentValue ) _gel('transform').value="json";

    if( localStorage["lastScript"] ){
        if( !currentValue || prompt("Conundrum, clear current script replacing value in storage?\n\nStored Value:\n\n"+localStorage["lastScript"]+"\n\nIf you press OK you will save the above and loose what is below.\n\nCurrently Edited Script (copy if you need it):", currentValue)){
            _gel('transform').value = localStorage["lastScript"];
        }
    }
    
    console.log('csv_from_json sending messsage to sandbox....')
    _gel('sandboxed_frame').contentWindow.postMessage({
        opt: {
            lazyJsEnabled: localStorage['lazyJsEnabled'] != 'false',
            lodashJsEnabled: localStorage['lodashJsEnabled'] != 'false',
            lodashFullJsEnabled: localStorage['lodashFullJsEnabled'] != 'false',
            autoParse: localStorage["autoParse"]!='false'
        },
        tx: _gel('transform').value,
        doc: doc
    }, '*');

    
    removeNotice();
    jsonloaded=true;
    docJsName = name;
    alreadyGotDocument = true;

    if( !localStorage["autoParse"]!='false' ) showNotice("press Evaluate to continue...");
}

function dupeAtTop(btn){
	var save2 = btn.cloneNode(true);
	save2.id = save2.id + '2';
	Cr.insertNodes(save2, document.body, document.body.firstChild);
}

function validateFlatListExport(previewDocJsObj){
    // each row may have arbatrary keys, each row must have hte same keys to avoid some problems later on....
    var foundKeys={};
    var k, i=0, l=previewDocJsObj.length;
    var defVal = localStorage["flatListDefaultVal"] || 'NULL';
    for( i=0,l=previewDocJsObj.length; i<l; i++ ){
        for( k in previewDocJsObj[i] ){
            foundKeys[k] = 1;
        }
    }
    for( i=0,l=previewDocJsObj.length; i<l; i++ ){
        for( k in foundKeys ){
            if( !previewDocJsObj[i][k] && typeof(previewDocJsObj[i][k]) == 'undefined' ){
                previewDocJsObj[i][k] = defVal;
            }
        }
    }
    return previewDocJsObj;
}

function previewJsonDoc(previewDocJsObj){
	var csvData = {}, parsedData = null;
	if( localStorage["simpleExport"]!='false' ){
		if( localStorage["flatListExport"]!='false' ){
            if( localStorage["validateFlatListExport"]!='false' ){
                previewDocJsObj=validateFlatListExport(previewDocJsObj);
            }
			csvData = CSVfromJSON.getFlatList(previewDocJsObj);
		}else{
			csvData = CSVfromJSON.getJsonMode2(previewDocJsObj);
		}
	}else{
		csvData = CSVfromJSON.getJsonMode1(previewDocJsObj);
	}

	if( csvData.csv ){
		parsedData = csvData.result;
		csvData = csvData.csv;
	}

	removeNode(_gel('save'));
	removeNode(_gel('save2'));

	var saveBtn=Cr.elm('a',{style:'cursor:pointer;',id:'save'},[Cr.txt('Download')]);
	makeSaveButton(saveBtn, docJsName+'.csv', csvData);
	Cr.insertNodes(saveBtn, document.body, _gel('content').nextSibling);

	

	dupeAtTop(saveBtn);

	previewCsvData(csvData, parsedData);
}

var createOptionsLinksOnce = function(){
	// if( localStorage["simpleExport"]=='true' ){
	// 	Cr.elm('span',{},[Cr.txt(' Simplified CSV, see ')],document.body);
	// }
	Cr.insertNodes(Cr.elm('a',{href:'#',event:['click',visitOptions]},[ Cr.txt('Options') ]), document.body, document.body.firstChild);

	if(!popoutMode){
		Cr.elm('input',{title:'Seperate window',type:'button',class:'pop rfloat',value:'Popout',events:['click',popOut]},[],document.body)
	}else{
		Cr.elm('a',{events:['click',revealTab],class:'rfloat link',href:'#'},[Cr.txt('Reveal Tab')], document.body)
	}

	createOptionsLinksOnce = function(){};
}

function removeNode(node){
	if( node && node.parentNode ){
		node.parentNode.removeChild(node);
	}
}

function previewCsvData(csvData, parsedData){
	var conatinerElm = Cr.elm('div',{id:'preview'});
	if( localStorage["spreadsheetView"]!='false' ){
		preview_spreadsheet(conatinerElm, csvData, parsedData);
	}else{
		preview_plain(conatinerElm, csvData);
	}
}

function preview_spreadsheet(conatinerElm, csvData, parsedData){
	var parsedCsv = parsedData ? parsedData : XcellifyCsv.parse(csvData);
	var cols = parsedCsv.maxCols; // csvData[0].length
	var rows = parsedCsv.maxRows; // csvData.length
	var tableData = parsedCsv.rows;
	var c, r, rowElm;

	rowElm = Cr.elm('div',{class:"headingrow row xcellrow"},[],conatinerElm);

	// Cr.elm('div',{class:"cell cellheading",  event:['click', selectAll]},[
	// 	Cr.elm('div',{},[Cr.txt("Select All")])
	// ],rowElm);

	// for( c=0; c<cols; c++ ){
	// 	Cr.elm('div',{class:"cell cellheading xcellheading", 'data-col':c, event:['click', selectColumn], 'data-col-search':tableData[0][c]},[
	// 		Cr.elm('div',{},[Cr.txt(tableData[0][c])])
	// 	],rowElm);
	// }

	for( r=0; r<rows; r++ ){
		rowElm = Cr.elm('div',{class:"xcellrow row", 'data-row-search':'row'+r},[],conatinerElm);

		// Cr.elm('div',{class:"cell cellheading xcellheading", 'data-row':r},[
		// 	Cr.elm('div',{},[Cr.txt('row'+r)])
		// ],rowElm);

		for( c=0; c<cols; c++ ){
			var style='';
			var value = tableData[r][c];
			var cellElements=[
				Cr.elm('input',{class:'xcellinput',type:'text', value: value})
			];

			if( value && value.charAt && value.charAt(value.length-1) == ':' ){
				cellElements[0].classList.add('alignRight')
			}

			Cr.elm('div',{class:"cell xcellcell", style:style, 'data-col-search':tableData[r][c]},cellElements,rowElm);
		}
	}

	var content = _gel('content');
	Cr.empty(content);
	content.appendChild(conatinerElm);

	if(localStorage['xcellify'] == 'false') return;

	xcellController = new Xcellify({
		containerElm: conatinerElm, 		// scope event listening and processing to a specific context, you can think <table>
		// selectors must be valid in querySelectorAll, just add a unique class to cells and rows to identify them
		cellSelector: '.xcellcell', 		// must be unique to cells that contain > input.cellInputClassName (i.e not headings), (think 'td.xcellcell')
		rowSelector: '.xcellrow',			// must be unique to rows that contain the cells input.cellInputClassName (think 'tr.xcellrow', currently mandatory see rebuildIndex)
		cellInputClassName: 'xcellinput',	// input elements that have the class will be the source of keyboard and click events
		headingClassName: 'xcellheading',	// supports col and row headings, heading must be within a .rowSelector - except for top row only one allowed per row
		skipInvisibleCells: false
	});
}

function preview_plain(conatinerElm, csvData){
	Cr.elm('pre',{},[
		Cr.txt(csvData)
	], conatinerElm );
	var content = _gel('content');
	Cr.empty(content);
	content.appendChild(conatinerElm);
}

function visitOptions(){
  window.open(chrome.runtime.getURL("options.html"));
}

function tryAndLoad(){
	if(!currentTab) return;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange=function(){
		if(xhr.readyState == 4){
			filename = currentTab.split('?')[0].split('/');
			filename = filename[filename.length -1];
            console.log('loaded via xmlhttp directly from popup...');
			
            
            try{
                var docJson = JSON.parse(xhr.responseText);
                gotJsonDoc(filename, xhr.responseText);
                // we could tell the bg page to activate the icon... etc...
                chrome.runtime.sendMessage({enable:true, tabId: tabid}, function(response){});
            }catch(e){
                console.log('was not json', e)
            }
            
		}
	};
	xhr.open('GET', currentTab, true);
	xhr.send();
}

function begiinWithWindow(){
	chrome.tabs.query({windowId: winid, active: true}, function(tabs){
		var tab = tabs[0];
        
        // deal breaker: sometimes in MV3 the tab.url is MISSING (wtf) and sometimes it is there (double wtf...)
        // should we ALSO try to exec our content script???
        // (and both ways??? eg add the doc to head (as though we are on an extension html page) and also with evaluateScript???
        /// since we don't know what type of page we are on??!?!?! because somehow URL is missing?!?!?!!?!?
        
        
        // WHen the tab has a URL we will try to fetch it above with xmlhttp and also via bg page.... that is if the content scirpt won't report first....
        
		currentTab = tab.url;
		tryAndLoad();

		tabid=tab.id;
        console.log('popup trying to reach tab id....', tabid);
        
		chrome.tabs.sendMessage(tabid,{getJsonDoc:true},function(r){
			if( r && r.name ){
				gotJsonDoc(r.name, r.doc);
			}else{
				console.log('seems to not be a JSON document! Or its taking too long to load...', r, tab);
                
                if( tab.url.indexOf( '//'+chrome.runtime.id+'/' ) > -1 ){
                    // maybe the BG page can jsut fetch this for us instead of the content script!
                    console.log('content scripts cannot run on this type of page.... (extension files...)')
                }
                
                console.log('asking bg directly...', tab.url);
                
                // note, for all this jazz, we also already did tryAndLoad above, and our xmlhttp request COULD work... never know!
                
                chrome.runtime.sendMessage({getJsonFile:''+tab.url, source:'popup'}, function(response){
                    console.log('request for json file sent from popup to bg page' , response);
                });
                
                

                
			}
		});
        
        docJsName = tab.url.match(/[\w\.\-]+$/); // backup... we'll get this from content script normally...
	});
}

function begiin(){

	if( !popoutMode ){
		chrome.windows.getCurrent(function(window){
			winid=window.id;
			begiinWithWindow();
		});
	}else{
		begiinWithWindow();
	}


	createOptionsLinksOnce();
	_gel('go').addEventListener('click', parseJsArea);
}

chrome.runtime.onMessage.addListener(function(r, sender, sendResponse) {
	if(!alreadyGotDocument && r.doc && r.name){
        console.log('document socured from ', sender);
		gotJsonDoc(r.name, r.doc);
    }else if(r.gotJsonDocument){
        // this is if the popup is talkign direct to BG page (not the normal flow via content script...)
        // in this case we really want to treat this like above, however we are misisng some key pieces of info...
        
        console.log('gotJsonDocument from bg page... ');
        
        try{
            var docJson = JSON.parse(r.gotJsonDocument);
            gotJsonDoc(docJsName, r.gotJsonDocument);
            // we could tell the bg page to activate the icon... etc...
            chrome.runtime.sendMessage({enable:true, tabId: tabid}, function(response){});
        }catch(e){
            console.log('was not json', e)
        }
        


    }
    sendResponse({});
});

function attachScript(s){
	Cr.elm('script',{type:'text/javascript',language:'javascript',src:s},[],document.head);
}

function removeNotice(){
	var errorDiv = _gel('vs');
	if( errorDiv ) removeNode(errorDiv);
}

function showNotice(m){
	Cr.elm('div',{id:'vs'},[Cr.txt(m)],document.body)
}

var popoutMode=false;


function checkSandboxFrameLoaded() {
    // Get a handle to the iframe element
    var sandboxFrame = _gel('sandboxed_frame');
    var sandboxFrameDoc = sandboxFrame.contentDocument || sandboxFrame.contentWindow.document;

    // Check if loading is complete
    if (  sandboxFrameDoc.readyState  == 'complete' ) {
        //sandboxFrame.contentWindow.alert("Hello");
        sandboxFrame.contentWindow.onload = function(){
            //alert("I am loaded");
            console.log('sandbox frame congtent window loaded callback...')
        };
        // The loading is complete, call the function we want executed once the sandboxFrame is loaded
        setTimeout(sandboxFrameIsReady, 250); // nonsense timeout... is actually needed (the sandbox is never really ready...)
        return;
    }

    // If we are here, it is not loaded. Set things up so we check   the status again in 100 milliseconds
    window.setTimeout(checkSandboxFrameLoaded, 100);
}

function sandboxFrameIsReady(){
    if(window.location.hash){
        winid = window.location.hash.replace('#','')-0;  // todo pass tab ID too - then persists reload
        popoutMode=true;
        begiin();
    }else{
        begiin();
    }
}

document.addEventListener('DOMContentLoaded', function () {

    checkSandboxFrameLoaded();
    //_gel('sandboxed_frame').contentWindow.addEventListener('load', function () {
        //sandboxFrameIsReady()
    //});

	setTimeout(function(){
		if(!jsonloaded){
			var suggestMessage = '';
			if( isFirefox ) suggestMessage = 'Saving the file to disk as a plan .txt file may help (If this extension may be allowed to run on the local file URL as per your preference).';
			showNotice("JSON to CSV taking a long time loading, or not available on this page. You may need to refresh the page.  You may need to enable this extension for local files in the way the browser provides (extension management).  "+suggestMessage+" ");
		}
	},2500);
    
});
