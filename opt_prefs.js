var pOptions=[];
var pAdvOptions=[];

pOptions["simpleExport"]={def:false,ind:0,name:'Simpler Export (Less filterable)'};
pOptions["spreadsheetView"]={def:false,ind:0,name:'Sheet Grid Preview'};
pOptions["xcellify"]={def:false,ind:1,name:'Xcellify Preview'};


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
