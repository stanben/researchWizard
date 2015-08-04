(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	

	// Interface to a person's source Information that
	// requires extraction through parsing the information
	slApp.factory('slSrcX', /*[ 'slSel', 'slTxt',*/
		function (/*slSel, slTxt*/) {

			var slSrcX = {};
			var parseSourceCnt = 0;

/*
			// works for an array of primitive values
			var equalArray = function (ar1, ar2) {
				if (ar1 && ar2 && ar1.length === ar2.length) {
					var len = ar1.length;
					for (var i = 0; i < len; i++) {
						if (ar1[i] !== ar2[i]) {
							return false;
						}
					}
					return true;
				}
				return false;
			};

			var sameDate = function (dt1, dt2) {
				return dt1[0] === dt2[0] && dt1[1] === dt2[1] && dt1[2] === dt2[2];
			};

			var sameEvent = function (ev1, ev2) {
				return equalArray(ev1.place, ev2.place) && sameDate(ev1.date, ev2.date);
			};

			var mostRecentEvent = function (mostRecent, candidate) {
				if (!mostRecent ||slTxt.compareDate(mostRecent.date, candidate.date) < 0) {
					return candidate;
				}
				return mostRecent;
			};

			// Try to determine if name is similar to names
			//  maybe use a phonetic comparison algorithm such as doubleMetaphone
			var similarName = function (name, names) {
				var len = names.length;
				var nLen = name.length;
				var foundCnt = 0;
				for (var i = 0; i < len; i++) {
					var find = names[i];
					var found = false;
					for (var j = 0; j < nLen; j++) {
						found = name[j].indexOf(find) >= 0;
						if (found) {
							break;
						}
					}
					if (found) {
						++foundCnt;
					}
				}
				return (foundCnt === names.length || names.length > 2 && foundCnt >= 2);
			};

			var findPerson = function (person, name) {
				if (similarName(person.name, name)) {
					return person.id;
				}
				var i, len;
				if (person.spouses) {
					len = person.spouses.length;
					for (i = 0; i < len; i++) {
						var spouse = person.spouses[i];
					}
				}
				if (person.parents) {
					len = person.parents.length;
					for (i = 0; i < len; i++) {
						var parent = person.parents[i];
					}
				}
			};

			// test[0] and target[0] can be either an array of names
			// or an actual person see if either the names resonably
			// match.  if test is a person and target is a name then
			// replace target's name with the person if they match
			// return true if they are the same else return false
			var samePerson = function(test,target) {
				if (Array.isArray(test[0])) {
					if (Array.isArray(target[0])) {
						return similarName(test[0],target[0]);
					} else {
						return similarName(target[0].name,test[0]);
					}
				} else {
					if (Array.isArray(target[0])) {
						var similar = similarName(test[0].name,target[0]);
						if (similar) {
							target[0] = test[0];
						}
						return similar;
					} else {
						return (target[0].id === test[0].id);
					}
				}
			};

			var samePersonInfo = function (test, target) {
				if (test && target && test.length === target.length) {
					if (samePerson(test,target) &&
						(test[1] === target[1]) &&
						(test[2] === target[2])) {
						if (test.length === 4) {
							return sameEvent(test[3], target[3]);
						}
						return true;
					}
				}
				return false;
			};

			var addPersonInfo = function(dest,from) {
				if (from) {
					if (dest.length > 0) {
						var i;
						var fLen = from.length;
						var j;
						for (i = 0; i < fLen; i++) {
							var dLen = dest.length;
							var found = false;
							for (j = 0; j < dLen; j++) {
								if (samePersonInfo(from[i],dest[j])) {
									found = true;
									break;
								}
							}
							if (!found) {
								dest.push(found[i]);
							}
						}
					} else {
						dest.push.apply(dest, from);
					}
				}
			};

			var extractPersonInfo = function (srcInfo, person) {
				var persInfo = [];
				var extrInfo;
				var i, len;
				if (srcInfo.description.titles) {
					var titles = srcInfo.description.titles;
					for (i = 0, len = titles.length; i < len; i++) {
						var setSourceTitle = i === 0 ? srcInfo.source : undefined;
						extrInfo = slSel.extractPersonInfo(person, titles[i].value, setSourceTitle);
						if (extrInfo) {
							addPersonInfo(persInfo, extrInfo);
						}
					}
				}
				if (srcInfo.description.notes) {
					var notes = srcInfo.description.notes;
					for (i = 0, len = notes.length; i < len; i++) {
						extrInfo = slSel.extractPersonInfo(person, notes[i].text);
						if (extrInfo) {
							addPersonInfo(persInfo, extrInfo);
						}
					}
				}
				var source = srcInfo.source;
				len = persInfo.length;
				for (i = 0; i < len; i++) {
					var pinf = persInfo[i];
					if (pinf && pinf[0]) {
						var srcPerson = {
							name: pinf[0]
						};
						if (pinf[1]) {
							srcPerson.relation = pinf[1];
						}
						if (pinf[2]) {
							srcPerson[pinf[2]] = pinf[3];
							var prevEvent = source.event;
							source.event = mostRecentEvent(source.event, pinf[3]);
							if (prevEvent !== source.event) {
								source.type = pinf[2].toUpperCase();
							}
						}
						source.people.push(srcPerson);
					}
				}
			};



			var extractSource = function (srcInfo) {
				++parseSourceCnt;
				srcInfo.source = {
					type: 'Extracted',
					id: 'PS' + parseSourceCnt,
					title: undefined,
					event: undefined,
					people: []
				};
			};
*/

			// Extract source information from srcInfo
			slSrcX.extract = function (/*srcInfo, person*/) {
				/*
					extractSource(srcInfo);
					extractPersonInfo(srcInfo, person);
					var source = srcInfo.source;
				
					var sourcePersonId = srcInfo.persId;
					if (source) {
						add(srcInfo.source);
						srcInfo.pushSourceId(srcInfo.persId, source.id, sourcePersonId);
					}
			*/
			};

			slSrcX.init = function () {
				parseSourceCnt = 0;
			};

			return slSrcX;
		}/*]*/);
})();