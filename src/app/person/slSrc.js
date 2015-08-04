(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	

	// Interface to a person's source Information
	slApp.factory('slSrc', [ '$http', 'slSel', 'slTxt', 'alert',
		function (http, slSel, slTxt, alert) {
			
			var slSrc = {};
			var sources = new Map();	// map of sources by source.id
			var loadedSourcePerson = [];
			var loadedSourcesSorted = true;
			var sequenceNumber = 0;
			

			var totalSources;
			var sourcesComplete = 0;
			var drawSourcesCB;
			var drawAttPhraseCB;

			// sourcesLoadedPerPerson stores a count of every source loaded per each person
			// processed.  This value is only set after all load requests have been performed. 
			var sourcesLoadedPerPerson;					
			var sourcesReturnedPerPerson = new Map();  // key is personId value = [count]
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

			var placeInSameGroup = function(src1,src2) {
				return (sameGroupType(src1,src2) &&
					src1.eventPersonId && src2.eventPersonId &&
					src1.eventPersonId === src2.eventPersonId);
			};

			// return:	-1 if src1 is to be placed after src2;
			//			0 if src1 should be in same group as src2
			//			1 if src1 is to be placed before src2
			var sourceSlot = function (src1, src2) {
				if (placeInSameGroup(src1,src2)) {
					return 0;
				}
				var dateDiff =slTxt.compareDate(src1.event.date, src2.event.date);
				if (dateDiff === 0) {
					return src1.id - src2.id;
				}
				return dateDiff;
			};

			// person sources are ordered chronologically
			// person.sources is an array of an array of sourceRefs which store
			// duplicate groups such as birth, marriage, and death/burial
			slSrc.addPersonSource = function (person, sourceRef) {
				if (!person.sources) {
					person.sources = [];
				}
				var source = slSrc.get(sourceRef[0]);
				if (source.event) {
					var sources = person.sources;
					var len = sources.length;
					var loc;
					for (loc = 0; loc < len; loc++) {
						var nextSource = slSrc.get(sources[loc][0][0]);
						var fit = sourceSlot(source, nextSource);
						if (fit === 0) {
							// place in same group
							sources[loc].push(sourceRef);
							return;
						} else if (fit < 0) {
							break;
						}
					}
					sources.splice(loc, 0, [sourceRef]);
				}
			};

			var incrsourcesReturnedPerPerson = function (persId) {
				var retCnt = sourcesReturnedPerPerson.get(persId);
				if (retCnt) {
					++retCnt[0];
				} else {
					sourcesReturnedPerPerson.set(persId, [1]);
				}
			};

			// for debug:
			var printSourcesLoadedInfo = function () {
				if (sourcesLoadedPerPerson) {
					var sppIter = sourcesLoadedPerPerson.entries();
					for (; ;) {
						var sppVal = sppIter.next();
						if (sppVal.done) {
							break;
						}
						var key = sppVal.value[0];
						var value = sppVal.value[1];
						var retValue = sourcesReturnedPerPerson.get(key);
						console.log(key + ' ' + (retValue ? retValue[0] : '0') + ' of ' + value);
					}
				}
			};

			// sets allSourcesReturned to true if all have been returned
			// otherwise sets allSourcesReturned to false
			var checkAllSourcesReturned = function () {
				if (sourcesLoadedPerPerson) {
					var result = true;
					var sppIter = sourcesLoadedPerPerson.entries();
					for (; ;) {
						var sppVal = sppIter.next();
						if (sppVal.done) {
							break;
						}
						var key = sppVal.value[0];
						var value = sppVal.value[1];
						var retValue = sourcesReturnedPerPerson.get(key);
						if (!retValue || retValue[0] < value) {
							console.log(key + ' ' + value + ':' + (retValue ? retValue[0] : '0'));
							result = false;
							break;
						}
						if (retValue && retValue[0] > value) {
							console.log('###ERROR: ' + key + ' sourcesReturnedPerPerson(' + retValue[0] +
								') > sourcesLoadedPerPerson(' + value + ')');
						}
					}
					allSourcesReturned = result;
				} else {
					allSourcesReturned = false;
				}
			};

			var checkSourcesComplete = function () {
				if (sourcesLoadedPerPerson && sourcesComplete >= totalSources) {
//					if (!allSourcesReturned) {
						checkAllSourcesReturned();
						if (!allSourcesReturned) {
							return;
						}
//					}
					console.log('drawSourceCB:  sourcesComplete = ' + sourcesComplete);
					printSourcesLoadedInfo();
					drawSourcesCB();
				}
			};


			var sourceComplete = function (srcCnt) {
				if (srcCnt) {
					sourcesComplete += srcCnt;
				} else {
					++sourcesComplete;
				}
				var msg = sourcesComplete.toString() + ' Sources Complete';
				if (totalSources) {
					msg += ' of ' + totalSources;
				}
				drawAttPhraseCB(msg);
				if (sourcesComplete % 10 === 0) {
					printSourcesLoadedInfo();
				}
				checkSourcesComplete();
			};

			var add = function (source) {
				sources.set(source.id, source);
			};

			var binarySearch = function (a, value) {
				var lo = 0;
				var hi = a.length - 1;
				var mid;
				while (lo <= hi) {
					mid = Math.floor((lo + hi) / 2);
					if (a[mid] > value) {
						hi = mid - 1;
					} else if (a[mid] < value) {
						lo = mid + 1;
					} else {
						return mid;
					}
				}
				return -1;
			};

			var sourcePersonLoaded = function (srcPersonId) {
				if (!loadedSourcesSorted) {
					loadedSourcePerson.sort();
					loadedSourcesSorted = true;
				}
				var found = binarySearch(loadedSourcePerson,srcPersonId);
				return (found >= 0);
			};

			var addLoadedPerson = function (srcPersonId) {
				loadedSourcePerson.push(srcPersonId);
				loadedSourcesSorted = false;
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
					/*
										if (build[parts[i].type]) {
											if (build[parts[i].type].indexOf(parts[i].text) === -1) {
												build[parts[i].type] += ' ' + parts[i].text;
											}
										} else {
					*/
					build[parts[i].type] = parts[i].text;
					//					}
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

			var typeFields = [
				'AGE', 'RELATIONSHIP_TO_HEAD', 
			];

			var descrFields = [
				'SOURCE_NEWSPAPER',
			];

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
				var idx,txt,i;
				if (data.characteristic) {
					len = data.characteristic.length;
					for (i = 0; i < len; i++) {
						var chrstc = data.characteristic[i];
						if (chrstc.type) {
							if (chrstc.type === 'OTHER') {
								if (chrstc.description) {
									idx = descrFields.indexOf(chrstc.description);
									if (idx >= 0) {
										txt = normzdOrignl(chrstc);
										if (txt) {
											source[chrstc.description.toLowerCase] = txt;
										}
									}
								}
							} else {
								idx = typeFields.indexOf(chrstc.type);
								if (idx >= 0) {
									txt = normzdOrignl(chrstc);
									if (txt) {
										source[chrstc.type.toLowerCase] = txt;
									}
								}
							}
						}
					}
				}
			};

			
			var getSourceId = function (data) {
				if (data.metadata) {
					if (data.metadata.externalId && data.metadata.externalId.length > 0) {
						return slTxt.pathEnd(data.metadata.externalId[0].value);
					}
					if (data.metadata.sources && data.metadata.sources.length > 0) {
						return slTxt.pathEnd(data.metadata.sources[0].indentifier.value);
					}
					if (data.metadata.isPartOf && data.metadata.isPartOf.isPartOf &&
						data.metadata.isPartOf.isPartOf.isPartOf) {
						return slTxt.pathEnd(data.metadata.isPartOf.isPartOf.isPartOf.identifier.value);
					}
				}
				return undefined;
			};

			var getSourceTitle = function (data) {
				return data.metadata.isPartOf.isPartOf.title[0].value;
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
				if (data.metadata.coverage) {
					var cvrg = data.metadata.coverage[0];
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
						return data.gender[0].normalized[0].genderType;
					}
					if (gender.original) {
						return data.gender[0].original.genderType;
					}
				}
				return undefined;
			};

			var getName = function (data) {
				var nameParts;
				if (data.name && data.name.length > 0) {
					var name = data.name[0];
					if (name.normalized && name.normalized.length > 0) {
						nameParts = name.normalized[0].parts;
					} else if (name.original) {
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
					return [givenName, surName];
				}
				return undefined;
			};

			
			var checkSourceDone = function (srcInfo) {
				var source = srcInfo.source;
				if (source.people.length === srcInfo.numPeople) {
					if (!source.eventPersonId) {
						source.eventPersonId = srcInfo.persId;
					}
//					var title = srcInfo.source.title + ': ';
//					if (title.indexOf('Idaho, Southern Counties Obituaries') >= 0) {
//						slTxt.pprint(title + ' seqNum', srcInfo.seqNum);
//						slTxt.pprint(title + ' persId', srcInfo.persId);
//						slTxt.pprint(title + ' sourceRef', srcInfo.sourceRef);
//						slTxt.pprint(title + ' description', srcInfo.description);
//						slTxt.pprint(title + ' data', srcInfo.data);
//						slTxt.pprint(title + ' peopleData', srcInfo.peopleData);
//						slTxt.pprint(title + ' source', srcInfo.source);
					//					}
					console.log(srcInfo.persId + ' ' + srcInfo.source.title  + ' ' + srcInfo.source.id + ' ' + srcInfo.numPeople + '  complete');
					sourceComplete();
				}
			};

/*
			var mergeDuplicateSources = function(srcInfo,foundSource) {
				// move all people from this srcInfo to foundSource and clear
				// this source
				var source = srcInfo.source;
				for (var i = 0, len = source.people.length; i < len; ++i) {
					foundSource.people.push(source.people[i]);
				}
				delete srcInfo.source;
				decrTotalSources();
				console.log('merge sources for ' + foundSource.id + ' ' + foundSource.title);
				checkSourceDone(srcInfo, foundSource);
			};
*/

			var addPersonEvents = function(person,data) {
				var scan = data.event;
				if (scan) {
					var i;
					var len = scan.length;
					for (i = 0; i < len; i++) {
						var pevent = scan[i];
						var type = pevent.type.toLowerCase();
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
			var characteristicOther = [
				'STATE_OF_ISSUANCE',
				'LANGUAGE'
			];

			var characteristicType = [
				'state',
				'language'
			];

			var getCharacteristicType = function(chartic) {
				var found = characteristicOther.indexOf(chartic.description);
				if (found >= 0) {
					return characteristicType[found];
				}
				return undefined;
			};

			var addPersonCharacteristics = function(person,data) {
				var scan = data.characteristic;
				if (scan) {
					var len = scan.length;
					var i;
					for (i = 0; i < len; i++) {
						var chartic = scan[i];
						var type = chartic.type.toLowerCase();
						if (type === 'other') {
							type = getCharacteristicType(chartic);
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


			var addSourcePerson = function (srcInfo, srcPersonId, data, relation, personId) {
				var person = {
					name: getName(data),
					id: srcPersonId,		// personId of source
					pid: personId,			// personId of famTree
					relation: relation
				};
				
				addPersonEvents(person,data);
				addPersonCharacteristics(person,data);
				var gender = getGender(data);
				if (gender) {
					person.gender = gender;
				}
				var name = person.name ? (person.name[0] + ' ' + person.name[1]) : 'undefined name';
				console.log('addSourcePerson: ' + name);
				var source = srcInfo.source;
				source.people.push(person);
				checkSourceDone(srcInfo);
			};

			var loadSourcePerson = function (srcInfo,personUrl,relation) {
				var personId = slTxt.pathEnd(personUrl);
				console.log('loadSourcePerson: ' + personId);
				http.get(personUrl).success(function (pdata, status/*, headers, config*/) {
					if (srcInfo.source) {
						if (pdata && status === 200) {
							console.log('===========================================================================');
							console.log('RETURN loadSourcePerson: ' + personId);
							srcInfo.peopleData.push(pdata);
							addSourcePerson(srcInfo,personId,pdata,relation);
						} else {
							alert('###ERROR: File ' + personUrl + ' load status = ' + status);
						}
					}
				});
			};

			var numPeople = function(data) {
				return 1 + data.parent.length + data.child.length + 
					data.spouse.length + data.otherRelative.length;
			};

			var loadSourcePeople = function (srcInfo,srcPersonId) {
				var data = srcInfo.data;
				srcInfo.numPeople += numPeople(data);
				srcInfo.pushSourceId(srcInfo.persId, srcInfo.source.id, srcPersonId);
				addSourcePerson(srcInfo,srcPersonId, data, 'self', srcInfo.persId);
				if (!srcInfo.source) {
					return;
				}
				var i,len;
				for (i = 0,len = data.parent.length; i < len; i++) {
					loadSourcePerson(srcInfo,data.parent[i].url,'parent');
					if (!srcInfo.source) {
						return;
					}
				}
				for (i = 0, len = data.child.length; i < len; i++) {
					loadSourcePerson(srcInfo,data.child[i].url,'child');
					if (!srcInfo.source) {
						return;
					}
				}
				for (i = 0, len = data.spouse.length; i < len; i++) {
					loadSourcePerson(srcInfo,data.spouse[i].url,'spouse');
					if (!srcInfo.source) {
						return;
					}
				}
				for (i = 0, len = data.otherRelative.length; i < len; i++) {
					loadSourcePerson(srcInfo,data.otherRelative[i].url,'other');
					if (!srcInfo.source) {
						return;
					}
				}
			};

/*			
			var getEvent = function (eventFS) {
				var date = normzdOrignl(eventFS.date, 'date');
				var place = normzdOrignl(eventFS.place, 'place');
				if (date || place) {
					return slTxt.event(date, place);
				}
				return undefined;
			};


			var eventAndType = function(event) {
				return {
					type: event.type,
					event: getEvent(event)
				};
			};


			var loadEvent = function(eventFS){
				var event = {};
				var type = eventFS.type;
				var date = normzdOrignl(eventFS.date,'date');
				var place = normzdOrignl(eventFS.place,'place');
				if (date || place) {
					return slTxt.event(date,place);
				}
				return undefined;
			};


			// return the most recent event and type
			var eventType = function (data) {
				var mostRecentEvent;
				var events = [];
				var len = data.event.length;
				for (var i = 0; i < len; i++) {
					var eventFS = data.event[i];
					var event = loadEvent(eventFS);
					if (event) {
						events.push(event);
					}
					var nextEvent = eventAndType(data.event[i]);
					if (!mostRecentEvent || !mostRecentEvent.event ||
						!mostRecentEvent.event.date) {
						mostRecentEvent = nextEvent;
					} else if (nextEvent.event && nextEvent.event.date) {
						if (slSrc.compareDate(mostRecentEvent.event.date,nextEvent.event.date) < 0) {
							mostRecentEvent = nextEvent;
						}
					}
				}
				return mostRecentEvent;
			};
*/

			var loadEvents = function (srcInfo) {
				var data = srcInfo.data;
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
			};

			var createSource = function(srcInfo,sourceId) {
				var title = getSourceTitle(srcInfo.data);
				if (title) {
					var source = {
						title: title,
						id: sourceId,
						people: []
					};
					getEventInfo(srcInfo, source);
					srcInfo.source = source;
					loadEvents(srcInfo);
					add(source);
				}
			};

			var loadSource = function (srcInfo, srcPersonId) {
				console.log('===========================================================================');
				console.log('Return: personId=' + srcInfo.persId + ' srcPersonId=' + srcPersonId);
				var data = srcInfo.data;
				var sourceId = getSourceId(data);
				if (sourceId) {
					var source = slSrc.getSource(sourceId);
					if (source) {
						sourceComplete(source.people.length);
						var person = slSrc.getSourcePerson(source, srcPersonId);
						if (person) {
							person.pid = srcInfo.persId;
							console.log('source: ' + sourceId + ' already Loaded. NumPeople=' +
								source.people.length + ' Finished');
							return;		// Source has already been loaded for this person
						} else {
							// The source record didn't reference this person
							srcInfo.numPeople = source.people.length;
							console.log('source: ' + sourceId + ' already Loaded. NumPeople=' +
								source.people.length + ' Did not refernce srcPersonId=' + srcPersonId);
						}
						srcInfo.source = source;
					} else {
						console.log('createSource: ' + sourceId);
						createSource(srcInfo,sourceId);
						if (!srcInfo.source) {
							alert('###ERROR: failed to create source');
							return;
						}
					}
					setOtherSourceInfo(srcInfo);
					console.log(srcInfo.source.type + ': ' + srcInfo.source.title);
					loadSourcePeople(srcInfo, srcPersonId);
				} else {
					alert('###ERROR: sourceId undefined');
				}
			};


			// To see if and how these are changing....
			var srcInfos = [];

			slSrc.load = function (srcInfo,srcCount) {
				srcInfos.push(srcInfo);
				var fileUrl = srcInfo.description.about;
				var srcPersonId = slTxt.pathEnd(fileUrl);
				console.log('===========================================================================');
				console.log('slSrc.load: personId=' + srcInfo.persId + ' srcPersonId=' + srcPersonId);
				if (sourcePersonLoaded(srcPersonId)) {
					// It is beleived that srcPersonId is unique for each source/person
					// so if it already exists, then this source has been loaded.
					if (!srcCount) {
						console.log('###ERROR: Person already loaded but no sources');
					}
					console.log('ALREADY LOADED');
					incrsourcesReturnedPerPerson(srcInfo.persId);
					sourceComplete(srcCount);
					return;
				}
				addLoadedPerson(srcPersonId);
		//		console.log(fileUrl);
				http.get(fileUrl).success(function (data, status/*, headers, config*/) {
					if (data && status === 200) {
						srcInfo.data = data;
						loadSource(srcInfo,srcPersonId);
					} else {
						alert('File ' + fileUrl + ' load status = ' + status);
					}
					incrsourcesReturnedPerPerson(srcInfo.persId);
				});
			};

			/*
			slSrc.cleanup = function (person) {
				if (person.sources) {
					var len = person.sources.length;
					for (var i = 0; i < len; i++) {
						var sourceGrp = person.sources[i];
						var sgLen = sourceGrp.length;
						for (var j = 0; j < sgLen; j++) {
							var sourceId = sourceGrp[j];
							var source = slSrc.get(sourceId[0]);
						}
					}
				}
			};
			*/

			slSrc.info = function(persId, sourceRef, description, pushSourceId) {
				
				//construct srcInfo data structure
				return {
					seqNum: ++sequenceNumber,
					persId: persId,				// personId of person source is attached to
					sourceRef: sourceRef,
					description: description,
					pushSourceId: pushSourceId,
					data: undefined,
//					sourceId: [],
					source: undefined,
					numPeople: 0,
					peopleData: []
				};
			};

			slSrc.getSource = function(sourceId) {
				return sourceId ? sources.get(sourceId) : undefined;
			};

			slSrc.getSourcePerson = function (source, sourcePersonId) {
				if (source && sourcePersonId) {
					var people = source.people;
					for (var i = 0, len = people.length; i < len; i++) {
						var person = people[i];
						if (person.id === sourcePersonId) {
							return person;
						}
					}
				}
				return undefined;
			};

			slSrc.select = function (person, which) {
				var srcGrp = person.sources[which];
				var len = srcGrp.length;
				for (var i = 0; i < len; i++) {
					var source = slSrc.get(srcGrp[i][0]);
					slTxt.pprint(source.title,source);
				}
			};

			slSrc.init = function (drawSources, drawAttPhr) {
				drawSourcesCB = drawSources;
				drawAttPhraseCB = drawAttPhr;
				if (sourcesLoadedPerPerson) {
					sourcesLoadedPerPerson.clear();
					sourcesLoadedPerPerson = undefined;
				}
				totalSources = undefined;
				sourcesComplete = 0;
				allSourcesReturned = false;
			};

			

			var calculateSources = function (sourcesLoadedPerPerson) {
				totalSources = 0;
				var msg;
				var len = 0;
				var sppIter = sourcesLoadedPerPerson.entries();
				for (; ;) {
					var sppVal = sppIter.next();
					if (sppVal.done) {
						break;
					}
					msg = 'Loading ' + sppVal.value[0] + ' = ' + sppVal.value[1];
					console.log(msg);
					totalSources += sppVal.value[1];
					++len;
				}
				
				msg = 'Loading ' + totalSources + ' sources attached to ' +
							len + ' people.';
				console.log(msg);
			};

			slSrc.done = function (sourcesPerPerson) {
				sourcesLoadedPerPerson = new Map();
				var sppIter = sourcesPerPerson.entries();
				for (; ;) {
					var sppVal = sppIter.next();
					if (sppVal.done) {
						break;
					}
					if (sppVal.value[1][0] > 0) {
						sourcesLoadedPerPerson.set(sppVal.value[0], sppVal.value[1][0]);
					}
				}
				calculateSources(sourcesLoadedPerPerson);
				checkSourcesComplete();
			};

			return slSrc;
		}]);
})();