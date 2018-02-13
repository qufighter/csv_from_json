/*jshint expr:true*/
/*
 * Xcelify CSV utility functions  (Parse CSV) by Sam Larison
*/

var XcellifyCsv = (function (){

  var _xfy = new Xcellify({
    containerElm: document.createElement('div'), // you may be able to use Cr.elm('div') for node.js
    tabReplacement: false,
    delimitCells:',' // Modifying .delimitCells TEMPORARILY on an instance to be ',' should make it function as a CSV parser. (or writer for that matter (see getCurrentSelectionForCopy)) Set delimitCells and tabReplacement back or you break clipboard interoperability on the instance.
  });

  var _equalizeResultRowLength = function(resultLines, maxCols){
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

  return {
    instance: _xfy,

    parse: function (csvData){
      var resultLines = _xfy.parsePasteData(csvData), resultLine; // parsePasteData handles double double quoting pretty good for tab and newline delimited data.
      var  maxCols = 0, l, ln;
      for( l=0,ln=resultLines.length; l < ln; l++ ){
        resultLine = resultLines[l];
        if( resultLine.length > maxCols ){
          maxCols = resultLine.length;
        }
      }
      return {
        rows:_equalizeResultRowLength(resultLines, maxCols),
        maxCols:maxCols,
        maxRows:resultLines.length
      };
    },

    create: function (arr){
      var csv='',escaped=null;
      for(var r=0,rl=arr.length; r<rl; r++){
        escaped = [];
        for(var c=0,cl=arr[r].length; c<cl; c++){
          escaped.push(_xfy.quoteValueIfNeeded(""+arr[r][c]));
        }
        csv += escaped.join(_xfy.delimitCells)+_xfy.delimitRows;
      }
      return csv;
    }
  }
})()
