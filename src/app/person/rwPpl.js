(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');

	// factory for managing all visited people
	rwApp.factory('rwPpl', ['$window','rwTxt', function (window,rwTxt) {
		
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
		var persons = new Map();	// map to person by person.id
		var sources = new Map();	// map of sources by sourceRef.id
		var rwPpl = {};

		//================================================================
		// event interface methods

		// Create event object
		var event = function (dateStrg, placeStrg) {
			var date = splitDate(dateStrg);
			var place = splitPlace(placeStrg);
			if (!date && !place) {
				return undefined;
			}
			return {
				'date': date,
				'place': place
			};
		};

		rwPpl.copyEvent = function (event) {
			if (!event) {
				return event;
			}
			var date = !event.date ? undefined :
					[event.date[0], event.date[1]];
			var place;
			if (event.place) {
				place = [];
				for (var i = 0; i < event.place.length; i++) {
					place.push(event.place[i]);
				}
			}
			return {
				'date': date,
				'place': place
			};
		};

		rwPpl.noEvent = function (event) {
			return !event;
		};


		rwPpl.noDate = function (event) {
			return !event || !event.date ||
					event.date.length === 0;
		};

		rwPpl.noPlace = function (event) {
			return !event || !event.place ||
					event.place.length === 0 || event.place[0] === '';
		};

		rwPpl.noMonth = function (event) {
			return rwPpl.noDate(event) || event.date[0] === '';
		};

		rwPpl.noYear = function (event) {
			return rwPpl.noDate(event) || event.date[1] === '';
		};

		rwPpl.year = function (event) {
			if (rwPpl.noYear(event)) {
				return undefined;
			}
			return event.date[1];
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

		var splitDate = function (date) {
			var results;	// monthDay, year
			if (!rwTxt.isValid(date)) {
				return results;
			}
			var parts = date.split(' ');
			var lastEntry = parts[parts.length - 1];
			if (parts.length > 3 || parts.length === 3 && isNaN(lastEntry)) {
				window.alert('Invalid date format: ' + date);
				return results;
			}
			if (parts.length === 3) {
				if (isNaN(parts[1])) {
					if (!isNaN(parts[0])) {
						return [parts[0] + ' ' + parts[1], parts[2]];
					}
				} else {
					if (isNaN(parts[0])) {
						return [parts[1] + ' ' + parts[0], parts[2]];
					}
				}
				window.alert('Invalid date format: ' + date);
				return results;
			}
			if (!isNaN(lastEntry)) {
				if (parts.length > 1) {
					return [parts[0],lastEntry];
				}
				return ['',lastEntry];
			} else if (parts.length > 1) {
				return [parts[0] + ' ' + parts[1],''];
			}
			return [parts[0],''];
		};

		var splitPlace = function (place) {
			var results;	// town county state country or some subset
			if (!rwTxt.isValid(place)) {
				return results;
			}
			var parts = place.split(',');
			if (parts.length === 0) {
				return results;
			}
			if (parts.length > 4) {
				window.alert('Invalid Place Format: ' + place);
				return results;
			}
			for (var i = 0; i < parts.length; i++) {
				parts[i] = rwTxt.trimEndSpace(parts[i]);
			}
			return parts;
		};


		var marriageEvent = function(coupleFS) {
			if (coupleFS) {
				return event(getMarriageDate(coupleFS), getMarriagePlace(coupleFS));
			}
			return undefined;
		};

		var children = function (childrenFS) {
			if (childrenFS) {
				var results = [];
				for (var i = 0; i < childrenFS.length; i++) {
					var childId = rwPpl.addPerson(childrenFS[i].person);
					if (childId) {
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
					spouseId = rwPpl.addPerson(familyFS.wife);
				} else {
					spouseId = rwPpl.addPerson(familyFS.husband);
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
					var child = rwPpl.getPerson(spouseChildren[0]);
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
				husbandId = rwPpl.addPerson(familyFS.husband);
				wifeId = rwPpl.addPerson(familyFS.wife);
			}
			return {
				'husband': husbandId,
				'wife': wifeId,
				'marriage': marriageEvent(coupleFS),
				'children': children(childrenFS)
			};
		};

		

		rwPpl.addPerson = function (personFS) {
			if (!personFS) {
				return undefined;
			}
			var foundPerson = rwPpl.getPerson(personFS.id);
			if (!foundPerson) {
				var person = {
					'id': personFS.id,
					'gender': getGender(personFS),
					'name': [getGivName(personFS),
							getFamName(personFS)],
					'living': personFS.living,
					'birth': event(getBirthDate(personFS), getBirthPlace(personFS)),
					'crstn': event(getCrstnDate(personFS), getCrstnPlace(personFS)),
					'death': event(getDeathDate(personFS), getDeathPlace(personFS)),
					'parents': undefined,
					'spouses': undefined,
					'sources': undefined
				};
				persons.set(person.id, person);
			}
			return personFS.id;
		};

		rwPpl.getPerson = function (personId) {
			return personId ? persons.get(personId) : undefined;
		};

		/*
		rwPpl.deletePerson = function (personId) {
			persons.delete(personId);
		};
		*/


		rwPpl.addSpouseFamily = function (personID, familyFS, coupleFS, childrenFS) {
			var person = rwPpl.getPerson(personID);
			if (!person.spouses) {
				person.spouses = [];
			}
			person.spouses.push(spouse(personID, familyFS, coupleFS, childrenFS));
			return person.spouses.length - 1;
		};

		rwPpl.addParentFamily = function (personID, familyFS, coupleFS, childrenFS) {
			var person = rwPpl.getPerson(personID);
			if (!person.parents) {
				person.parents = [];
			}
			person.parents.push(parents(familyFS, coupleFS, childrenFS));
			return person.parents.length - 1;
		};

		rwPpl.addSource = function(sourceId, source) {
			sources.set(sourceId, source);
		};

		return rwPpl;
		
	}]);
})();