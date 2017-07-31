var concatinator=",";
var lineSeperator = "\n";

function joinedPrefix(vPrefix){
	if( vPrefix.length ){
		return vPrefix.join(concatinator)+concatinator
	}
	return '';
}

function cellContent(c){
	c = ''+c;
	if( c.indexOf(',') > -1 ) return '"'+c+'"';
	return c;
}

function arrToCsv(arr){
	var csv='',escaped=null;
	for(var r=0,rl=arr.length; r<rl; r++){
		escaped = [];
		for(var c=0,cl=arr[r].length; c<cl; c++){
			escaped.push(cellContent(arr[r][c]));
		}
		csv += escaped.join(concatinator)+lineSeperator;
	}
	return csv;
}

function clone(arr){
	return arr.slice(0);
}

function push(arr, val){
	arr.push(val);
	return arr;
}

// todo this function should use above fn
function doParseObjectMode1(obj, prefix){
	var result = [];

	if( typeof obj != 'object' ){
		result.push(push(clone(prefix), obj));
	}else if( Array.isArray(obj) && obj.length ){

		for( var i=0,l=obj.length; i<l; i++ ){
			result=result.concat( doParseObjectMode1(obj[i], push(clone(prefix), '['+i+']')));
		}
	}else if( obj!==null && Object.keys(obj).length ){

		for( var k in obj ){
			result=result.concat( doParseObjectMode1(obj[k], push(clone(prefix), k+':'))); // indicating which entries are keys may make results more readable... these cols could be right aligned
		}
	}else{
		result.push(clone(prefix));
	}

	return result;
}


function getFlatListings(obj){
	var result = [];
	var headers = [];

	if( typeof obj != 'object' ){
		console.error("ERROR - not flat list of objects");
		if( typeof(showNotice) == 'function' ){
			showNotice("JSON to CSV error - result is not flat list (disable flat list mode)!");
		}
	}else if( Array.isArray(obj) && obj.length ){
		for( var i=0,l=obj.length; i<l; i++ ){
			var row = [];
			headers = [];
			if( typeof(obj[i]) == 'object' ){
				for( var key in obj[i] ){
					headers.push(key);
					row.push(obj[i][key])

				}
				result.push(row);
			}
		}
	}else{
		console.error("ERROR2 - not flat list of objects");
		if( typeof(showNotice) == 'function' ){
			showNotice("JSON to CSV error - result is not flat list (disable flat list mode)!");
		}
	}

	result = ([headers]).concat(result);

	return result;
}

function doParseObjectMode2(result, obj, prefix, headers){
	var k, vPrefix = [], hPrefix = [], i, l;

	if( typeof obj != 'object' ){
		//console.log('found stringy @"'+prefix+'"', obj)

		result.result+=prefix+cellContent(obj)+"\n";
	}else if( Array.isArray(obj) && obj.length ){
		//console.log('found array @"'+prefix+'"', obj)

		for( i=0,l=obj.length; i<l; i++ ){
			doParseObjectMode2(result, obj[i], prefix+'['+i+']'+concatinator);
		}
	}else if( obj!==null && Object.keys(obj).length ){
		//console.log('found object @"'+prefix+'"', obj)

		// row prefix becomes all our values
		// header "prefix" becomes all our keys
		// exception being when all values are stringy
		// todo: to make headers really work, a list of "known and unknown headers" should appear in a given header cell index

		for( k in obj ){
			if( typeof obj[k] != 'object' ){
				vPrefix.push(cellContent(k+':')); // indicating which entries are keys may make results more readable... these cols could be right aligned
				vPrefix.push(cellContent(obj[k]));
				hPrefix.push(cellContent(k));
				hPrefix.push(cellContent(k));
			}else{
				//vPrefix.push(k);
				//hPrefix.push('unkn');
			}
		}

		result.headers += headers + joinedPrefix(hPrefix);

		for( k in obj ){
			var extraPrefix = '';
			var extraHprefix = '';
			if( typeof obj[k] == 'object' ){
				extraPrefix = cellContent(k+':') + concatinator;  // indicating which entries are keys may make results more readable... these cols could be right aligned
				extraHprefix = 'unknown' + concatinator;
				//hPrefix.push('unkn');
			}
			doParseObjectMode2(result, obj[k], prefix+joinedPrefix(vPrefix)+extraPrefix, extraHprefix);
		}

	}else{
		//console.log('found nothing! @"'+prefix+'"', obj)

		result.result+=prefix+"\n";
	}

	return result;
}

function formatAsParsedCsv(r){
	return {
		maxCols:r[0].length,
		maxRows:r.length,
		rows: r
	}
}

var CSVfromJSON = {
	getJsonMode1: function(obj){
		return doParseObjectMode2({result:'', headers:''}, obj, '', '').result;
	},
	getJsonMode2: function(obj){ // simpleExport
		var r = doParseObjectMode1(obj, []);
		//return {csv:arrToCsv(r), result:formatAsParsedCsv(r)};
		return arrToCsv(r);
	},
	getFlatList: function(obj){
		var r = getFlatListings(obj);
		return {csv:arrToCsv(r), result:formatAsParsedCsv(r)};
	}
};
