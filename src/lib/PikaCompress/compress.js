/*
* Credit goes to http://buildnewgames.com/optimizing-websockets-bandwidth/ for most of the code behind this compression algorithm
* 
* How to aproach encoding:
* alternate Uint Float, String
* each part goes [number of this type][char][char][char][number of this type][char][char][char]
* or even [number of this type][number of this type][char][char][char]
* First character's value is either:
* 0 - Uint8, Float32
* 1 - Uint16, Float32
* 2 - Uint8, Float64
* 3 - Uint16, Float64
* 
* Usage:
* To encode, encodeArray([array,of,ints,and,floats,in,any,order], shouldBeUint16InsteadOfUint8, shouldBeFloat64InsteadOfFloat32) - Returns string
* To decode, decodeArray(stringFromEncodeArray) - auto detects Uint and Float type, returns array
*/

// Compression algorithm:

var encodeUint = function(number, u16) {
	if(u16)
		var arr = new Uint16Array(1);
	else
		var arr = new Uint8Array(1);
	arr[0] = number;
	return String.fromCharCode(arr[0]);
};

var encodeFloat = function(number, u16, f64) {
	if(f64)
		var arr = new Float64Array(1);
	else
		var arr = new Float32Array(1);
	if(u16)
		var char = new Uint16Array(arr.buffer);
	else
		var char = new Uint8Array(arr.buffer);
	arr[0] = number;
	//TODO: Ensure endianness is correct before returning
	if(f64)
		return String.fromCharCode(char[0], char[1], char[2], char[3], char[4], char[5], char[6], char[7]);
	else
		return String.fromCharCode(char[0], char[1], char[2], char[3]);
};

var encodeArray = function(arr, u16, f64) {
	var encoding = (f64 ? 1 : 0) * 2 + (u16 ? 1 : 0);
	var msg = '';
	var currState = 0; // 0 = Uint, 1 = Float, 2 = String
	var stateCount = 0;
	var msgPart = '';
	for(var i=0; i<arr.length; ++i) {
		if(currState != getType(arr[i])) {
			msg += encodeUint(stateCount, u16) + msgPart;
			msgPart = '';
			currState = 1 - currState;
			stateCount = 0;
		}
		msgPart += currState ? encodeFloat(arr[i], u16, f64) : encodeUint(arr[i], u16);
		stateCount++;
	}
	msg += String.fromCharCode(encoding) + encodeUint(stateCount, u16) + msgPart;
	return msg;
};

var decodeUint = function(str, offset, arr, u16) {
	arr.push(str.charCodeAt(offset));
	return 1;
};

var getDecodeCount = function(str, offset) {
	return str.charCodeAt(offset);
};

var decodeFloat = function(str, offset, inarr, u16, f64) {
	if(f64)
		var arr = new Float64Array(1);
	else
		var arr = new Float32Array(1);
	if(u16)
		var char = new Uint16Array(arr.buffer);
	else
		var char = new Uint8Array(arr.buffer);
	var returnVal = f64 ? 8 : 4;
	for(var i=0; i<returnVal; ++i) {
		char[i] = str.charCodeAt(offset+i);
	}
	inarr.push(arr[0]);
	return returnVal;
};

var getFlags = function(flagsChar) {
	flagsChar = flagsChar.charCodeAt(0);
	var arr = new Array();
	while(flagsChar > 0) {
		arr.push(flagsChar % 2 ? true : false);
		flagsChar = Math.floor(flagsChar / 2);
	}
	return arr;
};

var decodeArray = function(str, u16, f64) {
	var encodingChar = getFlags(str);
	var u16 = encodingChar[0];
	var f64 = encodingChar[1];
	var encoding = (f64 ? 1 : 0) * 2 + (u16 ? 1 : 0);
	str = str.substring(1);
	var charsRead = 1;
	var decodedArr = [];
	var currState = 0; // 0 = Uint, 1 = Float
	var stateCount = 0;
	stateCount = getDecodeCount(str, 0);
	while(charsRead < str.length) {
		if(stateCount < 1) {
			currState = 1 - currState;
			stateCount = getDecodeCount(str, charsRead);
			charsRead++;
			continue;
		}
		charsRead += currState ? decodeFloat(str, charsRead, decodedArr, u16, f64) : decodeUint(str, charsRead, decodedArr, u16);
		stateCount--;
	}
	return decodedArr;
};

module.exports = {
	encodeArray: encodeArray,
	decodeArray: decodeArray
};