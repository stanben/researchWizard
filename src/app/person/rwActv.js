(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');

	// Manage the active person
	rwApp.factory('rwActv', ['fsApi', 'fsUtils', 'rwPpl', 'rwDrw', 'rwSel',
		function (fsApi, fsUtils, rwPpl, rwDrw, rwSel) {
		var personId;	// id of active person
		var person;		// active person	
		var sources;
		var rwActv = {};

		rwActv.who = function () {
			return person;
		};

		var getSpouseFamilies = function (pwr) {
			// first gather all of the couple relationships
			var families = _.map(pwr.getSpouseRelationships(), function (couple) {
				var spouseId = couple.$getHusbandId() === personId ? couple.$getWifeId() : couple.$getHusbandId();
				if (!spouseId) {
					spouseId = couple.$getSpouseId(personId);
				}
				return {
					husband: pwr.getPerson(couple.$getHusbandId()),
					wife: pwr.getPerson(couple.$getWifeId()),
					relationshipId: couple.id,
					couple: couple,
					children: fsUtils.getChildrenWithParentsId(pwr.getChildrenOf(spouseId), pwr.getChildRelationshipsOf(spouseId))
				};
			});
			// next add families with children but no couple relationship
			var childRelations = pwr.getChildRelationships();
			for (var i = 0; i < childRelations.length; i++) {
				var father = childRelations[i].$getFatherId();
				var mother = childRelations[i].$getMotherId();
				var found = false;
				if (families && (father || mother)) {
					for (var j = 0; j < families.length; j++) {
						var match = true;
						if (families[j].husband) {
							if (families[j].husband.id !== father) {
								match = false;
							}
						} else if (father) {
							match = false;
						}
						if (match) {
							if (families[j].wife) {
								if (families[j].wife.id !== mother) {
									match = false;
								}
							} else if (mother) {
								match = false;
							}
						}
						if (match) {
							found = true;
							break;
						}
					}
				}
				if (found) {
					continue;
				}
				var spouseId = (father === personId) ? mother : father;
				families.push({
					husband: father ? pwr.getPerson(father) : null,
					wife: mother ? pwr.getPerson(mother) : null,
					children: fsUtils.getChildrenWithParentsId(pwr.getChildrenOf(spouseId), pwr.getChildRelationshipsOf(spouseId))
				});
			}
			return families;
/*
			return families.concat(
				_(childRelations)
				// one per father+mother combination
				.uniq(function (cap) {
					return (cap.$getFatherId() || '_') + ':' + (cap.$getMotherId() || '_');
				})
				// reject father+mother combinations for which we already have families
				.reject(function (cap) {
					return !(cap.$getFatherId() === personId || cap.$getMotherId() === personId) || // just in case there are other children for some reason?
						_.any(families, function (family) {
							return family.husband.id === cap.$getFatherId() && family.wife.id === cap.$getMotherId();
						});
				})
				// map to family structure
				.map(function (cap) {
					var spouseId = (personId === cap.$getFatherId() ? cap.$getMotherId() : cap.$getFatherId()) || null; // ensure undefined becomes null
					return {
						husband: cap.$getFatherId() ? pwr.getPerson(cap.$getFatherId()) : null,
						wife: cap.$getMotherId() ? pwr.getPerson(cap.$getMotherId()) : null,
						children: fsUtils.getChildrenWithParentsId(pwr.getChildrenOf(spouseId), pwr.getChildRelationshipsOf(spouseId))
					};
				})
				.valueOf());
*/
		};

		var getParentFamilies = function(pwr) {
			return _.map(pwr.getParentRelationships(), function (cap) {
				return {
					husband: cap.$getFatherId() ? pwr.getPerson(cap.$getFatherId()) : null,
					wife: cap.$getMotherId() ? pwr.getPerson(cap.$getMotherId()) : null,
					relationshipId: cap.id
				};
			});
		};

		var processPersonRelationships = function (primaryId,spouseId,family) {
			fsApi.getPersonWithRelationships(primaryId, { persons: true }).then(function (response) {
				var couple;
				if (spouseId) {
					couple = response.getSpouseRelationship(spouseId);
				}
				var children = fsUtils.getChildrenWithParentsId(
					response.getChildrenOf(spouseId),
					response.getChildRelationshipsOf(spouseId));
				if (personId === family.husband.id || personId === family.wife.id) {
					var whichSpouse = rwPpl.addSpouseFamily(personId, family, couple, children);
					rwDrw.spouseFamily(personId, whichSpouse);
				} else {
					var whichParent = rwPpl.addParentFamily(personId, family, couple, children);
					rwDrw.parentFamily(personId, whichParent);
				}
			});
		};

		var processFamilies = function (spouseFamilies) {
			for (var i = 0; i < spouseFamilies.length; i++) {
				var family = spouseFamilies[i];
				// if we haven't passed in the children or we haven't passed in a couple
				// then read them
				if (family.children == null ||
					(family.couple == null && !!family.husband && !!family.wife)) {
					var primaryId, spouseId;
					if (family.husband && family.wife) {
						primaryId = family.husband.id;
						spouseId = family.wife.id;
					}
					else if (family.husband) {
						primaryId = family.husband.id;
						spouseId = null;
					}
					else {
						primaryId = family.wife.id;
						spouseId = null;
					}
					processPersonRelationships(primaryId,spouseId,family);
				} else {
					var couple = family.couple;
					var children = family.children;
					if (family.husband && personId === family.husband.id || family.wife && personId === family.wife.id) {
						var whichSpouse = rwPpl.addSpouseFamily(personId, family, couple, children);
						rwDrw.spouseFamily(personId, whichSpouse);
					} else {
						var whichParent = rwPpl.addParentFamily(personId, family, couple, children);
						rwDrw.parentFamily(personId, whichParent);
					}
				}
			}
		};


		rwActv.loadExtendedFamily = function () {
			if (!person.complete) {
				fsApi.getPersonWithRelationships(personId, { persons: true }).then(function (response) {
					var spouseFamilies = getSpouseFamilies(response);
					var parentFamilies = getParentFamilies(response);
					processFamilies(spouseFamilies);
					processFamilies(parentFamilies);
					rwSel.startSelection();
					person.complete = true;
				});
			}
		};

		rwActv.loadPerson = function () {
			person = undefined;
			fsApi.getPerson(personId).then(function (response) {
				person = response.getPerson();
				rwPpl.addPerson(person);
				if (sources) {
					person.sources = sources;
					rwDrw.sources(personId);
				}
			});
		};

		rwActv.loadSources = function() {
			sources = undefined;
			fsApi.getPersonSourcesQuery(personId).then(function (response) {
				sources = [];
				sources.map(response.getSourceRefs(), function (sourceRef) {
					rwPpl.addSource(
						{
							id: sourceRef.id,
							source: {
								ref: sourceRef,
								description: response.getSourceDescription(sourceRef.$sourceDescriptionId)
							}
						}
						);
					return sourceRef.id;
				});
				// draw sources and attach sources to person
				if (person) {
					person.sources = sources;
					rwDrw.sources(personId);
				}
			});
		};

		rwActv.redraw = function () {
			rwDrw.background(personId);
			rwDrw.actPerson(personId);
			if (person.complete) {
				rwDrw.actRest(person);
				rwSel.startSelection();
			}
		};

		rwActv.change = function(prsnId) {
			if (personId === prsnId) {
				return;
			}
			personId = prsnId;
			person = rwPpl.getPerson(personId);
			if (!person) {
				// Loads extended family after completion
				rwActv.loadPerson();
				rwActv.loadSources();
			} else {
				rwActv.loadExtendedFamily();
			}
			rwActv.redraw();
		};

		return rwActv;
	}]);
})();