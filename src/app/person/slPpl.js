(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// factory for managing all visited people
	slApp.factory('slPpl', ['$window', 'fsApi', 'slCtry', 'slTxt', 'slSel', 'slFix', 'slSrc', 'alert',
		function (window, fsApi, slCtry, slTxt, slSel, slFix, slSrc, alert) {
		
		//================================================================
		// Persons data structure
		// persons = [ personID, person ]
		// person = {
		//			id: txt,	gender: txt,	name: [giv,fam], 
		//			birth: event,	crstn: event,	death: event,
		//			parents: [parent, ...], spouses: [spouse, ...] 
		//			sources: [sourceId, ...]
		//			}
		// event =	{
		//			date: [dayMonth, year]    place: [txt, txt, ...]
		//			}
		// parent =	{
		//				husband: personId	wife: personId
		//				marriage: event		children: [personId, ...]
		//			}
		// spouse = {
		//			spouse: personId		marriage: event
		//			children: [personId, ...]
		//			}
		var slPpl = {};
		var persons = new Map();	// map to person by person.id
		var drawSourcesCB;
		var activePersonId;
		

		var reportCountryNotFound = function(person,country,eventType) {
			var evName = slSel.eventName(eventType);
			var message = person.name[0] + ' ' + person.name[1] +
				' is missing Country in ' + evName + ' place: ' +
				country + ' is not a country.';
			/*var newFix = */slFix.add(message);
//			if (newFix) {
//				alert(message);
//			}
		};

		slPpl.copyEvent = function (person,eventType,event) {
			if (!event) {
				return event;
			}
			var date = !event.date ? undefined :
					event.date.slice(0, event.date.length);
			var place;
			if (event.place) {
				place = event.place.slice(0,event.place.length);
				var plast = event.place.length - 1;
				var cId = slCtry.countryId(event.place[plast]);
				if (cId === -1) {
					reportCountryNotFound(person, event.place[plast], eventType);
				}
				if (cId >= 0) {
					place[plast] = cId;
					if (plast > 0) {
						var sId = slCtry.stateId(cId, event.place[--plast]);
						place[plast] = sId;
					}
				}
			}
			return {
				'date': date,
				'place': place
			};
		};

		slPpl.noEvent = function (event) {
			return !event;
		};


		slPpl.noDate = function (event) {
			return !event || !event.date ||
					event.date.length === 0;
		};

		slPpl.noPlace = function (event) {
			return !event || !event.place ||
					event.place.length === 0 || event.place[0] === '';
		};

		slPpl.noMonth = function (event) {
			return slPpl.noDate(event) || event.date[0] === '';
		};

		slPpl.noYear = function (event) {
			return slPpl.noDate(event) || event.date.length < 3;
		};

		slPpl.year = function (event) {
			if (slPpl.noYear(event)) {
				return undefined;
			}
			return event.date[2].toString();
		};


		//==================================================================
		// Extract information from person object obtained from familysearch

		var getGender = function (personFS) {
			var result = personFS.$getDisplayGender();
			if (!result) {
				result = 'U';
			} else {
				result = result[0];
			}
			return result;
		};

		
		var getFamName = function (personFS) {
			var famName = personFS.$getSurname();
			if (!famName) {
				famName = '';
			}
			return famName;
		};

		var getGivName = function (personFS) {
			var givName = personFS.$getGivenName();
			if (!givName) {
				givName = '';
			}
			return givName;
		};

		
		var getBirthDate = function (personFS) {
			var birthDate = personFS.$getDisplayBirthDate();
			if (!birthDate) {
				birthDate = '';
			}
			return birthDate;
		};

		var getBirthPlace = function (personFS) {
			var birthPlace = personFS.$getDisplayBirthPlace();
			if (!birthPlace) {
				birthPlace = '';
			}
			return birthPlace;
		};

		var getCrstnDate = function (personFS) {
			var crstnDate = personFS.$getChristeningDate();
			if (!crstnDate) {
				crstnDate = '';
			}
			return crstnDate;
		};

		var getCrstnPlace = function (personFS) {
			var crstnPlace = personFS.$getChristeningPlace();
			if (!crstnPlace) {
				crstnPlace = '';
			}
			return crstnPlace;
		};

		var getDeathDate = function (personFS) {
			var deathDate = personFS.$getDisplayDeathDate();
			if (!deathDate) {
				deathDate = '';
			}
			return deathDate;
		};

		var getDeathPlace = function (personFS) {
			var deathPlace = personFS.$getDisplayDeathPlace();
			if (!deathPlace) {
				deathPlace = '';
			}
			return deathPlace;
		};

		//==================================================================
		// Extract information from couple object obtained from familysearch
		var getMarriageDate = function (coupleFS) {
			var fact = coupleFS.$getMarriageFact();
			if (fact) {
				var marriageDate = fact.$getDate();
				if (marriageDate) {
					return marriageDate;
				}
			}
			return '';
		};

		var getMarriagePlace = function (coupleFS) {
			var fact = coupleFS.$getMarriageFact();
			if (fact) {
				var marriagePlace = fact.$getNormalizedPlace();
				if (marriagePlace) {
					return marriagePlace;
				}
			}
			return '';
		};


		var marriageEvent = function(coupleFS) {
			if (coupleFS) {
				return slTxt.event(getMarriageDate(coupleFS), getMarriagePlace(coupleFS));
			}
			return undefined;
		};

		var children = function (childrenFS) {
			if (childrenFS) {
				var results = [];
				for (var i = 0; i < childrenFS.length; i++) {
					var childId = slPpl.addPerson(childrenFS[i].person);
					if (childId) {
						slPpl.getSources(childId);
						results.push(childId);
					}
				}
				return results;
			}
			return undefined;
		};
		
		var getSpouse = function(personId,child) {
			if (child.parents) {
				for (var i = 0; i < child.parents.length; i++) {
					var couple = child.parents[i];
					if (couple.husband === personId) {
						return couple.wife;
					} else if (couple.wife === personId) {
						return couple.husband;
					}
				}
			}
			return undefined;
		};

		var spouse = function (personId, familyFS, coupleFS, childrenFS) {
			var spouseId;
			if (familyFS) {
				if (familyFS.husband && familyFS.husband.id === personId) {
					spouseId = slPpl.addPerson(familyFS.wife);
				} else {
					spouseId = slPpl.addPerson(familyFS.husband);
				}
				if (spouseId) {
					slPpl.getSources(spouseId);
				}
			} else if (coupleFS) {
				if (coupleFS.person1.resourceId === personId) {
					spouseId = coupleFS.person2.resourceId;
				} else {
					spouseId = coupleFS.person1.resourceId;
				}
			}
			var spouseChildren = children(childrenFS);
			if (!spouseId) {
				if (spouseChildren.length > 0) {
					var child = slPpl.getPerson(spouseChildren[0]);
					spouseId = getSpouse(personId, child);
				}
			}
			return {
				'spouse': spouseId,
				'marriage': marriageEvent(coupleFS),
				'children': spouseChildren
			};
		};

		var parents = function (familyFS, coupleFS, childrenFS) {
			var husbandId;
			var wifeId;
			if (familyFS) {
				husbandId = slPpl.addPerson(familyFS.husband);
				if (husbandId) {
					slPpl.getSources(husbandId);
				}
				wifeId = slPpl.addPerson(familyFS.wife);
				if (wifeId) {
					slPpl.getSources(wifeId);
				}
			}
			return {
				'husband': husbandId,
				'wife': wifeId,
				'marriage': marriageEvent(coupleFS),
				'children': children(childrenFS)
			};
		};

		

		slPpl.addPerson = function (personFS) {
			if (!personFS) {
				return undefined;
			}
			var foundPerson = slPpl.getPerson(personFS.id);
			if (!foundPerson) {
				var person = {
					'id': personFS.id,
					'gender': getGender(personFS),
					'name': [getGivName(personFS),
							getFamName(personFS)],
					'living': personFS.living,
					'birth': slTxt.event(getBirthDate(personFS), getBirthPlace(personFS)),
					'crstn': slTxt.event(getCrstnDate(personFS), getCrstnPlace(personFS)),
					'death': slTxt.event(getDeathDate(personFS), getDeathPlace(personFS)),
					'parents': undefined,
					'spouses': undefined,
					'sources': undefined,
					'getPerson': slPpl.getPerson
				};
				persons.set(person.id, person);
			}
			return personFS.id;
		};

		slPpl.getPerson = function (personId) {
			return personId ? persons.get(personId) : undefined;
		};

		/*
		slPpl.deletePerson = function (personId) {
			persons.delete(personId);
		};
		*/


		slPpl.addSpouseFamily = function (personID, familyFS, coupleFS, childrenFS) {
			var person = slPpl.getPerson(personID);
			if (!person.spouses) {
				person.spouses = [];
			}
			person.spouses.push(spouse(personID, familyFS, coupleFS, childrenFS));
			return person.spouses.length - 1;
		};

		slPpl.addParentFamily = function (personID, familyFS, coupleFS, childrenFS) {
			var person = slPpl.getPerson(personID);
			if (!person.parents) {
				person.parents = [];
			}
			person.parents.push(parents(familyFS, coupleFS, childrenFS));
			return person.parents.length - 1;
		};

		

		slPpl.openTab = function (url) {
			var newTab = window.open(url, '_blank');
			if (newTab) {
				if (window.focus) {
					newTab.focus();
				} else {
					alert('window.focus is undefined');
				}
			} else {
				alert('failure to create new Tab at url: ' + url);
			}
			return newTab;
		};


		var installSources = function (personId, sources) {
			var person = slPpl.getPerson(personId);
			if (person.sources) {
				alert('installSources to: ' + personId +
					' when sources already exist.');
			}
			person.sources = sources;
			if (personId === activePersonId) {
				drawSourcesCB();
			}
		};


		slPpl.getSources = function (persId, drawSources, drawAttPhrase) {
			if (drawSources) {
				// Starting new set of sources reset sourcesPerPerson
				drawSourcesCB = drawSources;
				activePersonId = persId;
				slSrc.init(installSources,drawAttPhrase);
			}
			var person = slPpl.getPerson(persId);
			if (person && person.sources) {
				if (persId === activePersonId) {
					drawSourcesCB();
				}
				return;
			}
			fsApi.getPersonSourcesQuery(persId).then(function (response) {
				slSrc.personSources(person, response);

			});
		};

		return slPpl;
		
	}]);
})();
