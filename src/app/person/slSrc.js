(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	
	//============================================================================================================
	// Interface to a person's source Information
	slApp.factory('slSrc', [ '$http', 'slSel', 'slSrcX', 'slTbl', 'slTxt', 'slCSS', 'slUtl', 'alert',
		function (http, slSel, slSrcX, slTbl, slTxt, slCSS, slUtl, alert) {
			
			var slSrc = {};
			var sources = new Map();	// map of sources by source.id
			var sequenceNumber = 0;
			var createdCnt = 0;

			var totalSources;
			var sourcesComplete = 0;
			var installSourcesCB;
			var debugLog = false;
			var busy;
			var notBusy;

			//============================================================================================================
			// object that identifies sequence order for sorting people by relation (trying to sequence by age):
			var relationOrder = {
				grandfather: 1,
				grandmother: 2,
				grandparent: 3,
				father: 4,
				mother: 5,
				parent: 6,
				fatherinlaw: 7,
				motherinlaw: 8,
				uncle: 9,
				aunt: 10,
				head: 11,
				deceased: 11,
				husband: 12,
				wife: 13,
				spouse: 14,
				brother: 15,
				sister: 16,
				sibling: 17,
				brotherinlaw: 18,
				sisterinlaw: 19,
				cousin: 20,
				son: 21,
				daughter: 22,
				child: 23,
				nephew: 24,
				niece: 25,
				grandson: 26,
				granddaughter: 27,
				grandchild: 28,
				other: 29,
				undefined: 30
			};

			var getRelationOrder = function (relation) {
				var val = relationOrder[relation];
				return val ? val : relationOrder.undefined;
			};

			//============================================================================================================
			//  Contents for each source record:
			//  source.id			--	unique source id which identifies the same source record
			//  source.title		--  what this source is.
			//  source.type			--  such as marriage, birth, death, etc.
			//  source.event		--	date and place of source event
			//	source.attPeople	--	Map which contains people attached to source using person's record-id as key
			//  source.people		--	sorted array of all people listed in source (see personCompare)
			//  -- all entries in the source.attPeople list are also in the source.people list
			//============================================================================================================
			//============================================================================================================
			// Contents for each person record:
			// person.relation		-- relation to head or principle person of source
			// 
			//============================================================================================================

			// sourcesRequestedPerPerson stores a count of every source requested per each person
			// processed.  This value is only set after all load requests have been performed. 
			var sourcesRequestedPerPerson;	// Map: key is personId; value = sources count;				
			var sourcesReturnedPerPerson = new Map();  // key is personId; value = [count]
			var allSourcesReturned = false;
			
			var nameToParts = function(name) {
				if (typeof name === 'string') {
					return slTxt.splitIntoWords(name);
				}
				var parts = [];
				if (slTxt.isValid(name[0])) {
					parts = slTxt.splitIntoWords(name[0]);
				}
				if (slTxt.isValid(name[1])) {
					parts = parts.concat(slTxt.splitIntoWords(name[1]));
				}
				return parts;
			};

			// compare strings of s to strings of l
			// all strings of s must be in l within 1 location
			var compareShorterToLonger = function(s,l) {
				var lens = s.length;
				for (var i = 0; i < lens; i++) {
					var len = i + 1;
					var match = false;
					for (var j = 0; j < len ; j++) {
						if ((s[i].indexOf(l[j]) === 0) ||
							(l[j].indexOf(s[i]) === 0)) {
							match = true;
							break;
						}
					}
					if (!match) {
						return false;
					}
				}
				return true;
			};

			// Entire Names need to either match or 2 names need to match
			var nameCompare = function (n1, n2) {
				var parts1 = nameToParts(n1);
				var parts2 = nameToParts(n2);
				var len1 = parts1.length;
				var len2 = parts2.length;
				if (len1 === len2) {
					for (var i = 0; i < len1; i++) {
						if ((parts2[i].indexOf(parts1[i]) !== 0) &&
								(parts1[i].indexOf(parts2[i]) !== 0)) {
							return false;
						}
					}
					return true;
				}
				if (Math.abs(len1 - len2) > 1) {
					return false;
				}
				if (Math.min(len1, len2) === 1) {
					return false;
				}
				if (len1 > len2) {
					return compareShorterToLonger(parts2, parts1);
				}
				return compareShorterToLonger(parts1,parts2);
			};

			// return true if p1 and p2 are the same person
			var samePerson = function(p1,p2) {
				var diff = 0;
				var match;
				// compare Name
				if (p1.name && p2.name) {
					match = nameCompare(p2.name, p1.name);
					if (!match) {
						return false;
					}
				}
				// compare age
				if (p1.birth && p1.birth.date && p2.birth && p2.birth.date) {
					diff = slTxt.compareDate(p1.birth.date,p2.birth.date);
				} else if (p1.age && p2.age) {
					diff = p2.age - p1.age;
				}
				if (diff !== 0) {
					return false;
				}
				// sort by id
				if (p1.id && p2.id) {
					diff = p1.id.localeCompare(p2.id);
					if (diff !== 0) {
						return false;
					}
				}
				return true;
			};

			// compare two people sorted by relation, age, name, id
			var personCompare = function (p1, p2) {
				var diff = 0;
				// sort by relation
				if (p1.relation && p2.relation) {
					diff = getRelationOrder(p1.relation) - getRelationOrder(p2.relation);
				}
				if (diff !== 0) {
					return diff;
				}
				// sort by age
				if (p1.birth && p1.birth.date && p2.birth && p2.birth.date) {
					diff = slTxt.compareDate(p1.birth.date, p2.birth.date);

				} else if (p1.age && p2.age) {
					diff = p2.age - p1.age;
				}
				if (diff !== 0) {
					return diff;
				}
				// sort by name
				if (p1.name && p2.name) {
					diff = nameCompare(p1.name, p2.name);
					if (diff !== 0) {
						return diff;
					}
				}
				// sort by id
				if (p1.id && p2.id) {
					diff = p1.id.localeCompare(p2.id);
					if (diff !== 0) {
						return diff;
					}
				}

				/*
								// sort by sequence number
								if (p1.seqNum && p2.seqNum) {
									diff = p2.seqNum - p1.seqNum;
								}
								
				
				*/
				return diff;
			};

			var sortSourcesPeople = function () {
				sources.forEach(function (source) {
					source.people.sort(personCompare);
				}, sources);
			};

			slSrc.get = function(srcId) {
				return sources.get(srcId);
			};

			var sameRelationType = function (src1, src2) {
				if (src1.relation && src2.relation) {
					if (src1.relation !== src2.relation) {
						return false;
					}
				}
				var notSame = false;
				src1.attPeople.forEach( function(person1,key) {
					var person2 = src2.attPeople.get(key);
					if (person2 && person2.relationshipToHead !== person1.relationshipToHead) {
						notSame = true;
					}
				});
				return !notSame;
			};

			var placeInSameGroup = function(src1,src2) {
				return (slTxt.sameGroupType(src1.type,src2.type) && sameRelationType(src1,src2));
			};

			// return:	-1 if src1 is to be placed after src2;
			//			0 if src1 should be in same group as src2
			//			1 if src1 is to be placed before src2
			var sourceSlot = function (src1, src2) {
				if (placeInSameGroup(src1,src2)) {
					return 0;
				}
				var dateDiff = slTxt.compareDate(src1.event ? src1.event.date : undefined,
												src2.event ? src2.event.date : undefined);
				if (dateDiff === 0) {
					return src1.id - src2.id;
				}
				return dateDiff;
			};

			// given a sourceGrp -- array of sourceIds
			// return array of corresponding sources
			slSrc.grpToSources = function (sourceGrp) {
				var sources = [];
				var len = sourceGrp.length;
				for (var i = 0; i < len; i++) {
					var source = slSrc.get(sourceGrp[i]);
					if (source) {
						sources.push(source);
					}
				}
				return sources;
			};

			//==============================================================
			// a Map of personId, sources managed by addSourceToPerson
			var personSources;		
			// sources are ordered chronologically
			// person.sources is an array of an array of sourceRefs which store
			// duplicate groups such as birth, marriage, and death/burial
			// a list of these sources are created for each personId
			// when complete they are moved to the person
			var addSourceToPerson = function (personId, sourceId) {
				if (!personSources) {
					personSources = new Map();
				}
				var source = slSrc.get(sourceId);
				var sources = personSources.get(personId);
				if (!sources) {
					personSources.set(personId, [[sourceId]]);
					return;
				}
				var len = sources.length;
				var loc;
				for (loc = 0; loc < len; loc++) {
					var nextSource = slSrc.get(sources[loc][0]);
					var fit = sourceSlot(source, nextSource);
					if (fit === 0) {
						// make sure this source isn't already in the group list
						var glen = sources[loc].length;
						for (var i = 0; i < glen; i++) {
							var grpSrcId = sources[loc][i];
							if (grpSrcId === sourceId) {
								return;
							}
						}
						// place in same group
						sources[loc].push(sourceId);
						return;
					} else if (fit < 0) {
						break;
					}
				}
				sources.splice(loc, 0, [sourceId]);
			};

			var incrsourcesReturnedPerPerson = function (persId) {
				var retCnt = sourcesReturnedPerPerson.get(persId);
				if (retCnt) {
					++retCnt[0];
					return retCnt[0];
				} 
				sourcesReturnedPerPerson.set(persId, [1]);
				return 1;
			};


			var add = function (source) {
				sources.set(source.id, source);
			};


			// List type values in order and part seperation last
			var PartOrder = {
				date: ['DAY', 'MONTH', 'YEAR', ' '],
				place: ['CITY', 'COUNTY', 'STATE', 'COUNTRY', ', ']
			};

/*
			var otherPartFieldId = [
				'EVENT_CEMETERY'
			];

			var otherPartName = [
				'cemetery''
			];
*/

			var mergeParts = function (parts,type) {
				var build = {};
				var len = parts.length;
				var i;
				for (i = 0; i < len; i++) {
					build[parts[i].type] = parts[i].text;
				}
				var order = PartOrder[type];
				len = order.length - 1;
				var padding = order[len];
				var text = '';
				for (i = 0; i < len; i++) {
					if (build[order[i]]) {
						if (text.length > 0) {
							text += padding;
						}
						text += build[order[i]];
					}
				}
				return text;
			};

			// return normalized.text/parts, else Original.text/parts
			// otherwise return undefined
			var normzdOrignl = function (where, type) {
				var retval;
				if (where) {
					if (where.normalized && where.normalized.length > 0) {
						if (where.normalized[0].text) {
							return where.normalized[0].text;
						}
						if (where.normalized[0].parts && type) {
							retval = mergeParts(where.normalized[0].parts,type);
							if (retval) {
								return retval;
							}
						}
					}
					if (where.original) {
						if (where.original.text) {
							return where.original.text;
						}
						if (where.original.parts && type) {
							retval = mergeParts(where.original.parts,type);
							if (retval) {
								return retval;
							}
						}
					}
				}
				return undefined;
			};

			var personTypeFields = {
				age: 'age',
				relationshipToHead: 'relation',
			};

			var typeFields = {
				language: 'language'
			};

			var descrFields = {
				sourceNewspaper: 'newspaper'
			};

			var setGender = function (gender) {
				var rslt = gender.charAt(0);
				if (rslt === 'u' || rslt === 'U') {
					return undefined;
				}
				return rslt;
			};

			var personSkipProps = ['gender', 'characteristic', 'note', 'sourceCitation', 'census'];

			var getOtherRelation = function (info) {
				console.log(info.crash);
			};

			var spouseRecords = ['marriage', 'census'];

			var spouseRelation = function (gender, sourceType) {
				if (spouseRecords.indexOf(sourceType.toLowerCase()) >= 0) {
					return (gender === 'M') ? 'husband' :
						(gender === 'F') ? 'wife' : 'spouse';
				}
				return (gender === 'M') ? 'father' :
						(gender === 'F') ? 'mother' : 'parent';
				
			};

			var addPerson = function (srcInfo, person, gender, relation) {
				var newPerson = {};
				if (gender) {
					newPerson.gender = gender;
				}
				if (relation) {
					newPerson.relation = relation;
				}
				var propsAdded = 0;
				for (var prop in person) {
					if (person.hasOwnProperty(prop)) {
						if (personSkipProps.indexOf(prop) >= 0) {
							continue;
						}
						if (!newPerson[prop]) {
							slUtl.setProp(newPerson, prop, person[prop]);
							++propsAdded;
						}
					}
				}
				if (propsAdded > 0) {
					addPersonToSource(srcInfo, newPerson);
				}
			};

			var setOtherSourceInfo = function (srcInfo) {
				var data = srcInfo.data;
				var source = srcInfo.source;
				var len;
				if (data.event && data.event[0]) {
					var event = data.event[0];
					if (event.place && event.place.normalized &&
						event.place.normalized[0]) {
						var normalized = event.place.normalized[0];
						if (normalized.fieldId === 'EVENT_PLACE' &&
							normalized.parts && normalized.parts[0]) {
							var part = normalized.parts[0];
							if (part.fieldId === 'EVENT_CEMETERY' &&
								part.text) {
								slUtl.setProp(source, 'cemetery', part.text);
							}
						}
					}
				}
				var prop,txt,i;
				if (data.characteristic) {
					len = data.characteristic.length;
					for (i = 0; i < len; i++) {
						var chrstc = data.characteristic[i];
						if (chrstc.type) {
							var type = slTxt.toCamelCase(chrstc.type);
							if (type === 'other') {
								if (chrstc.description) {
									var descr = slTxt.toCamelCase(chrstc.description);
									prop = descrFields[descr];
									if (prop) {
										txt = normzdOrignl(chrstc);
										if (txt) {
											slUtl.setProp(source, prop, txt);
										}
									}
								}
							} else {
								prop = typeFields[type];
								if (prop) {
									txt = normzdOrignl(chrstc);
									if (txt) {
										source[prop] = txt.toLowerCase();
										slUtl.setProp(source, prop, txt);
									}
								}
								prop = personTypeFields[type];
								if (prop) {
									txt = normzdOrignl(chrstc).toLowerCase();
									if (txt) {
										slUtl.setProp(srcInfo.thisPerson, prop, txt);
									}
								}
							}
						}
					}
				}
				var relation;
				var person;
				var gender;
				if (data.child) {
					len = data.child.length;
					for (i = 0; i < len; i++) {
						person = data.child[i];
						gender = setGender(person.gender);
						relation = gender === 'M' ? 'son' :
							(gender === 'F' ? 'daughter' : 'child');
						addPerson(srcInfo, person, gender, relation);
					}
				}
				if (data.parent) {
					len = data.parent.length;
					for (i = 0; i < len; i++) {
						person = data.parent[i];
						gender = setGender(person.gender);
						relation = gender === 'M' ? 'father' :
							(gender === 'F' ? 'mother' : 'parent');
						addPerson(srcInfo, person, gender, relation);
					}
				}
				if (data.spouse) {
					len = data.spouse.length;
					for (i = 0; i < len; i++) {
						person = data.spouse[i];
						gender = setGender(person.gender);
						relation = spouseRelation(gender, srcInfo.source.type);
						addPerson(srcInfo, person, gender, relation);
					}
				}
				if (data.otherRelative) {
					len = data.otherRelative.length;
					for (i = 0; i < len; i++) {
						person = data.otherRelative[i];
						gender = setGender(person.gender);
						relation = getOtherRelation(data.otherRelative[i]);
						addPerson(srcInfo, person, gender, relation);
					}
				}
			};

			//==================================================================================
			//==================================================================================
			// evaluation software to see if any of these source Id's really work
			var srcIdEval = {
				total: 0
			};
			var evaluateSourceIds = function (srcInfo, Id) {
				++srcIdEval.total;
				var title = getSourceTitle(srcInfo.data);
				for (var prop in Id) {
					if (Id.hasOwnProperty(prop)) {
						if (!srcIdEval[prop]) {
							srcIdEval[prop] = new Map();
							srcIdEval[prop].set(Id[prop],[[title, [srcInfo.thisPerson.id]]]);
						} else {
							var thisEval = srcIdEval[prop];
							var foundId = thisEval.get(Id[prop]);
							if (foundId) {
								var len = foundId.length;
								var foundTitle = false;
								for (var i = 0; i < len; i++) {
									if (foundId[i][0] === title) {
										foundTitle = true;
										foundId[i][1].push(srcInfo.thisPerson.id);
										break;
									}
								}
								if (!foundTitle) {
									foundId.push([title, [srcInfo.thisPerson.id]]);
								}
							} else {
								thisEval.set(Id[prop], [[title, [srcInfo.thisPerson.id]]]);
							}
						}
					}
				}
			};

			var evaluateIds = function(total, srcEval, results) {
				var entItr = srcEval.entries();
				results.totUniqSrcs = 0;
				results.total = 0;
				for (;;) {
					var entry = entItr.next().value;
					if (entry) {
						var len = entry[1].length;
						if (len > 1) {
							if (!results.ERROR_SAME_ID) {
								results.ERROR_SAME_ID = 0;
							}
							results.ERROR_SAME_ID += len - 1;
						}
						results.totUniqSrcs += len;
						for (var i = 0; i < len; i++) {
							results.total += entry[1][i][1].length;
						}
					} else {
						break;
					}
				}
				if (results.total < total) {
					results.MISSING = total - results.total;
				}
			};

			slSrc.dumpEval = function () {
				if (srcIdEval.total > 0) {
					var results  = {
						total: srcIdEval.total
					};
					for (var prop in srcIdEval) {
						if (srcIdEval.hasOwnProperty(prop)) {
							if (prop === 'total') {
								continue;
							}
							results[prop] = {};
							evaluateIds(srcIdEval.total, srcIdEval[prop], results[prop]);
						}
					}
					slTxt.pprint('EvaluateIds: ', results);
				}
			};

			var getSourceId = function (srcInfo) {
				var Id = {};
				var rslt;
				var data = srcInfo.data;
				if (data.metadata && data.metadata.externalId && data.metadata.externalId.length > 0) {
					rslt = slTxt.pathEnd(data.metadata.externalId[0].value);
					if (rslt) {
						Id['1data_metadata_externalId_0'] = rslt;
					}
				}
				if (data.identifier) {
					rslt = slTxt.pathEnd(data.identifier.value);
					if (rslt) {
						Id['2data_identifier'] = rslt;
					}
				}
				if (data.metadata && data.metadata.sources &&
					data.metadata.sources.length > 0 &&
					data.metadata.sources[0].indentifier) {
					rslt = slTxt.pathEnd(data.metadata.sources[0].indentifier.value);
					if (rslt) {
						Id['3data_metadata_sources_0_indentifier'] = rslt;
					}
				}
				if (data.isPartOf && data.isPartOf.isPartOf &&
					data.isPartOf.isPartOf.isPartOf) {
					rslt = slTxt.pathEnd(data.isPartOf.isPartOf.isPartOf.identifier.value);
					if (rslt) {
						Id['4data_isPartOf_isPartOf_isPartOf'] = rslt;
					}
				}
				if (data.metadata && data.metadata.isPartOf && data.metadata.isPartOf.isPartOf &&
						data.metadata.isPartOf.isPartOf.isPartOf) {
					rslt = slTxt.pathEnd(data.metadata.isPartOf.isPartOf.isPartOf.identifier.value);
					if (rslt) {
						if (slUtl.isEmpty(Id)) {
							console.log('sourceId from isPartOf for ' + getSourceTitle(srcInfo.data) + '=' + rslt);
						}
						if (rslt.length < 10) {
							rslt += srcInfo.thisPerson.id;
						}
						Id['5data_metadata_isPartOf_isPartOf_isPartOf'] = rslt;
					}
				}
				if (slUtl.isEmpty(Id)) {
					Id['6created'] = 'sourceLink' + (++createdCnt);
				}
				evaluateSourceIds(srcInfo, Id);
				// return the first one...
				for (var prop in Id) {
					if (Id.hasOwnProperty(prop)) {
						return Id[prop];
					}
				}
				return undefined;
			};

			var lastIsPartOfTitle = function(ispof) {
				var title;
				if (ispof.title) {
					title = ispof.title[0].value;
				}
				while (ispof.isPartOf) {
					ispof = ispof.isPartOf;
					if (ispof.title) {
						title = ispof.title[0].value;
					}
				}
				return title;
			};

			var getSourceTitle = function (data) {
				if (data.isPartOf) {
					return lastIsPartOfTitle(data.isPartOf);
				}
				if (data.metadata && data.metadata.isPartOf) {
					return lastIsPartOfTitle(data.metadata.isPartOf);
				}
			};

			// return event_type, event_date, and event_place
			var getEventInfo = function (srcInfo,source) {
				var type, date, place;
				var data = srcInfo.data;
				if (data.event && data.event.length > 0) {
					var event = data.event[0];
					if (!type && event.type) {
						type = event.type;
					}
					if (!date && event.date) {
						date = normzdOrignl(event.date);
					}
					if (!place && event.place) {
						place = normzdOrignl(event.place);
					}
				}
				if (type && date && place) {
					source.type = type;
					source.event = slTxt.event(date, place);
					return;
				}
				if (data.characteristic) {
					var len = data.characteristic.length;
					for (var i = 0; i < len; i++) {
						var chrtc = data.characteristic[i];
						if (chrtc && chrtc.description) {
							if (!type && chrtc.description === 'EVENT_TYPE') {
								type = normzdOrignl(chrtc);
							}
							if (!date && chrtc.description === 'PR_DEA_DATE_EST') {
								date = normzdOrignl(chrtc);
							}
						}
					}
				}
				if (type && date && place) {
					source.type = type;
					source.event = slTxt.event(date, place);
					return;
				}
				var cvrg;
				if ( data.coverage) {
					cvrg = data.coverage[0];
					if (cvrg.recordType) {
						type = cvrg.recordType;
						if (cvrg.temporal) {
							date = cvrg.temporal.end;
						}
						if (cvrg.spatial && cvrg.spatial.length === 1) {
							place = cvrg.spatial[0].place;
						}
					}
				}
				if (data.metadata && data.metadata.coverage) {
					cvrg = data.metadata.coverage[0];
					if (cvrg.recordType) {
						type = cvrg.recordType;
						if (cvrg.temporal) {
							date = cvrg.temporal.end;
						}
						if (cvrg.spatial && cvrg.spatial.length === 1) {
							place = cvrg.spatial[0].place;
						}
					}
				}

				
				if (type) {
					source.type = type;
				}
				if (date || place) {
					source.event = slTxt.event(date, place);
				}
			};


			var getGender = function (data) {
				if (data.gender && data.gender.length > 0) {
					var gender = data.gender[0];
					if (gender.normalized && gender.normalized.length > 0) {
						return setGender(data.gender[0].normalized[0].genderType);
					}
					if (gender.original) {
						return setGender(data.gender[0].original.genderType);
					}
				}
				return undefined;
			};

			

			var addPersonEvents = function(person,data) {
				var scan = data.event;
				if (scan) {
					var i;
					var len = scan.length;
					for (i = 0; i < len; i++) {
						var pevent = scan[i];
						var type = slTxt.toCamelCase(pevent.type);
						var date = normzdOrignl(pevent.date, 'date');
						var place = normzdOrignl(pevent.place, 'place');
						if (date || place) {
							var event = slTxt.event(date, place);
							if (event) {
								slUtl.setProp(person, type, event);
							}
						}
					}
				}
			};

			// convert ['fromName', 'toName']
			var characteristicOther = {
				EVENT_TYPE: 'type',
				EVENT_COUNTRY: 'country',
				EVENT_PLACE_LEVEL_1_TYPE: 'place3type',
				EVENT_PLACE_LEVEL_2_TYPE: 'place2type',
				EVENT_PLACE_LEVEL_3_TYPE: 'place1type',
				LANGUAGE: 'language',
				PR_ETHNICITY_CSS: 'ethnicity',
				PR_PREV_RESIDENCE_CITY: 'prevCity',
				PR_PREV_RESIDENCE_CITY_ORIG: 'prevCity',
				PR_RACE_OR_COLOR_CSS: 'race',
				PR_RELATIONSHIP_TO_HEAD_CSS: 'relation',
				RELATIONSHIP_CODE: 'relation',
				STATE_OF_ISSUANCE: 'state'
			};


			var fieldId = ['PR_FTHR_', 'PR_MTHR', 'GR_FTHR', 'GR_MTHR', 'SPOUSE'];
			var relation = ['father', 'mother', 'father', 'mother', 'spouse'];

			var relationFromFieldId = function (fid) {
				var len = fieldId.length;
				for (var i = 0; i < len; i++) {
					if (fid.indexOf(fieldId) === 0) {
						return relation[i];
					}
				}
				return undefined;
			};

			var getNameRelation = function (data) {
				var obj = {};
				var nameParts;
				var nameRelation;
				if (data.name && data.name.length > 0) {
					var name = data.name[0];
					if (name.normalized && name.normalized.length > 0) {
						if (name.normalized[0].fieldId) {
							nameRelation = relationFromFieldId(name.normalized[0].fieldId);
						}
						nameParts = name.normalized[0].parts;
					} else if (name.original) {
						if (name.original.fieldId) {
							nameRelation = relationFromFieldId(name.original.fieldId);
						}
						nameParts = name.original.parts;
					}
				}
				if (nameParts) {
					var givenName;
					var surName;
					var len = nameParts.length;
					for (var i = 0; i < len; i++) {
						if (nameParts[i].type === 'GIVEN' && nameParts[i].fieldId !== 'PR_NAME_TITLES') {
							if (givenName) {
								givenName += ' ' + nameParts[i].text;
							} else {
								givenName = nameParts[i].text;
							}

						} else if (nameParts[i].type === 'SURNAME') {
							surName = nameParts[i].text;
						}
					}
					obj['name'] = [givenName, surName];
				}
				if (nameRelation) {
					slUtl.setProp(obj, 'relation', nameRelation.toLowerCase());
				}
				return obj;
			};

			var getName = function (person, data) {
				var nr = getNameRelation(data);
				if (nr.name) {
					person['name'] = nr.name;
				}
				if (nr.relation) {
					slUtl.setProp(person, 'relation', nr.relation);
				}
			};

			var getOtherType = function (chrstc) {
				var found = characteristicOther[chrstc.description];
				return found;
			};

			var addPersonFields = function (person, data) {
				getName(person, data);
				addPersonEvents(person,data);
			
				var scan = data.characteristic;
				if (scan) {
					var len = scan.length;
					var i;
					for (i = 0; i < len; i++) {
						var chartic = scan[i];
						var type = slTxt.toCamelCase(chartic.type);
						if (type === 'other') {
							type = getOtherType(chartic);
							if (!type) {
								continue;
							}
						}
						var prop = personTypeFields[type];
						if (prop) {
							var txt = normzdOrignl(chartic).toLowerCase();
							if (txt) {
								slUtl.setProp(person, prop, txt);
							}
						}
					}
				}
			};

			var findPerson = function (people, person) {
				var len = people.length;
				for (var i = 0; i < len; i++) {
					if (samePerson(people[i], person)) {
						return i;
					}
				}
				return -1;
			};

			var addPersonData = function (person, data) {
				addPersonFields(person, data);
				var gender = getGender(data);
				if (gender) {
					person.gender = gender;
				}
			};

			var addMorePersonInfo = function (person) {
				if (!person.added && person.url) {
					busy();
					http.get(person.url).then(function (response) {
						var data = response.data;
						addPersonData(person, data);
						notBusy();
					});
					delete person.url;
					person.added = true;
				}
			};


			var addPersonToSource = function (srcInfo, thisPerson) {
				var source = srcInfo.source;
				var person;
				var fidx = findPerson(source.people, thisPerson);
				var addAttPerson = thisPerson.id ? true : false;
				if (fidx >= 0) {
					person = source.people[fidx];
					if (person.id) {
						addAttPerson = false;
					}
					slUtl.merge(person, thisPerson);
				} else {
					source.people.push(thisPerson);
					person = thisPerson;
				}
				if (addAttPerson) {
					if (!source.attPeople) {
						source.attPeople = new Map();
					}
					source.attPeople.set(person.id, person);
				} else {
					addMorePersonInfo(person);
				}
			};

			var addPersonDataToSource = function (srcInfo, data) {
				var thisPerson = srcInfo.thisPerson;
				addPersonData(thisPerson,data);
				if (debugLog) {
					var name = thisPerson.name ? (thisPerson.name[0] + ' ' + thisPerson.name[1]) : 'undefined name';
					console.log('addPersonDataToSource: ' + srcInfo.source.id + ' ' + name);
				}
				addPersonToSource(srcInfo, thisPerson);
			};


			var loadEvents = function (srcInfo) {
				var data = srcInfo.data;
				if (data.event) {
					var len = data.event.length;
					for (var i = 0; i < len; i++) {
						var eventFS = data.event[i];
						var type = eventFS.type;
						var date = normzdOrignl(eventFS.date, 'date');
						var place = normzdOrignl(eventFS.place, 'place');
						if (date || place) {
							srcInfo[type] = slTxt.event(date, place);
						}
					}
				}
			};

			var createSource = function(srcInfo,sourceId) {
				var title = getSourceTitle(srcInfo.data);
//				if (/*srcInfo.thisPerson.id === 'LF16-TYS' &&*/ title.indexOf('Census') >= 0 &&
//					title.indexOf('1940') >= 0) {
//					slTxt.pprint(title, srcInfo);
//				}
				if (title) {
					var source = {
						title: title,
						id: sourceId,
						people: []
					};
					getEventInfo(srcInfo, source);
					srcInfo.source = source;
					loadEvents(srcInfo);
					if (!source.type) {
						source.type = slSel.extractType(title);
						if (!source.type) {
							slTxt.pprint('source.type is undefined', srcInfo);
						}
					}
					add(source);
				} else {
					slTxt.pprint('No Title', srcInfo);
				}
			};

			// Create or load  a source attached to the person.
			// whose record ID is srcInfo.thisPerson.id.
			var loadSource = function (srcInfo) {
				var data = srcInfo.data;
				var sourceId = getSourceId(srcInfo);
//				if (sourceId === '1042456105') {
//					slTxt.pprint(srcInfo.description.about + ' 1042456105 ' + srcInfo.thisPerson.id, srcInfo.data);
//				}
				if (sourceId) {
					var source = slSrc.getSource(sourceId);
					if (!source) {
						createSource(srcInfo, sourceId);
						if (!srcInfo.source) {
							alert('###ERROR: failed to create source');
							return;
						}
					} else {
						srcInfo.source = source;
					}
					if (debugLog) {
						console.log(sourceId + ' ' + srcInfo.source.type + ': ' + srcInfo.source.title);
					}
					addPersonDataToSource(srcInfo, data);
					setOtherSourceInfo(srcInfo);
					addSourceToPerson(srcInfo.thisPerson.id, sourceId);
				} else {
					alert('###ERROR: sourceId undefined');
				}
			};


			// To see if and how these are changing....
			var srcInfos = [];

			var extractPersonId = function (txt) {
				var pid = slTxt.pathEnd(txt);
				pid = /[A-Z0-9]*-[A-Z0-9]*/.exec(pid);
				if (pid && pid.length === 1 && pid[0].length >= 8) {
					return pid[0];
				}
				return undefined;
			};


			var addSource = function (srcInfo, draw) {
				srcInfos.push(srcInfo);
				var fileUrl = srcInfo.description.about;
			//	slTxt.pprint(fileUrl, srcInfo.description);
				var srcPersonId = extractPersonId(fileUrl);
				if (!srcPersonId) {
					// Appears this source person is not directly tied to the active person 
					console.log(srcInfo.thisPerson.id + ' is not tied to source');
					return false;
				}
				var personId = srcInfo.thisPerson.id;
				if (debugLog) {
					console.log('===========================================================================');
					console.log('addSource: personId=' + personId + ' srcPersonId=' + srcPersonId);
				}
				busy();
				http.get(fileUrl).then(function (response) {
					if (response.data && response.status === 200) {
			//			slTxt.pprint(fileUrl, response);
						srcInfo.data = response.data;
						loadSource(srcInfo);
					} else {
						alert('File ' + fileUrl + ' load status = ' + response.status);
					}
					var retCnt = incrsourcesReturnedPerPerson(personId);
					if (retCnt === sourcesRequestedPerPerson.get(personId)) {
						sortSourcesPeople();
						var srcs = personSources.get(personId);
						installSourcesCB(personId, srcs, draw);
					}
					notBusy();
				});
				return true;
			};

			slSrc.spouseFamilySources = function (person, FSResponse) {
				var descriptions = FSResponse.getSourceDescriptions();
				if (descriptions.length > 0) {
					slTxt.pprint(person.id + ' spouseFamilySources', descriptions);
				}
			};

			slSrc.spouseCoupleSources = function (person, FSResponse) {
				var descriptions = FSResponse.getSourceDescriptions();
				if (descriptions.length > 0) {
					slTxt.pprint(person.id + ' spouseCoupleSources', descriptions);
				}
			};

			slSrc.parentFamilySources = function (person, FSResponse) {
				var descriptions = FSResponse.getSourceDescriptions();
				if (descriptions.length > 0) {
					slTxt.pprint(person.id + ' parentFamilySources', descriptions);
				}
			};

			slSrc.parentCoupleSources = function (person, FSResponse) {
				var descriptions = FSResponse.getSourceDescriptions();
				if (descriptions.length > 0) {
					slTxt.pprint(person.id + ' parentCoupleSources', descriptions);
				}
			};



			// Store source responce FSResponce from FamilySearch
			// for person
			slSrc.personSources = function (person,FSResponse,draw) {
				var numSources = 0;
				var sourceRefs = FSResponse.getSourceRefs();
				var i, len;
				len = sourceRefs.length;
				for (i = 0; i < len; i++) {
					var sourceRef = sourceRefs[i];
					var description = FSResponse.getSourceDescription(sourceRef.$sourceDescriptionId);
					var srcInfo = slSrc.info(person.id, description, sourceRef);
					if (description.about) {
						var idx = description.about.indexOf('familysearch.org');
						if (idx >= 0 && idx <= 20) {
							if (addSource(srcInfo,draw)) {
								++numSources;
								continue;
							}
						}
					}
					slSrcX.extract(person, srcInfo);
				}
				if (!sourcesRequestedPerPerson) {
					sourcesRequestedPerPerson = new Map();
				}
				
				if (numSources === 0) {
					installSourcesCB(person.id,[],draw);
				} else {	
					sourcesRequestedPerPerson.set(person.id, numSources);
				}
			};



			slSrc.info = function(persId, description, sourceRef) {
				
				//construct srcInfo data structure
				return {
					seqNum: ++sequenceNumber,
					thisPerson: {				// person source is attached to
						id: persId
					},
					sourceRef: sourceRef,
					description: description,
					data: undefined,
					source: undefined,
					numPeople: 0,
					peopleData: []
				};
			};

			slSrc.title = function (source, length) {
				if (length > 1) {
					return length.toString() + ' ' + slTxt.groupType(source.type) + ' Records';
				}
				return slTxt.stripTitle(source.title);
			};

			slSrc.getSource = function(sourceId) {
				return sourceId ? sources.get(sourceId) : undefined;
			};

			slSrc.select = function (person, which) {
				var srcGrp = person.sources[which];
				slTbl.sourceGrp(person, srcGrp, slSrc);
			};

			slSrc.init = function (installSources, callbacks) {
				installSourcesCB = installSources;
				busy = callbacks.busy;
				notBusy = callbacks.notBusy;
				if (sourcesRequestedPerPerson) {
					sourcesRequestedPerPerson.clear();
					sourcesRequestedPerPerson = undefined;
				}
				totalSources = undefined;
				sourcesComplete = 0;
				allSourcesReturned = false;
//				slSrcX.init();
			};


			slSrc.analyze = function (actPerson, refPerson, selectInfo, addAttSel) {
				if (!selectInfo.itemName) {
					selectInfo.itemName = selectInfo.compare;
				}
				var count = {
					exact: [0],
					near: [0],
					no: [0]
				};
				if (actPerson.sources) {
					var len = actPerson.sources.length;
					for (var i = 0; i < len; i++) {
						var grp = actPerson.sources[i];
						var glen = grp.length;
						for (var j = 0; j < glen; j++) {
							var sourceId = grp[j];
							var source = slSrc.getSource(sourceId);
							if (source) {
								var rslt;
								var srcVal = source[selectInfo.compare.prop];
								if (srcVal) {
									rslt = selectInfo.compare.compareFunc(selectInfo.compare.event, srcVal);
									if (rslt) {
										++count[rslt[0]][0];
										addAttSel(i, rslt[1], rslt[0]);
									}
								}
								if (!rslt && source.attPeople) {
									var srcPerson = source.attPeople.get(refPerson.id);
									if (srcPerson) {
										var srcPersVal = srcPerson[selectInfo.compare.prop];
										rslt = selectInfo.compare.compareFunc(selectInfo.compare.event, srcPersVal);
										if (rslt) {
											++count[rslt[0]][0];
											addAttSel(i, rslt[1], rslt[0]);
										}
									}
								} 
							}
						}
					}
				}
				
				var exCnt = count.exact[0];
				var nrCnt = count.near[0];
				var noCnt = count.no[0];
				var msg = 'There ';
				if (exCnt === 1) {
					msg += 'is ' + exCnt + ' confirmation';
				} else {
					msg += 'are ' + exCnt + ' <strong style="background-color:' + slCSS.matchBoxColors.exact + ';">confirmations</strong>';
				}
				if (nrCnt > 0) {
					if (noCnt === 0) {
						msg += ', and ';
					} else {
						msg += ', ';
					}
					msg += nrCnt + ' partial confirmation';
					if (nrCnt > 1) {
						msg += 's';
					}
				}
				if (noCnt > 0) {
					msg += ', and ' + noCnt + ' <strong style="background-color:' + slCSS.matchBoxColors.no + ';">contradiction';
					if (noCnt > 1) {
						msg += 's';
					}
				}
				msg += ' for the ' + selectInfo.itemName;
				if (selectInfo.place) {
					msg += ' <strong>' + selectInfo.place + '</strong>';
				}
				msg += ' <strong>"' + selectInfo.compare.target + '"</strong>';
				msg += ' of ';
				if (selectInfo.relation) {
					msg += 'the ' + selectInfo.relation + ' of ';
				}
				msg += actPerson.name[0] + ' ' +
					actPerson.name[1];
				slTxt.pushMsg(msg);
				return exCnt + nrCnt + noCnt;
			};

			return slSrc;
		}]);
})();