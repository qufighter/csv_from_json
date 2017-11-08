var tabid=0,winid=0,jsonloaded=false;
var xcellController;
var docJsObj = null;
var docJsName = '';

function _gel(g){
	return document.getElementById(g);
}

function popupimage(mylink, windowname)
{
	var w=Math.round(window.outerWidth*1.114),h=Math.round(window.outerHeight*1.15);
	chrome.windows.create({url:mylink.href,width:w,height:h,focused:false,type:"panel"},function(win){});
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
	removeNotice();
	var jsScript = _gel('transform').value;
	jsScript = jsScript.replace(/^\s+|\s+$/g, '');
	if( !jsScript ) jsScript = 'json';
	_gel('transform').value = jsScript;
	localStorage["lastScript"] = jsScript;
	var docPartial = false;
	var messageArea = _gel('messages');
	Cr.empty(messageArea);
	try{
		docPartial = eval(jsScript);
	}catch(e){
		Cr.elm('div',{},[Cr.txt(e.message)],messageArea);
		docPartial = false;
	}

	var lazyCount = jsScript.match(/Lazy\(/g);
	lazyCount = lazyCount ? lazyCount.length : 0;
	var toArrCnt = jsScript.match(/\.toArray\(\)/g);
	toArrCnt = toArrCnt ? toArrCnt.length : 0;
	var toObjectCnt = jsScript.match(/\.toObject\(\)/g);
	toObjectCnt = toObjectCnt ? toObjectCnt.length : 0;

	if( lazyCount > 1 && lazyCount > toArrCnt + toObjectCnt ){
		docPartial = false;
		Cr.elm('div',{},[Cr.txt("Each Lazy() created must lead to one .toArray() or .toObject()")],messageArea);
	}

	if( docPartial.getIterator && docPartial.toArray && docPartial.toObject ){
		docPartial = docPartial.toArray();
		Cr.elm('div',{},[Cr.txt("Lazy.js evaluation must end with .toArray() or .toObject() - toArray() assumed")],messageArea);
	}

	if( docPartial ) previewJsonDoc(docPartial);
	else{
		Cr.elm('div',{},[Cr.txt("Expression evaluated to: "+docPartial)],messageArea);
	}
}

function gotJsonDoc(name, doc){

	removeNotice();

	jsonloaded=true;
	//document.body.innerHTML = doc;
	docJsObj = JSON.parse(doc);
	window.json = docJsObj;
	docJsName = name;

	var currentValue=_gel('transform').value;
	if( !currentValue ) _gel('transform').value="json";

	if( localStorage["autoParse"]=='true' ) previewJsonDoc(docJsObj);
	else showNotice("press Evaluate to continue...");

	if( localStorage["lastScript"] ){
		if( !currentValue || prompt("Conundrum, clear current script replacing value in storage?\n\nStored Value:\n\n"+localStorage["lastScript"]+"\n\nIf you press OK you will save the above and loose what is below.\n\nCurrently Edited Script (copy if you need it):", currentValue)){
			_gel('transform').value = localStorage["lastScript"];
		}
	}
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

	var parsedCsv = parsedData ? parsedData : parseCsv(csvData);
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

function begiinWithWindow(){
	chrome.tabs.getSelected(winid, function(tab){
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

	if( localStorage['lazyJsEnabled'] == 'true' ){attachScript("lazy.js");}
	if( localStorage['lodashJsEnabled'] == 'true' ){
		if( localStorage['lodashFullJsEnabled'] == 'true' ){
			attachScript("lodash_full.js");
		}else{
			attachScript("lodash.js");
		}
	}

	createOptionsLinksOnce();
	_gel('go').addEventListener('click', parseJsArea);
}

chrome.runtime.onMessage.addListener(function(r, sender, sendResponse) {
	if(r.doc && r.name){
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

	if(window.location.hash){
		winid = window.location.hash.replace('#','')-0;  // todo pass tab ID too - then persists reload
		popoutMode=true;
		begiin();
	}else{
		begiin();
	}

	setTimeout(function(){
		if(!jsonloaded){
			showNotice("JSON to CSV taking a long time loading, or not available on this page. You may need to refresh the page. Sorry!");
		}
	},2500)
});
