var parentWindow=window.parent;
var docJsObj = null;
var opts = {};
var nextScriptToEval = 'json';
var alreadyGotDocument = false;

// seemingly... sandbox can only communicate outwards???  time for reeng
parentWindow.postMessage(
  {succes: true},
  '*'
);


window.addEventListener("message", function(ev){
    if( typeof(ev.data) == 'string' ){
        console.log('csv_from_json sandbox got a message...', ev.data);
    }else{
        console.log('csv_from_json sandbox got a message...', Object.keys(ev.data));
    }
    
    //parentWindow = ev.source;
    if( !alreadyGotDocument ){
        if( ev.data.substring && ev.data.substring(0, 20) == 'want-new-result-for:'){
            console.warn("sandbox: looks like we got an evaluate request but we never got a document")
                return;
        }
        gotJsonDoc('arbatrary.json', ev.data);
        begiin();
    }else{
        var message = ev.data;
        if( ev.data.substring(0, 20) == 'want-new-result-for:'){
            nextScriptToEval = ev.data.substring(20);
            parseJsArea();
        }
    }
});

function parseJsArea(ev){
	var jsScript = nextScriptToEval;
	jsScript = jsScript.replace(/^\s+|\s+$/g, '');
	if( !jsScript ) jsScript = 'json';
    nextScriptToEval = jsScript;
	var docPartial = false;
    var messages = [];
	try{
		docPartial = eval(jsScript);
	}catch(e){
        messages.push(e.message);
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
        messages.push("Each Lazy() created must lead to one .toArray() or .toObject()");
	}

	if( docPartial && docPartial.getIterator && docPartial.toArray && docPartial.toObject ){
		docPartial = docPartial.toArray();
        messages.push("Lazy.js evaluation must end with .toArray() or .toObject() - toArray() assumed");
	}

     if( !docPartial){
        messages.push("Expression evaluated to: "+docPartial);
	}
    
    parentWindow.postMessage({gotmsg:JSON.stringify(messages), gotdoc:JSON.stringify(docPartial)}, '*');
}


function gotJsonDoc(name, doc){
	if(alreadyGotDocument) return;
	if(!doc) return;
    
	docJsObj = doc; //JSON.parse(doc);
    opts = docJsObj.opt;
    console.log('sandbox options', opts);
    nextScriptToEval = docJsObj.tx;
    docJsObj = JSON.parse(docJsObj.doc);
	if(alreadyGotDocument) return;
	alreadyGotDocument = true;
	jsonloaded=true;

	window.json = docJsObj; // required for future eval to work (to find this value)
}

function attachScript(s){
    Cr.elm('script',{type:'text/javascript',language:'javascript',src:s},[],document.head);
}

function begiin(){

	if( opts.lazyJsEnabled ){attachScript("lazy.js");}
	if( opts.lodashJsEnabled ){
		if( opts.lodashFullJsEnabled ){
			attachScript("lodash_full.js");
		}else{
			attachScript("lodash.js");
		}
	}

    if( opts.autoParse ){
        setTimeout(parseJsArea, 250); // wondering what delay will suffice to ensure the attached scipts probably ran!
    }
}

