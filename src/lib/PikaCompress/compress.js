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
* 
* Highest compression: u16 = anything, f64 = false
* f32 uses half the amount of bytes as f64, but is less accurate.
* u8 is 1 byte long, u16 is 1 byte long when it is 0-255, and 2 bytes when 256-65535. If you go above 255 when using u8, it wraps around.
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
	var strToReturn = "";
	for(var i=0; i<char.length; i++)
		strToReturn += String.fromCharCode(char[i]);
	return strToReturn;
};

var encodeArray = function(arr, u16, f64) {
	var encoding = (f64 ? 1 : 0) * 2 + (u16 ? 1 : 0);
	var msg = '';
	var currState = 0; // 0 = Uint, 1 = Float
	var stateCount = 0;
	var msgPart = '';
	for(var i=0; i<arr.length; ++i) {
		if(currState != (Math.floor(arr[i]) == arr[i] ? 0 : 1)) {
			msg += encodeUint(stateCount, u16) + msgPart;
			msgPart = '';
			currState = 1 - currState;
			stateCount = 0;
		}
		msgPart += currState ? encodeFloat(arr[i], u16, f64) : encodeUint(arr[i], u16);
		stateCount++;
	}
	msg += encodeUint(stateCount, u16) + msgPart;
	return String.fromCharCode(encoding) + msg;
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
	var returnVal = 4 * (f64 ? 2 : 1) / (u16 ? 2 : 1);
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

var decodeArray = function(str) {
	var encodingChar = getFlags(str);
	var u16 = encodingChar[0] ? true : false;
	var f64 = encodingChar[1] ? true : false;
	//var encoding = (f64 ? 1 : 0) * 2 + (u16 ? 1 : 0);
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