(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	slApp.factory('slTxt', ['slPpr', 'slCtry', 'alert',
		function (slPpr, slCtry, alert) {
		var slTxt = {};
		var msgQueue = [];

		

		var displayMsg = function () {
			var msg = msgQueue[msgQueue.length - 1];
			document.getElementById('navbar-msg').innerHTML = msg;
		};

		slTxt.initMsg = function () {
			msgQueue.length = 0;
			slTxt.pushMsg('Welcome to sourceLink! Select <i style ="color:#BEF0FF; background-color:#428BCA;">Sign In to familySearch</i> to load your family information.');
		};

		slTxt.pushMsg = function (msg) {
			msgQueue.push(msg);
			displayMsg();
		};

		slTxt.popMsg = function () {
			if (msgQueue.length > 2) {
				msgQueue.pop();
			}
			displayMsg();
		};


		//========================================================
		// return true if string is defined and is not empty
		slTxt.isValid = function (string) {
			if (string && string !== '') {
				return true;
			}
			return false;
		};
		
		slTxt.splitIntoWords = function (txt) {
			var result = txt.split(/[,.\s]+/);
			return result;
		};
		

		slTxt.trimEndSpace = function (text) {
			return text.trim();
/*
			if (text.charAt(0) === ' ') {
				if (text.charAt(text.length - 1) === ' ') {
					return text.substring(1, text.length - 1);
				}
				return text.substring(1, text.length);
			} else if (text.charAt(text.length - 1) === ' ') {
				return text.substring(0, text.length - 1);
			}
			return text;
*/
		};

		// create a string from a list of words placing
		// a space between each word
		slTxt.createLine = function (list) {
			var line = '';
			for (var i = 0; i < list.length; i++) {
				if (slTxt.isValid(list[i])) {
					if (slTxt.isValid(line)) {
						line += ' ' + list[i];
					} else {
						line += list[i];
					}
				}
			}
			return line;
		};

		slTxt.stripAllButAlpha = function (text) {
			var stripped = text.replace(/\W/g, '');
			return stripped;
/*
			var size = 0;
			for (var i = 0; i < text.length; i++) {
				var chr = text.charAt(i);
				if ('A' >= chr && chr <= 'Z' || 'a' >= chr && chr <= 'z') {
					text[size++] = chr;
				}
			}
			return text.substring(0, size);
*/
		};

		slTxt.pathEnd = function (path) {
			var start;
			for (;;) {
				// remove ending '/'s
				start = path.lastIndexOf('/');
				if (start === path.length - 1) {
					path = path.substring(path.length - 1,path.length);
					continue;
				}
				break;
			}
			return path.substring(start + 1,path.length);
		};

		// if string find exists in txt then return string
		// that containes everything after find in txt.
		slTxt.clipAfter = function (txt, find) {
			var loc = txt.indexOf(find);
			if (loc >= 0) {
				return txt.substring(loc + find.length);
			}
			return txt;
		};

		slTxt.getNthPosition = function (txt, pattern, n) {
			return txt.split(pattern, n).join(pattern).length;
		};

		slTxt.splice = function (str, index, howmany, add) {
			return str.slice(0, index) + (add || '') + str.slice(index + howmany);
		};

		//================================================================
		// event interface methods
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		var monthNumber = function(monthName) {
			var abbr = monthName.substr(0, 3);
			var num = months.indexOf(abbr);
			return num + 1;
		};

		slTxt.abbrMonth = function (mnth) {
			return months[mnth];
		};

		// return < 0 if d1 is earlier than d2
		// return = 0 if d1 equals d2
		// return > 0 if d1 is later d2
		// if date is undefined treat as later
		slTxt.compareDate = function (date1, date2) {
			if (!date1) {
				if (!date2) {
					return 0;
				}
				return 1000;
			}
			if (!date2) {
				return -1000;
			}
			var d1 = date1.to ? date1.to : 
				(date1.about ? date1.about : date1);
			var d2 = date2.to ? date2.to :
				(date2.about ? date2.about : date2);
			var diff = d1.length - d2.length;
			if (diff === 0) {
				diff = (d1.length > 2) ? d1[2] - d2[2] : 0;
				if (diff === 0) {
					diff = d1[1] - d2[1];
					if (diff === 0) {
						diff = d1[0] - d2[0];
					}
				}
			}
			return diff;
		};

		// detect case date=['','18890620']  and convert to date=['20 Jun','1889']
		var cleanupDate = function (date) {
			if (date[0] === 0 && date[1] === 0 && date[2] > 9999) {
				var dateNum = date[2];
				var day = dateNum % 100;
				var yearmonth = ((dateNum - day) / 100);
				var month = yearmonth % 100;
				var year = (yearmonth - month) / 100;
				if (0 < month && month < 13) {
					date[0] = day;
					date[1] = month;
					date[2] = year;
				} else {
					date[2] = year;
				}
			}
		};

		// return 'a' if char is alpha,  'n' if char is numeric
		// and 'o' if char is anything else.
		slTxt.charType = function (charCode) {
			if ((charCode > 47) && (charCode < 58)) {
				return 'n';
			}
			if ((charCode > 64) &&
				(charCode < 91) ||
				(charCode > 96) &&
				(charCode < 123)) {
				return 'a';
			}
			return 'o';
		};

		// Splits alpha sections from numeric sections
		// Any non alphanumeric character becomes a split point
		// as well and is thown away.
		var separateAlphaFromNumeric = function (text) {
			var results = [];
			var type;
			var start = 0;
			for (var j = 0; j < text.length; j++) {
				var thisType = slTxt.charType(text.charCodeAt(j));
				if (type) {
					if (thisType !== type) {
						if (type !== 'o') {
							results.push(text.substring(start, j));
						}
						start = j;
						type = thisType;
					}
				} else {
					type = thisType;
				}
			}
			if (type !== 'o' && start < text.length - 2) {
				results.push(text.substring(start, text.length));
			}
			return results;
		};

		slTxt.nameToString = function (name) {
			if (typeof name === 'string') {
				return name;
			}
			var txt = '';
			if (name[0]) {
				txt = name[0];
			}
			if (name[1]) {
				if (txt && txt.length > 0) {
					txt += ' ';
				}
				txt += name[1];
			}
			return txt;
		};

		var splitSingleDate = function (date) {
			var parts = separateAlphaFromNumeric(date);
			var lastEntry = parts[parts.length - 1];
			if (parts.length > 3 || parts.length === 3 && isNaN(lastEntry)) {
				alert('Invalid date format: ' + date);
				return undefined;
			}
			if (parts.length === 3) {
				if (isNaN(parts[1])) {
					if (!isNaN(parts[0])) {
						return [Number(parts[0]),monthNumber(parts[1]),Number(parts[2])];
					}
				} else {
					if (isNaN(parts[0])) {
						return [Number(parts[1]),monthNumber(parts[0]),Number(parts[2])];
					}
				}
				alert('Invalid date format: ' + date);
				return undefined;
			}
			if (!isNaN(lastEntry)) {
				if (parts.length > 1) {
					if (isNaN(parts[0])) {
						return [0, monthNumber(parts[0]), Number(parts[1])];
					}
					alert('Invalid date format: ' + date);
					return undefined;
				}
				var newDate = [0,0,Number(lastEntry)];
				cleanupDate(newDate);
				return newDate;
			} else if (parts.length > 1) {
				return [Number(parts[0]), monthNumber(parts[1])];
			}
			alert('Invalid date format: ' + date);
			return undefined;
		};

		// return [day month year] or 
		// a range value {from: [day month year], to: [day month year] or
		//  { about: [day month year] }
		slTxt.splitDate = function (date) {
			if (!slTxt.isValid(date)) {
				return undefined;
			}
			var dateLC = date.toLowerCase();
			var found = dateLC.indexOf('about');
			if (found >= 0) {
				var about = date.substring(found + 6);
				return {
					about: splitSingleDate(about)
				};
			}
			found = dateLC.indexOf('from');
			var foundTo = dateLC.indexOf('to');
			if (found >= 0 && foundTo >= 0) {
				return {
					from: splitSingleDate(date.substring(found + 5,foundTo)),
					to: splitSingleDate(date.substring(foundTo + 1))
				};
			}
			var range = date.split('-');
			if (range.length === 2) {
				return {
					from: splitSingleDate(range[0]),
					to: splitSingleDate(range[1])
				};
			} else if (range.length === 1) {
				return splitSingleDate(date);
			} else {
				alert('Invalid date format: ' + date);
				return undefined;
			}
		};

		// return dayMonth string: '1 Jan' of date
		slTxt.dayMonth = function (date) {
			var retVal = '';
			if (date[1] > 0) {
				if (date[0] > 0) {
					retVal += date[0] + ' ' + slTxt.abbrMonth(date[1] - 1);
				} else {
					retVal += slTxt.abbrMonth(date[1] - 1);
				}
			} else if (date[0] > 0) {
				retVal += date[0] + ' ?';
			}
			return retVal;
		};

		slTxt.year = function (date) {
			if (date) {
				if (date.to) {
					if (date.to.length > 2) {
						return date.to[2].toString();
					}
					if (date.from && date.from.length > 2) {
						return date.from[2].toString();
					}
				} else if (date.about) {
					date = date.about;
				}
				if (date.length > 2) {
					return date[2].toString();
				}
			}
			return '';
		};

		slTxt.simpleDate = function (date) {
			var dm = slTxt.dayMonth(date);
			var year = slTxt.year(date);
			if (dm.length > 0) {
				if (year.length > 0) {
					return dm + ' ' + year;
				}
				return dm;
			} else {
				if (year.length > 0) {
					return year;
				}
			}
			return '';
		};


		slTxt.date = function (date) {
			var txt = '';
			if (date.to) {
				// display as range
				txt += slTxt.simpleDate(date.from);
				txt += '-';
				txt += slTxt.simpleDate(date.to);
			} else if (date.about) {
				txt += 'abt ' + slTxt.simpleDate(date.about);
			} else {
				txt += slTxt.simpleDate(date);
			}
			return txt;
		};

			
		// return [town county state country] or some subset
		slTxt.splitPlace = function (place) {
			var results;	
			if (!slTxt.isValid(place)) {
				return results;
			}
			var parts = place.split(',');
			if (parts.length === 0) {
				return results;
			}
			var len = parts.length > 4 ? 4 : parts.length;
			for (var i = 0; i < len; i++) {
				parts[i] = slTxt.trimEndSpace(parts[i]);
			}
			return parts;
		};

		// append place to end of textA.  
		slTxt.addPlace = function (place, txtA) {
			if (!place) {
				return false;
			}
			var added = false;
			var sc = slCtry.extractStateCountry(place);
			var stateCtry;
			var plLen = place.length;
			if (sc) {
				stateCtry = sc[0] ? sc[0] + ' ' + sc[1] : sc[1];
				plLen = sc[2];
			}
			for (var i = 0; i < plLen; i++) {
				if (slTxt.isValid(place[i])) {
					if (added) {
						txtA[0] += ', ';
					}
					txtA[0] += place[i];
					added = true;
				} else {
					if (added) {
						txtA[0] += ', ';
					}
					added = false;
				}
			}
			if (stateCtry) {
				if (added) {
					txtA[0] += ', ';
				}
				txtA[0] += stateCtry;
			}
			return txtA[0].length > 0;
		};

		// Create event object
		slTxt.event = function (dateStrg, placeStrg) {
			var date = slTxt.splitDate(dateStrg);
			var place = slTxt.splitPlace(placeStrg);
			if (!date && !place) {
				return undefined;
			}
			return {
				'date': date,
				'place': place
			};
		};

		slTxt.uncapitalize = function (txt) {
			return txt.substring(0, 1).toLowerCase() + txt.substring(1);
		};

		slTxt.toCamelCase = function (txt) {
			return txt.match(/[a-zA-Z0-9]+/g).map(function (x, i) {
				return (i ? x[0].toUpperCase() : x[0].toLowerCase()) + x.slice(1).toLowerCase();
			}).join('');
		};

		slTxt.view = function () {
			angular.element(document.getElementById('canvas1')).attr('hidden', true);
			angular.element(document.getElementById('canvas2')).attr('hidden', true);
			angular.element(document.getElementById('underlay')).removeAttr('hidden');
		};

		slTxt.underDisp = function () {
			return angular.element(document.getElementById('underDisplay'));
		};

		slTxt.stripTitle = function (title) {
			title = title.replace(/[.,]/g, '');	// remove punctuation
			title = title.replace(/\d+\-\d+/g, '');	// remove numbers
			title = title.replace(/Index/g, ''); // remove 'Index'
			title = slTxt.trimEndSpace(title);
			return title;
		};

		var doNotGroup = ['CENSUS', 'VITAL', 'MISCELLANEOUS'];
		var sameTypes = [['DEATH', 'BURIAL']];

		slTxt.sameGroupType = function (type1, type2) {
			if (type1 === type2) {
				if (doNotGroup.indexOf(type1) < 0) {
					return true;
				}
				return false;
			}
			var len = sameTypes.length;
			for (var i = 0; i < len; i++) {
				var sameType = sameTypes[i];
				if ((sameType.indexOf(type1) >= 0) &&
					(sameType.indexOf(type2) >= 0)) {
					return true;
				}
			}
			return false;
		};

		slTxt.groupType = function (type) {
			var len = sameTypes.length;
			for (var i = 0; i < len; i++) {
				var sameType = sameTypes[i];
				if (sameType.indexOf(type) >= 0) {
					return sameType[0];
				}
			}
			return type;
		};


		slTxt.pprint = function (label, data) {
			// return;
			var msg = label ? '<h3>' + label + '<h3>' : '<hr>';
			var tbl = data ? slPpr.prettyPrint(data) : '';
			slTxt.view();
			slTxt.underDisp().append(msg, tbl);
		};

		return slTxt;
	}]);

})();
