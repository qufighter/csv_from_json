var pOptions=[];
var pAdvOptions=[];

pOptions["simpleExport"]={def:false,ind:0,name:'Simpler Export'};
pOptions["plainTextPreview"]={def:true,ind:0,name:'Plain Text Preview (loads faster)'};

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
