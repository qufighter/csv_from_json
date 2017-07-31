var pOptions=[];
var pAdvOptions=[];

pOptions["autoParse"]={def:true,ind:0,name:'Auto Run (May be slow for large documents)'};
pOptions["simpleExport"]={def:true,ind:0,name:'Simpler Export (Less filterable)'};
pOptions["flatListExport"]={def:true,ind:1,name:'Flat List / Table Export'};
pOptions["spreadsheetView"]={def:false,ind:0,name:'Sheet Grid Preview (May be slow for large exports)'};
pOptions["xcellify"]={def:false,ind:1,name:'Xcellify Preview'};
pOptions["lazyJsEnabled"]={def:true,ind:0,name:'Enable Lazy.js Evaluators'};
pOptions["lodashJsEnabled"]={def:true,ind:0,name:'Enable Lodash (underscore) Evaluators'};
pOptions["lodashFullJsEnabled"]={def:false,ind:1,name:'Use Lodash 4.17.2 full build'};

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
