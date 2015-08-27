(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	

	// Interface to a person's source Information
	slApp.factory('slSrc', [ '$http', 'slSel', 'slSrcX', 'slTxt', 'slCSS', 'slUtl', 'alert',
		function (http, slSel, slSrcX, slTxt, slCSS, slUtl, alert) {
			
			var slSrc = {};
			var sources = new Map();	// map of sources by source.id
			var sequenceNumber = 0;
			var createdCnt = 0;

			var totalSources;
			var sourcesComplete = 0;
			var installSourcesCB;
			var drawAttPhraseCB;
			var debugLog = false;

			// sourcesRequestedPerPerson stores a count of every source requested per each person
			// processed.  This value is only set after all load requests have been performed. 
			var sourcesRequestedPerPerson;	// Map: key is personId; value = sources count;				
			var sourcesReturnedPerPerson = new Map();  // key is personId; value = [count]
			var allSourcesReturned = false;
			

			slSrc.get = function(srcId) {
				return sources.get(srcId);
			};

			var doNotGroup = ['CENSUS'];

			var sameGroupType = function (src1, src2) {
				if (src1.type === src2.type) {
					if (doNotGroup.indexOf(src1.type) < 0) {
						return true;
					}
					return false;
				}
				if ((src1.type === 'DEATH' || src1.type === 'BURIAL') &&
					(src2.type === 'DEATH' || src2.type === 'BURIAL')) {
					return true;
				}
				return false;
			};

			var sameRelationType = function (src1, src2) {
				if (src1.relation && src2.relation) {
					if (src1.relation !== src2.relation) {
						return false;
					}
				}
				var notSame = false;
				src1.people.forEach( function(person1,key) {
					var person2 = src2.people.get(key);
					if (person2 && person2.relationshipToHead !== person1.relationshipToHead) {
						notSame = true;
					}
				});
				return !notSame;
			};

			var placeInSameGroup = function(src1,src2) {
				return (sameGroupType(src1,src2) && sameRelationType(src1,src2));
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

			var typeFields = {
				AGE: 'age',
				RELATIONSHIP_TO_HEAD: 'relation',
				LANGUAGE: 'language'
			};

			var descrFields = {
				SOURCE_NEWSPAPER: 'newspaper'
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
								source['cemetery'] = part.text;
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
							if (chrstc.type === 'OTHER') {
								if (chrstc.description) {
									prop = descrFields[chrstc.description];
									if (prop) {
										txt = normzdOrignl(chrstc);
										if (txt) {
											source[prop] = txt;
										}
									}
								}
							} else {
								prop = typeFields[chrstc.type];
								if (prop) {
									txt = normzdOrignl(chrstc);
									if (txt) {
										source[prop] = txt;
									}
								}
							}
						}
					}
				}
			};

			var getSourceId = function (srcInfo) {
				var Id = {};
				var rslt;
				var data = srcInfo.data;
				if (data.metadata && data.metadata.externalId && data.metadata.externalId.length > 0) {
					rslt = slTxt.pathEnd(data.metadata.externalId[0].value);
					if (rslt) {
						Id['externalId'] = rslt;
					}
				}
				if (data.identifier) {
					rslt = slTxt.pathEnd(data.identifier.value);
					if (rslt) {
						Id['identifier'] = rslt;
					}
				} else if (data.metadata && data.metadata.sources &&
								data.metadata.sources.length > 0 &&
								data.metadata.sources[0].indentifier) {
					rslt = slTxt.pathEnd(data.metadata.sources[0].indentifier.value);
					if (rslt) {
						Id['identifier'] = rslt;
					}
				}
				if (data.isPartOf && data.isPartOf.isPartOf &&
					data.isPartOf.isPartOf.isPartOf) {
					rslt = slTxt.pathEnd(data.isPartOf.isPartOf.isPartOf.identifier.value);
					if (rslt) {
						Id['isPartOf'] = rslt;
					}
				} else if (data.metadata && data.metadata.isPartOf && data.metadata.isPartOf.isPartOf &&
						data.metadata.isPartOf.isPartOf.isPartOf) {
					rslt = slTxt.pathEnd(data.metadata.isPartOf.isPartOf.isPartOf.identifier.value);
					if (rslt) {
						Id['isPartOf'] = rslt;
					}
				}
				if (slUtl.isEmpty(Id)) {
					Id['created'] = 'sourceLink' + (++createdCnt);
				}
				
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

			var setGender = function (gender) {
				var rslt = gender.charAt(0);
				if (rslt === 'u' || rslt === 'U') {
					return undefined;
				}
				return rslt;
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
								person[type] = event;
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


			var fieldId = ['PR_FTHR_', ];
			var relation = ['Father'];

			var relationFromFieldId = function (fid) {
				var len = fieldId.length;
				for (var i = 0; i < len; i++) {
					if (fid.indexOf(fieldId) === 0) {
						return relation[i];
					}
				}
				return undefined;
			};

			var getName = function (person, data) {
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
					person['name'] = [givenName, surName];
				}
				if (nameRelation) {
					person['relation'] = nameRelation;
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
						var text = normzdOrignl(chartic);
						if (text) {
							person[type] = text;
						}
					}
				}
			};

			var addPersonToSource = function (srcInfo, data) {
				var person = {
					pid: srcInfo.persId		// personId of famTree
				};
				addPersonFields(person,data);
				var gender = getGender(data);
				if (gender) {
					person.gender = gender;
				}
				if (debugLog) {
					var name = person.name ? (person.name[0] + ' ' + person.name[1]) : 'undefined name';
					console.log('addPersonToSource: ' + name);
				}
				var source = srcInfo.source;
				if (!source.people) {
					source.people = new Map();
				}
				source.people.set(person.pid,person);
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
				if (title) {
					var source = {
						title: title,
						id: sourceId,
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
			// whose record ID is srcInfo.persId.
			var loadSource = function (srcInfo) {
				var data = srcInfo.data;
				var sourceId = getSourceId(srcInfo);
				if (sourceId) {
					var source = slSrc.getSource(sourceId);
					if (!source) {
						if (debugLog) {
							console.log('createSource: ' + sourceId);
						}
						createSource(srcInfo,sourceId);
						if (!srcInfo.source) {
							alert('###ERROR: failed to create source');
							return;
						}
						setOtherSourceInfo(srcInfo);
					} else {
						srcInfo.source = source;
					}
					if (debugLog) {
						console.log(srcInfo.source.type + ': ' + srcInfo.source.title);
					}
					addPersonToSource(srcInfo, data);
					addSourceToPerson(srcInfo.persId, sourceId);
				} else {
					alert('###ERROR: sourceId undefined');
				}
			};


			// To see if and how these are changing....
			var srcInfos = [];

			var extractPersonId = function (txt) {
				var pid = slTxt.pathEnd(txt);
				var loc = pid.indexOf('-');
				if (loc !== 4) {
					return undefined;
				}
				return pid.slice(0, 8);

			};

			var addSource = function (srcInfo, draw) {
				srcInfos.push(srcInfo);
				var fileUrl = srcInfo.description.about;
				var srcPersonId = extractPersonId(fileUrl);
				if (!srcPersonId) {
					// Appears this source person is not directly tied to the active person 
					return false;
				}
				var personId = srcInfo.persId;
				if (debugLog) {
					console.log('===========================================================================');
					console.log('addSource: personId=' + personId + ' srcPersonId=' + srcPersonId);
				}
				http.get(fileUrl).success(function (data, status) {
					if (data && status === 200) {
						srcInfo.data = data;
						loadSource(srcInfo);
					} else {
						alert('File ' + fileUrl + ' load status = ' + status);
					}
					var retCnt = incrsourcesReturnedPerPerson(personId);
					if (retCnt === sourcesRequestedPerPerson.get(personId)) {
						installSourcesCB(personId, personSources.get(personId), draw);
					}
				});
				return true;
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
					var srcInfo = slSrc.info(person.id, sourceRef, description);
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


			slSrc.info = function(persId, sourceRef, description) {
				
				//construct srcInfo data structure
				return {
					seqNum: ++sequenceNumber,
					persId: persId,				// personId of person source is attached to
					sourceRef: sourceRef,
					description: description,
					data: undefined,
					source: undefined,
					numPeople: 0,
					peopleData: []
				};
			};

			slSrc.getSource = function(sourceId) {
				return sourceId ? sources.get(sourceId) : undefined;
			};

			slSrc.select = function (person, which) {
				var srcGrp = person.sources[which];
				var len = srcGrp.length;
				for (var i = 0; i < len; i++) {
					var source = slSrc.get(srcGrp[i]);
					slTxt.pprint(source.title,source);
				}
			};

			slSrc.init = function (installSources, drawAttPhr) {
				installSourcesCB = installSources;
				drawAttPhraseCB = drawAttPhr;
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
								if (!rslt && source.people) {
									var srcPerson = source.people.get(refPerson.id);
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
				document.getElementById('navbar-msg').innerHTML = msg;
				return exCnt + nrCnt + noCnt;
			};

			return slSrc;
		}]);
})();