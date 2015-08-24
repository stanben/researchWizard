(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Handles to selection rectangles in canvas
	slApp.factory('slSel', [ 'slTxt', function (slTxt) {
		var slSel = {};

		// All event types are defined at: 
		// https://github.com/FamilySearch/gedcomx/blob/master/specifications/event-types-specification.md

		
		// Relationship type (to active person)  direct relation (uncle would be fs or ms)
		var relType = [
		//	[relTypeName,  relTypeAbbreviation]
		['self', 'x'],		// the active person
		['head', 'x'],		// the active person
		['father', 'f'],
		['mother', 'm'],
		['spouse', 'p'],
		['sibling','s'],
		['child', 'c']
		];

		//  relation Sequence number defines which of the relations in an array of that relationship type
		//  the first will be 0
		//		var relSqN = 0;

		//=====================================================================
		// NOTE: All abreviations need to be different between infoType and eventType

		// Information Type of a person
		/*
				var infoType = [
				//	[infoTypeName,  infoTypeAbbreviation, [valid subInfoTypeAbbreviations]]
				['Name', 'n', ['G','F']]
				];
		
		
				// Possible sub-event types
				var subInfoType = [
				//	[subInfoTypeName,  subInfoTypeAbbreviation, dataType]
				];
		*/
		var eventTypes = {
			//	[eventTitle, [lowercaseSearchValue(s)] ,eventTypeAbbreviationProperty]
			// object properties are camelCase of EventTitle
		ap: ['Adoption',  ['adopt'], 'ap'],				// An adoption event.
		ac: ['AdultChristening', ['adult','christen'], 'ac'],		// An adult christening event.
		an: ['Annulment', ['annul'], 'an'],			// An annulment event of a marriage.
		bp: ['Baptism', ['bapt'], 'bp'],				// A baptism event.
		brm: ['BarMitzvah', ['barmit'], 'brm'],			// A bar mitzvah event.
		btm: ['BatMitzvah', ['batmit'], 'btm'],			// A bat mitzvah event.
		b: ['Birth', ['birth'], 'b'],					// A birth event.
		bl: ['Blessing', ['bless'], 'bl'],				// A an official blessing event, such as at the hands of a clergy member or at another religious rite.
		br: ['Burial', ['bur'], 'br'],				// A burial event.
		c: ['Census', ['cens'], 'c'],				// A census event.
		ch: ['Christening', ['christen'], 'ch'],			// A christening event at birth. Note: use AdultChristening for a christening event as an adult.
		cc: ['Circumcision', ['circumcis'], 'cc'],			// A circumcision event.
		cf: ['Confirmation', ['confirm'], 'cf'],			// A confirmation event (or other rite of initiation) in a church or religion.
		cr: ['Cremation', ['cremat'], 'cr'],			// A cremation event after death.
		d: ['Death', ['death'], 'd'],					// A death event.
		dv: ['Divorce', ['divorce'], 'dv'],				// A divorce event.
		df: ['DivorceFiling', ['divorce','fil'], 'df'],		// A divorce filing event.
		ed: ['Education', ['educat'], 'ed'],			// A education or an educational achievement event (e.g. diploma, graduation, scholarship, etc.).
		en: ['Engagement', ['engage'], 'en'],			// An engagement to be married event.
		em: ['Emigration', ['emigrat'], 'em'],			// An emigration event. (visit a country)
		ex: ['Excommunication', ['excommun'], 'ex'],		// An excommunication event from a church.
		fc: ['FirstCommunion', ['communion'], 'fc'],		// A first communion event.
		f: ['Funeral', ['funeral'], 'f'],				// A funeral event.
		g: ['Gender', ['gender'], 'g'],
		i: ['Immigration', ['immigrat'], 'i'],			// An immigration event.	(move to a country)
		l: ['LandTransaction', ['land','transact'], 'l'],		// A land transaction event.
		m: ['Marriage', ['marri'], 'm'],				// A marriage event.
		ma: ['MilitaryAward', ['military','award'], 'ma'],		// A military award event.
		md: ['MilitaryDischarge', ['military','discharge'], 'md'],	// A military discharge event.
		ms: ['Mission', ['mission'], 'ms'],				// A mission event.
		mf: ['MoveFrom', ['move','from'], 'mf'],				// An event of a move (i.e. change of residence) from a location.
		mt: ['MoveTo', ['move','to'], 'mt'],				// An event of a move (i.e. change of residence) to a location.
		nt: ['Naturalization', ['naturaliz'], 'nt'],		// A naturalization event (i.e. acquisition of citizenship and nationality).
		ord: ['Ordination', ['ordinat'], 'ord'],			// An ordination event.
		ret: ['Retirement', ['retire'], 'ret'],			// A retirement event.
		x:	['BirthAndDeath', ['birth'], 'x']
		};

		var infoTypes = {
			n: 'name',
			g: 'gender'
		};
		
		// return property 
		var getPersonProperty = function(id) {
			var evType = eventTypes[id];
			if (evType) {
				return slTxt.uncapitalize(evType[0]);
			}
			var infTyp = infoTypes[id];
			return infTyp;
		};

		

		slSel.eventName = function (eventType) {
			var evType = eventTypes[eventType];
			if (evType) {
				return evType[0];
			}
			return 'unknown';
		};

		slSel.extractType = function (txt) {
			var lct = txt.toLowerCase();
			for (var prop in eventTypes) {
				if (eventTypes.hasOwnProperty(prop)) {
					var len = prop[1].length;
					for (var i = 0; i < len; i++) {
						if (lct.indexOf(prop[i][1]) >= 0) {
							return prop[0];
						}
					}
				}
			}
			return undefined;
		};

		var compareMonthDay = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pdate = personProp.date;
			var sdate = srcProp.date;
			if (!pdate || !sdate) {
				return undefined;
			}
			if (sdate[0] === 0 && sdate[1] === 0) {
				// source has no month day info.
				return undefined;
			}
			var srcTxt = slTxt.dayMonth(sdate);
			var rslt = 0;
			if (pdate[0] === sdate[0]) {
				++rslt;
			}
			if (pdate[1] === sdate[1]) {
				++rslt;
			}
			if (rslt === 2) {
				return ['exact', srcTxt];
			}
			if (rslt === 1) {
				return ['near', srcTxt];
			}
			return ['no', srcTxt];
		};

		var compareYear = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pdate = personProp.date;
			var sdate = srcProp.date;
			if (!pdate || !sdate || pdate.length < 3 || sdate.length < 3) {
				return undefined;
			}
			var srcTxt = sdate[2].toString();
			var find = pdate[2];
			var rslt = sdate[2] - find;
			if (rslt === 0) {
				return ['exact', srcTxt];
			}
			if (Math.abs(rslt) <= 2) {
				return ['near', srcTxt];
			}
			return ['no', srcTxt];
		};

		var plMatch = function (pl1, pl2) {
			if (pl1 && pl2) {
				return pl1.toLowerCase() === pl2.toLowerCase();
			}
			return false;
		};

		var plMatchLoc = function (plArr, find) {
			find = find.toLowerCase();
			var len = plArr.length;
			for (var i = 0; i < len; i++) {
				if (plArr[i].toLowerCase() === find) {
					return i;
				}
			}
			return -1;
		};


		var comparePlace0 = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pplace = personProp.place;
			var splace = srcProp.place;
			if (!pplace || !splace) {
				return undefined;
			}
			var srcTxt = splace[0];
			var find = pplace[0];
			if (plMatch(find,splace[0])) {
				return ['exact', srcTxt];
			}
			var loc = plMatchLoc(splace,find);
			if (loc >= 0) {
				return ['near', splace[loc]];
			}
			srcTxt = [''];
			slTxt.addPlace(splace, srcTxt);
			return ['no', srcTxt[0]];
		};

		var comparePlace1 = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pplace = personProp.place;
			var splace = srcProp.place;
			if (!pplace || !splace) {
				return undefined;
			}
			var srcTxt = splace[1];
			var find = pplace[1];
			if (plMatch(find,splace[1])) {
				return ['exact', srcTxt];
			}
			var loc = plMatchLoc(splace,find);
			if (loc >= 0) {
				return ['near', splace[loc]];
			}
			srcTxt = [''];
			slTxt.addPlace(splace, srcTxt);
			return ['no', srcTxt[0]];
		};

		var comparePlace2 = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pplace = personProp.place;
			var splace = srcProp.place;
			if (!pplace || !splace) {
				return undefined;
			}
			var srcTxt = splace[2];
			var find = pplace[2];
			if (plMatch(find,splace[2])) {
				return ['exact', srcTxt];
			}
			var loc = plMatchLoc(splace,find);
			if (loc >= 0) {
				return ['near', splace[loc]];
			}
			srcTxt = [''];
			slTxt.addPlace(splace, srcTxt);
			return ['no', srcTxt[0]];
		};

		var comparePlace3 = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var pplace = personProp.place;
			var splace = srcProp.place;
			if (!pplace || !splace) {
				return undefined;
			}
			var srcTxt = splace[3];
			var find = pplace[3];
			if (plMatch(find,splace[3])) {
				return ['exact', srcTxt];
			}
			var loc = plMatchLoc(splace,find);
			if (loc >= 0) {
				return ['near', splace[loc]];
			}
			srcTxt = [''];
			slTxt.addPlace(splace, srcTxt);
			return ['no', srcTxt[0]];
		};

		var compareGivName = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			
			var find = personProp[0];
			var sGName = srcProp[0];
			var srcTxt = sGName;
			if (find === sGName) {
				return ['exact', srcTxt];
			}
			var pGNames = slTxt.splitIntoWords(find);
			var sGNames = slTxt.splitIntoWords(sGName);
			var pLen = pGNames.length;
			var sLen = sGNames.length;
			if (pLen > 1 || sLen > 1) {
				for (var i = 0; i < pLen; i++) {
					if (sGNames.indexOf(pGNames[i]) >= 0) {
						return ['near', srcTxt];
					}
				}
			}
			return ['no', srcTxt];
		};

		var compareFamName = function (personProp, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var find = personProp[1];
			var sFName = srcProp[1];
			var srcTxt = sFName;
			if (find === sFName) {
				return ['exact', srcTxt];
			}
			return ['no', srcTxt];
		};

		var compareProp = function (find, srcProp) {
			if (!srcProp) {
				return undefined;
			}
			var srcTxt = srcProp;
			if (find === srcProp) {
				return ['exact', srcTxt];
			}
			return ['no', srcTxt];
		};

		var compareFuncs = {
			M: compareMonthDay,
			Y: compareYear,
			P0: comparePlace0,
			P1: comparePlace1,
			P2: comparePlace2,
			P3: comparePlace3,
			G: compareGivName,
			F: compareFamName,
			default: compareProp
		};

		var getMonthDay = function (event) {

			return slTxt.dayMonth(event.date);
		};

		var getYear = function (event) {

			return event.date[2];
		};

		var getPlace0 = function (event) {
			return event.place[0];
		};

		var getPlace1 = function (event) {
			return event.place[1];
		};

		var getPlace2 = function (event) {
			return event.place[2];
		};

		var getPlace3 = function (event) {
			return event.place[3];
		};

		var getGivName = function (event) {
			return event[0]; 
		};

		var getFamName = function (event) {
			return event[1];
		};

		var getProp = function (event) {
			return event;
		};

		var valueFuncs = {
			M: getMonthDay,
			Y: getYear,
			P0: getPlace0,
			P1: getPlace1,
			P2: getPlace2,
			P3: getPlace3,
			G: getGivName,
			F: getFamName,
			gender: getProp,
		};

		var getEventValue = function (event, prop, partId) {
			if (event) {
				return valueFuncs[partId ? partId : prop](event);
			}
			return undefined;
		};

		slSel.getCompare = function (person,seqNum,other) {
			var selIdx;
			var seqTxt = seqNum[0];
			var eventId = '';
			var partId = '';
			var len = seqTxt.length;
			for (var i = 0; i < len; i++) {
				var chr = seqTxt.charAt(i);
				if (chr === chr.toLowerCase() && chr !== chr.toUpperCase()) {
					eventId += chr;
				} else {
					partId += chr;
				}
			}
			if (seqNum.length > 1) {
				selIdx = seqNum[1];
				partId += selIdx;		// Should always be partId in this case
			}
			var prop = getPersonProperty(eventId);
			var event = person[prop];
			if (!event && other) {
				event = other[prop];
			}
			var eventVal = getEventValue(event, prop, partId);
			var cmpFunc = compareFuncs[partId ? partId : 'default'];
			return {
				prop: prop,
				compareFunc: cmpFunc,
				event: event,
				target: eventVal
			};
		};



/*
		// Possible sub-event types
		var subEventType = [
			//	[subEventTypeName,  subEventTypeAbbreviationProperty
			['Day And Month', 'M'],	// month and Day of event
			['Year', 'Y'],			// year of event
			['Place', 'P']			// place of event
		];
*/

		//========================================================================================
		// selectionId = always begins with relTypeAbbreviation
		//================================================================================
		// selectRects: array of ['id', rectangle] values to identify the location of 
		//				the selection fields on the canvas.
		//==========================================================================================
		// List of selection ID's that are used to identify selection regions.
		//	All selection ID's are temporary reflecting the current established relationships
		//	All relationships/sequences are in relation to the REFERNCE person
		//	There are cases where two unique selection ID's can reference the same person (such
		//	as a person who is listed as a child of more than one set of parents).
		//------------------------------------------------------------------------------------------
		//	Selection ID's are broken into fields depending on the ID:
		//	[required] <optional>
		//	[person]<person sequence#><group><group sequence#>[event][EVENTTYPE]<typeSequence>
		//  Example Birthyear of 2nd sibling of 1st parents:  s1a0bY
		//------------------------------------------------------------------------------------------
		//	Sequence numbers my have gaps based on missing information such as
		//	more than one set of parents with a missing father or mother.
		//==========================================================================================
		//	[person]:
		//------------------------------------------------------------------------------------------
		//	'R' = reference Person (only one) no personSequence # needed
		//	'f' = father - person sequence numbers match corresponding wife's person sequence number
		//	'm' = mother - person sequence numbers match corresponding husband's person sequence number
		//	'p' = spouse - person sequence numbers based on chronoligical spouse
		//	's' = sibling - person sequence numbers match a chronological sibling of a parent group
		//	'c' = child - person sequence numbers match a chronological child of a wife group
		//------------------------------------------------------------------------------------------
		//	[event]-->[EVENTTYPE]
		//------------------------------------------------------------------------------------------
		//	'n' = person's name		-->		'G' = given name(s)		'F' = family name(s)
		//  'g' = person's gender
		//	'b' = birth				-->		'M' = day and month		'Y' = year	'P' = place <#>
		//	'h' = christening		-->		'M' = day and month		'Y' = year	'P' = place <#>
		//	'm'	= marriage			-->		'M' = day and month		'Y' = year	'P' = place <#>
		//	'd' = death				-->		'M' = day and month		'Y' = year	'P' = place <#>
		//  'x' = birth and death	-->		'M' = day and month		'Y' = year	'P' = place <#>
		//  'r' = record number
		//------------------------------------------------------------------------------------------
		//	<group><group sequence#>		// groups will always be followed by seq number
		//------------------------------------------------------------------------------------------
		//	'a' = ancestor group -	matches the sequence number of father and/or mother
		//	'd' = descendant group - matches the sequence number of spouse
		//------------------------------------------------------------------------------------------
		//------------------------------------------------------------------------------------------
		//	following are the set of ID's for the reference person
		//------------------------------------------------------------------------------------------
		//  Name:
		//------------------------------------------------------------------------------------------
		//	'RnG'	given name(s)					'RnF'	family name(s)
		//------------------------------------------------------------------------------------------
		//	Dates:
		//------------------------------------------------------------------------------------------
		//	'RbM'	birth Day and Month				'RbY'	birth Year
		//	'Rd1mM'	1st marriage Day and Month		'Rd2Y'	2nd marriage Year
		//	'RdM'	death Day and Month				'RdY'	death Year
		//------------------------------------------------------------------------------------------
		//	Places are broken into up to four(?) parts that were delimited by commas on input.
		//------------------------------------------------------------------------------------------
		//	'RbP0'	birth Place first part (town?)		'RbP1'	birth Place second part (county?)
		//	'RbP2'	birth Place third part (state?)		'RbP3'	birth Place fourth part	(nation?)
		//	'RdP0'	death Place first part (town?)		'RdP1'	death Place second part (county?)
		//	'RdP2'	death Place third part (state?)		'RdP3'	death Place fourth part	(nation?)

		// selectRects = [selectGrpNumber][whichSelectRect][selID,rectangle]
		var selectRects = [[], [], []];
		var idMap = new Map();
		var mapBuilt = false;
		var readyToSelect = false;
		// region 0 is person area, 1 is attached area, 2 is unattached area
		var selectRegions = [];
		var attachedSelection = [];

		

		

		slSel.setRegions = function (align) {
			selectRegions.length = 0;
			selectRegions.push(align.persBox);
			selectRegions.push(align.attBox);
			selectRegions.push(align.unAttBox);
		};

		// index into selectRects for attached Source objects
		slSel.attSrc = 1;
		// index into selectRects for unattached Source objects
		slSel.unAttSrc = 2;

		slSel.attRects = function () {
			return selectRects[slSel.attSrc];
		};

		var whitespace = ' \t\n\r\v';
		var punctuation = ';:,.';
//		var whitepunct = whitespace + punctuation;

		var dateRegex1 = /[\s;:,.]*([0123]\d|\d)\s([a-zA-Z]+)[,\s]+([\d]+)/;  // 12 june, 1900 
//		var dateRegex2 = /[\s;:,.]*([a-zA-Z]+)\s([0123]\d|\d)[,\s]+([\d]+)/;	// June 12, 1900

		var normalizeDate = function(text) {
			var found;
			var regex = dateRegex1;
			text.replace(regex, function($0, $1, $2, $3) {
				found = [$1, $2, $3];
			});
			if (found) {
				var nmzDate = found[0] + ' ' + found[1] + ' ' + found[2];
				var loc = text.search(found[2]) + found[2].length;
				return [nmzDate ,loc];
			}
		};

		var locationRegex = /[\s;:,.]*(([a-zA-Z\s']+,){0,3}\s[a-zA-Z\s']+)/;

		var normalizeLocation = function (text) {
			var found;
			var regex = locationRegex;
			text.replace(regex, function($0, $1) {
				found = $1;
			});
			return found;
		};

		var getEventInfo = function (text) {
			// trim whitespace and punctuation from start
			var date = normalizeDate(text);
			var event;
			if (date) {
				var place = normalizeLocation(text.substring(date[1], text.length));
				event = slTxt.event(date[0], place);
			}
			return event;
		};


		// Look for either 'name' in the text to find a name
		// or the names of the person this source is attached to.
		// If a name doesn't start with a capital letter it is not found
		var createName = function (text, names, fields, i) {
			var field = fields[i];
			var nameLoc;
			var name = [];
			var ctype;
			var len,j;
			if (field[2] === 0) {
				// 'name' found in text
				nameLoc = field[0] + 4;
				for (; ;) {
					ctype = slTxt.charType(text.charCodeAt(nameLoc));
					if (ctype === 'a') {
						break;
					} else if (ctype === 'n') {
						nameLoc = undefined;
						break;
					}
					++nameLoc;
					if (nameLoc >= text.length) {
						nameLoc = undefined;
						break;
					}
				}
				if (nameLoc) {
					var nextF = fields[++i];
					if (nextF[0] !== nameLoc) {
						var subs = text.substring(nameLoc, nextF[0]);
						var parts = subs.split(' ');
						len = parts.size();
						for (j = 0; j < len; j++) {
							var test = parts[j];
							if (slTxt.charType(test.charCodeAt(0)) !== 'a' || test.charAt(0) !== test.charAt(0).toUpperCase) {
								break;
							}
							var done = 0;
							for (; ;) {
								ctype = slTxt.charType(test.charCodeAt(test.length - 1));
								if (ctype === 'o') {
									// allow one punctuation character at the end of a name part
									// If puncuation is found, the name ends.
									if (++done > 1) {
										break;
									}
								} else if (ctype === 'n') {
									++done;
									break;
								} else {
									test = test.substring(0, test.length - done);
									name.push(test);
								}
							}
							if (done > 0) {
								break;
							}
						}
					}
				}
				if (name.length === 0) {
					return [undefined,i - 1];
				}
			} else {
				name = [names[field[2]]];
				while (fields[++i] && fields[i][1] === 'n') {
					var nameIdx = fields[i][2];
					if (nameIdx !== 0) {
						name.push(names[nameIdx]);
					} else {
						break;
					}
				}
			}
			return [name, i - 1];
		};

		var indexOfNextWhiteSpace = function (text, startLoc) {
			return text.indexOf(' ', startLoc);
		};

		

		// Extract Names, Events and Relationships from text
		slSel.extractPersonInfo = function (person, text, setSourceTitle) {
			// find names
			var results = [];
			var names = ['name'];
			var i;
			var len;
			var name = person.name;
			var currNames;
			for (i = 0,len = name.length; i < len; i++) {
				names.push.apply(names,slTxt.splitIntoWords(name[i]));
			}
			var foundFields = [];
			var loc;
			var find;
			for (i = 0, len = names.length; i < len; i++) {
				// search for name as an complete word in text which could end
				// with punctuation
				find = names[i];
				loc = text.indexOf(find);
				while (loc >= 0) {
					var next = loc + names[i].length;
					if ((loc === 0 || whitespace.indexOf(text[loc - 1]) > -1) &&
						(next === text.length || whitespace.indexOf(text.charAt(next)) > -1 ||
							punctuation.indexOf(text.charAt(next)) > -1)) {
						foundFields.push([loc, 'n', i]);
						loc = text.indexOf(find, loc + find.length);
					} else {
						loc = -1;
					}
				}
			}
			//			var lwrcTxt = text.toLowerCase();
			for (var prop in eventTypes) {
				if (eventTypes.hasOwnProperty(prop)) {
					find = prop[1];
					loc = text.indexOf(find);
					while (loc >= 0) {
						foundFields.push([loc, 'e', prop[1].toLowerCase()]);
						loc = text.indexOf(find, loc + find.length);
					}
				}
			}
			for (i = 0, len = relType.length; i < len; i++) {
				find = relType[i][0];
				loc = text.indexOf(find);
				while (loc >= 0) {
					foundFields.push([loc, 'r', relType[i][1]]);
					loc = text.indexOf(find, loc + find.length);
				}
			}
			if (foundFields.length === 0) {
				return results;
			}
			foundFields.sort(function (a, b) { return a[0] - b[0]; });
			if (setSourceTitle) {
				setSourceTitle.title = text.substring(0, foundFields[0][0] - 1);
			}
			var start,end;
			var relation;
			len = foundFields.length;
			for (i = 0; i < len; i++) {
				var f = foundFields[i];
				if (f[1] === 'n') {
					var rval = createName(text, names, foundFields, i);
					i = rval[1];
					currNames = rval[0];
				} else if (f[1] === 'e') {
					start = indexOfNextWhiteSpace(text, f[0]);
					end = (i + 1 < len) ? foundFields[i + 1][0] : text.length;
					var ei = getEventInfo(text.substring(start, end));
					if (ei) {
						results.push([currNames ? currNames : person, relation, f[2], ei]);
						if (setSourceTitle) {
							setSourceTitle.title += ' ' + f[2];
						}
						currNames = undefined;
						relation = undefined;
					}
				} else if (f[1] === 'r') {
					var newRelation = f[2];
					if (relation && newRelation !== relation) {
						results.push([currNames ? currNames : person, relation]);
					}
					relation = newRelation;
				}
			}
			return results;
		};

		slSel.eventText = function (id) {
			if (!mapBuilt) {
				idMap.set('nG', 'given name');
				idMap.set('nF', 'family name');
				idMap.set('bM', 'birth day and month');
				idMap.set('bY', 'birth year');
				idMap.set('bP', 'birth place');
				idMap.set('dM', 'death day and month');
				idMap.set('dY', 'death year');
				idMap.set('dP', 'death place');
				idMap.set('hM', 'christening day and month');
				idMap.set('hY', 'christening year');
				idMap.set('hP', 'christening place');
				idMap.set('mM', 'marriage day and month');
				idMap.set('mY', 'marriage year');
				idMap.set('mP', 'marriage place');
				idMap.set('xM', 'birth and death day and month');
				idMap.set('xY', 'birth and death year');
				idMap.set('xP', 'birth and death place');
				mapBuilt = true;
			}
			return idMap.get(id);
		};

		
		slSel.clear = function () {
			readyToSelect = false;
			selectRects = [[], [], []];
		};

		slSel.clearAtt = function () {
			selectRects[slSel.attSrc].length = 0;
		};

		slSel.ready = function () {
			return readyToSelect;
		};

		slSel.rect = function (sel) {
			return selectRects[sel[0]][sel[1]][1];
		};

		slSel.selId = function (sel) {
			return selectRects[sel[0]][sel[1]][0];
		};

		slSel.pushSR = function (selObj,which) {
			var grp = which ? which : 0;
			selectRects[grp].push(selObj);
		};

		slSel.nextSR = function (which) {
			var grp = which ? which : 0;
			return selectRects[grp].length;
		};

		slSel.offsetSelectRects = function (startSR, endSR, offsetX, offsetY,which) {
			var grp = which ? which : 0;
			for (var i = startSR; i < endSR; i++) {
				selectRects[grp][i][1].loc.x += offsetX;
				selectRects[grp][i][1].loc.y += offsetY;
			}
		};

		slSel.startSelection = function () {
			/*
			var sortSR = function (a, b) {
			if (a[1].loc.x === b[1].loc.x) {
			return a[1].loc.y - b[1].loc.y;
			}
			return a[1].loc.x - b[1].loc.x;
			};
			selectRects.sort(sortSR);
			*/
			readyToSelect = true;
		};

		// return true if x,y is inside rect
		slSel.insideArea = function (x, y, rect) {
			return (x >= rect.loc.x && x <= rect.loc.x + rect.d.x &&
					y >= rect.loc.y && y <= rect.loc.y + rect.d.y);
		};

		slSel.searchSR = function (x, y) {
			// search them all
			var grp,i,len;
			len = 3;
			for (grp = 0; grp < len; grp++) {
				if (slSel.insideArea(x, y,selectRegions[grp])) {
					break;
				}
			}
			if (grp > 2) {
				return undefined;
			}
			len = selectRects[grp].length;
			for (i = 0; i < len; i++) {
				if (slSel.insideArea(x, y, selectRects[grp][i][1])) {
					return [grp,i];
				}
			}
			return undefined;
		};

		var getEndNumber = function (selId) {
			var bscan = selId.length - 1;
			if (isNaN(selId.charAt(bscan))) {
				return undefined;
			}
			var endNumber = 0;
			while (bscan > 0) {
				if (isNaN(selId[--bscan])) {
					break;
				}
			}
			++bscan;
			var scan = bscan;
			var num = Number(selId.charAt(scan));
			while (!isNaN(num)) {
				endNumber = endNumber * 10 + num;
				num = Number(selId[++scan]);
				if (scan >= selId.length) {
					break;
				}
			}
			return [endNumber, bscan];
		};

		slSel.getActvSequenceNumber = function (selId) {
			var endNumber = getEndNumber(selId);
			if (endNumber) {
				return [selId.substring(1, endNumber[1]), endNumber[0]];
			}
			return [selId.substring(1, selId.length)];
		};

		slSel.getPersonSequenceNumber = function (selId) {
			var scan = 0;
			var number = 0;
			var num = Number(selId[++scan]);
			while (!isNaN(num)) {
				number = number * 10 + num;
				num = Number(selId[++scan]);
			}
			var endNumber = getEndNumber(selId);
			if (endNumber) {
				var txt = selId.substring(scan, endNumber[1]);
				return [number, txt, endNumber[0]];
			}
			return [number, selId.substring(scan, selId.length)];

		};

		slSel.getPersonGroupSequenceNumber = function (selId) {
			var scan = 0;
			var pNumber = 0;
			var gNumber = 0;
			var num = Number(selId[++scan]);
			while (!isNaN(num)) {
				pNumber = pNumber * 10 + num;
				num = Number(selId[++scan]);
			}
			num = Number(selId[++scan]);
			while (!isNaN(num)) {
				gNumber = gNumber * 10 + num;
				num = Number(selId[++scan]);
			}
			var endNumber = getEndNumber(selId);
			if (endNumber) {
				var txt = selId.substring(scan, endNumber[1]);
				return [pNumber, gNumber, txt, endNumber[0]];
			}
			return [pNumber, gNumber, selId.substring(scan, selId.length)];
		};


		slSel.clearAttSel = function() {
			// set attachedSelection to be an array of undefined values
			// for each attached selection rectangle
			var len = selectRects[slSel.attSrc].length;
			attachedSelection = Array.apply(null,new Array(len)).map(function () {});
		};

		var addValue = function (attSelMatch, value) {
			var len = attSelMatch.length;
			for (var i = 0; i < len; i++) {
				var test = attSelMatch[i];
				if (test[0] === value) {
					++test[1];
					return;
				}
			}
			attSelMatch.push([value, 1]);
		};

		slSel.getAttSel = function (srcIdx) {
			return attachedSelection[srcIdx];
		};
		
		slSel.addAttSel = function (srcIdx, value, match) {
			if (!attachedSelection[srcIdx]) {
				attachedSelection[srcIdx] = {};
			}
			var attSel = attachedSelection[srcIdx];
			if (attSel[match]) {
				addValue(attSel[match],value);
			} else {
				attSel[match] = [[value, 1]];
			}
		};

		return slSel;
	}]);
})();
