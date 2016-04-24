var tabid=0,winid=0;
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
	//document.body.innerHTML = doc;
	Cr.empty(_gel('vs'));
	var docJsObj = JSON.parse(doc);

	var csvData = '';
	if( localStorage["simpleExport"]=='true' ){
		Cr.elm('span',{},[Cr.txt('Simplified CSV ')],document.body);
		csvData = CSVfromJSON.getJsonMode2(docJsObj);
	}else{
		csvData = CSVfromJSON.getJsonMode1(docJsObj);
	}

	var saveBtn=Cr.elm('a',{style:'cursor:pointer;',id:'save'},[Cr.txt('Download')],document.body);
	makeSaveButton(saveBtn, name+'.csv', csvData);

	Cr.elm('div',{id:'preview'},[
		Cr.elm('pre',{},[
			Cr.txt(csvData)
		])
	], document.body);
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
});
