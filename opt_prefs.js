var pOptions=[];
var pAdvOptions=[];

pOptions["autoParse"]={def:true,ind:0,name:'Auto Run (May be slow for large documents)'};
pOptions["simpleExport"]={def:true,ind:0,name:'Simpler Export (Less filterable)'};
pOptions["flatListExport"]={def:true,ind:1,name:'Flat List / Table Export'};
pOptions["validateFlatListExport"]={def:false,ind:2,name:'Validate Flat List Result (May be slow)'};
pOptions["flatListDefaultVal"]={def:'NULL',ind:3,name:'Value to display when no data is found.'};
pOptions["spreadsheetView"]={def:false,ind:0,name:'Sheet Grid Preview (May be slow for large exports)'};
pOptions["xcellify"]={def:true,ind:1,name:'Xcellify Preview (select multiple cells, slower)'};
pOptions["lazyJsEnabled"]={def:true,ind:0,name:'Enable Lazy.js Evaluators'};
pOptions["lodashJsEnabled"]={def:true,ind:0,name:'Enable Lodash (underscore) Evaluators'};
pOptions["lodashFullJsEnabled"]={def:true,ind:1,name:'Use Lodash full build'};

function setOptionDefaults(){
	for( i in pOptions){
		if(typeof(localStorage[i])=='undefined'){
			localStorage[i] = pOptions[i].def;
		}
	}
	for( i in pAdvOptions){
		if(typeof(localStorage[i])=='undefined'){
			localStorage[i] = pAdvOptions[i].def;
		}
	}
}

setOptionDefaults();
