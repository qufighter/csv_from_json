var tabid=0,winid=0,jsonloaded=false;
var xcellController;
//var docJsObj = null;
var docJsName = '';
var currentTab;
var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;

function _gel(g){
	return document.getElementById(g);
}

// getting messages from our sandbox'd frame...
window.addEventListener("message", function(ev){
    // anticipation: ev.data is JSON doc

    if( ev.data.substr(0, 7) == 'gotmsg:' ){
        
        var messagesArr = [];
        var messageArea = _gel('messages');
        try{
            messagesArr = JSON.parse(ev.data.substr(7));
        }catch(e){
            // todo handle this
            console.error('message parse failure', e);
        }

        for( var m=0; m<messagesArr.length; m++ ){
            
            Cr.elm('div',{},[Cr.txt(messagesArr[m])],messageArea);
        }

    }else if(ev.data.substr(0, 7)  == 'gotdoc:' ){
        
        var result = [];
        
        try{
            result = JSON.parse(ev.data.substr(7));
            
            
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
	popupimage({href:chrome.extension.getURL('popup.html')+'#'+winid},"JSON to CSV : Chrome Extension");
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
    _gel('sandboxed_frame').contentWindow.postMessage('want-new-result-for:'+jsScript);

}

var alreadyGotDocument = false;

function gotJsonDoc(name, doc){
	if(alreadyGotDocument) return;
	if(!doc) return;
    

    var currentValue=_gel('transform').value;
    if( !currentValue ) _gel('transform').value="json";

    if( localStorage["lastScript"] ){
        if( !currentValue || prompt("Conundrum, clear current script replacing value in storage?\n\nStored Value:\n\n"+localStorage["lastScript"]+"\n\nIf you press OK you will save the above and loose what is below.\n\nCurrently Edited Script (copy if you need it):", currentValue)){
            _gel('transform').value = localStorage["lastScript"];
        }
    }
    
    _gel('sandboxed_frame').contentWindow.postMessage(JSON.stringify({
        opt: {
            lazyJsEnabled: localStorage['lazyJsEnabled'] == 'true',
            lodashJsEnabled: localStorage['lodashJsEnabled'] == 'true',
            lodashFullJsEnabled: localStorage['lodashFullJsEnabled'] == 'true',
            autoParse: localStorage["autoParse"]=='true'
        },
        tx: _gel('transform').value,
        doc: doc
    }));
    // // we will still do much of this below... but will not do so in the future!! mv3

    removeNotice();
    jsonloaded=true;

    //document.body.innerHTML = doc;
    //docJsObj = JSON.parse(doc);
    
    
    if(alreadyGotDocument) return;
    alreadyGotDocument = true;
    jsonloaded=true;

    //window.json = docJsObj;
    docJsName = name;


//	if( localStorage["autoParse"]=='true' ) previewJsonDoc(docJsObj);
//	else showNotice("press Evaluate to continue...");


}

function dupeAtTop(btn){
	var save2 = btn.cloneNode(true);
	save2.id = save2.id + '2';
	Cr.insertNodes(save2, document.body, document.body.firstChild);
}

function previewJsonDoc(previewDocJsObj){
	var csvData = {}, parsedData = null;
	if( localStorage["simpleExport"]=='true' ){
		if( localStorage["flatListExport"]=='true' ){
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
	if( localStorage["spreadsheetView"]=='true' ){
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

	if(localStorage['xcellify'] != 'true') return;

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
  window.open(chrome.extension.getURL("options.html"));
}

function tryAndLoad(){
	if(!currentTab) return;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange=function(){
		if(xhr.readyState == 4){
			filename = currentTab.split('?')[0].split('/');
			filename = filename[filename.length -1];
			gotJsonDoc(filename, xhr.responseText);
		}
	};
	xhr.open('GET', currentTab, true);
	xhr.send();
}

function begiinWithWindow(){
	chrome.tabs.query({windowId: winid, active: true}, function(tabs){
		var tab = tabs[0];
		currentTab = tab.url;
		tryAndLoad();

		tabid=tab.id;
		chrome.tabs.sendMessage(tabid,{getJsonDoc:true},function(r){
			if( r && r.name ){
				gotJsonDoc(r.name, r.doc);
			}else{
				console.log('seems to not be a JSON document! Or its taking too long to load...');
			}
		});
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
		gotJsonDoc(r.name, r.doc);
	}
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
document.addEventListener('DOMContentLoaded', function () {

    _gel('sandboxed_frame').contentWindow.addEventListener('load', function () {

        if(window.location.hash){
            winid = window.location.hash.replace('#','')-0;  // todo pass tab ID too - then persists reload
            popoutMode=true;
            begiin();
        }else{
            begiin();
        }

    });

	setTimeout(function(){
		if(!jsonloaded){
			var suggestMessage = '';
			if( isFirefox ) suggestMessage = 'Saving the file to disk as a plan .txt file may help (If this extension may be allowed to run on the local file URL as per your preference).';
			showNotice("JSON to CSV taking a long time loading, or not available on this page. You may need to refresh the page. "+suggestMessage+" Sorry!");
		}
	},2500);
    
});
