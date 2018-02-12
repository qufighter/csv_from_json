/*jshint expr:true*/
/*
 * Xcelify CSV utility functions  (Parse CSV) by Sam Larison
*/

function parseCsvWithXcellify(csvData){
  var xfy = new Xcellify({
    containerElm: document.createElement('div'), // you may be able to use Cr.elm('div') for node.js
    tabReplacement: false,
    delimitCells:',' // Modifying .delimitCells TEMPORARILY on an instance to be ',' should make it function as a CSV parser. (or writer for that matter (see getCurrentSelectionForCopy)) Set delimitCells and tabReplacement back or you break clipboard interoperability on the instance.
  });
  var resultLines = xfy.parsePasteData(csvData), resultLine; // parsePasteData handles double double quoting pretty good for tab and newline delimited data.
  var  maxCols = 0, l, ln;
  for( l=0,ln=resultLines.length; l < ln; l++ ){
    resultLine = resultLines[l];
    if( resultLine.length > maxCols ){
      maxCols = resultLine.length;
    }
  }
  return {
    rows:equalizeResultRowLength(resultLines, maxCols),
    maxCols:maxCols,
    maxRows:resultLines.length
  };
}

// this alternative parse method may have edge cases in which it does not work, such as quoted fields containign double quotes followed by commas.
function parseCsv(csvData){
  var lines = csvData.replace(/^\s+|\s+$/g,'').split(/[\r\n]+/);
  var resultLines = [], resultLine, maxCols = 0, l, ln;
  for( l=0,ln=lines.length; l < ln; l++ ){
    resultLine = parseRow(lines[l]);
    resultLines.push(resultLine);
    if( resultLine.length > maxCols ){
      maxCols = resultLine.length;
    }
  }
  return {
    rows:equalizeResultRowLength(resultLines, maxCols),
    maxCols:maxCols,
    maxRows:resultLines.length
  };
}

function equalizeResultRowLength(resultLines, maxCols){
  for( var l=0,ln=resultLines.length; l < ln; l++ ){
    var c=resultLines[l].length-1;
    if( resultLines[l].length < maxCols ){
      while( c < maxCols ){
        resultLines[l].push('');
        c++;
      }
    }
  }
  return resultLines;
}

function parseRow(csvRow){
  var fields = csvRow.split(','), field, inQuotes = false;
  var results = [];
  for( var f=0,fl=fields.length; f < fl; f++ ){
    field = fields[f];
    if( field.charAt(0) == '"' ){
      inQuotes = true;
    }
    while( inQuotes && fields[f+1] && (field.charAt(field.length-1) != '"' || field.charAt(field.length-2) == "\\") ){
      field += ','+fields[++f];
    }
    inQuotes = false;
    results.push(field.replace(/^"|"$/g, ''));
  }
  return results;
}
