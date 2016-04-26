var tabid=0,winid=0,jsonloaded=false;
var xcellController;
function _gel(g){
	return document.getElementById(g);
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

function gotJsonDoc(name, doc){
	jsonloaded=true;
	//document.body.innerHTML = doc;
	var docJsObj = JSON.parse(doc);

	var csvData = '';
	if( localStorage["simpleExport"]=='true' ){
		Cr.elm('span',{},[Cr.txt(' Simplified CSV, see ')],document.body);
		csvData = CSVfromJSON.getJsonMode2(docJsObj);
	}else{
		csvData = CSVfromJSON.getJsonMode1(docJsObj);
	}

	var saveBtn=Cr.elm('a',{style:'cursor:pointer;',id:'save'},[Cr.txt('Download')]);
	makeSaveButton(saveBtn, name+'.csv', csvData);
	Cr.insertNodes(saveBtn, document.body, document.body.firstChild);

	var save2 = saveBtn.cloneNode(true);
	Cr.insertNodes(save2, document.body, document.body.lastChild);

	Cr.elm('a',{href:'#',event:['click',visitOptions]},[ Cr.txt('Options') ], document.body);

	previewCsvData(csvData);
}

function previewCsvData(csvData){
	var conatinerElm = Cr.elm('div',{id:'preview'});
	if( localStorage["spreadsheetView"]=='true' ){
		preview_spreadsheet(conatinerElm, csvData);
	}else{
		preview_plain(conatinerElm, csvData);
	}
}

function preview_spreadsheet(conatinerElm, csvData){

	var parsedCsv = parseCsv(csvData);

	var cols = parsedCsv.maxCols;
	var rows = parsedCsv.maxRows;
	var c, r, rowElm;

	rowElm = Cr.elm('div',{class:"headingrow row xcellrow"},[],conatinerElm);

	// Cr.elm('div',{class:"cell cellheading",  event:['click', selectAll]},[
	// 	Cr.elm('div',{},[Cr.txt("Select All")])
	// ],rowElm);

	// for( c=0; c<cols; c++ ){
	// 	Cr.elm('div',{class:"cell cellheading xcellheading", 'data-col':c, event:['click', selectColumn], 'data-col-search':parsedCsv.rows[0][c]},[
	// 		Cr.elm('div',{},[Cr.txt(parsedCsv.rows[0][c])])
	// 	],rowElm);
	// }

	for( r=0; r<rows; r++ ){
		rowElm = Cr.elm('div',{class:"xcellrow row", 'data-row-search':'row'+r},[],conatinerElm);

		// Cr.elm('div',{class:"cell cellheading xcellheading", 'data-row':r},[
		// 	Cr.elm('div',{},[Cr.txt('row'+r)])
		// ],rowElm);

		for( c=0; c<cols; c++ ){
			var style='';
			var value = parsedCsv.rows[r][c];
			var cellElements=[
				Cr.elm('input',{class:'xcellinput',type:'text', value: value})
			];

			if( value.charAt(value.length-1) == ':' ){
				cellElements[0].classList.add('alignRight')
			}

			Cr.elm('div',{class:"cell xcellcell", style:style, 'data-col-search':parsedCsv.rows[r][c]},cellElements,rowElm);
		}
	}

	document.getElementById('content').appendChild(conatinerElm);

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
	document.getElementById('content').appendChild(conatinerElm);
}

function visitOptions(){
  window.open(chrome.extension.getURL("options.html"));
}

function begiin(){
	chrome.windows.getCurrent(function(window){
		winid=window.id;
		chrome.tabs.getSelected(winid, function(tab){
			tabid=tab.id;
			chrome.tabs.sendMessage(tabid,{getJsonDoc:true},function(r){
				if( r.name ){
					gotJsonDoc(r.name, r.doc);
				}else{
					console.log('seems to not be a JSON document!');
				}
			});
		});
	});
}

document.addEventListener('DOMContentLoaded', function () {
	begiin();
	setTimeout(function(){
		if(!jsonloaded){
			Cr.elm('div',{id:'vs'},[Cr.txt("JSON to CSV taking a long time loading, or not available on this page.  Sorry!")],document.body)
		}
	},2500)
});
