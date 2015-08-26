(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Manage the active person
	slApp.factory('slActv', ['fsApi', 'slUtl', 'slPpl', 'slDrw', 'slSel', 'slSrc', 'slTxt', 'alert',
		function (fsApi, slUtl, slPpl, slDrw, slSel, slSrc, slTxt, alert) {
			var slActv = {};
			var personId;	// id of active person
			var processFamiliesCount = 0;
			var returnProcessFamiliesCount = 0;

			slActv.who = function () {
				return slPpl.getPerson(personId);
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
						children: slUtl.getChildrenWithParentsId(pwr.getChildrenOf(spouseId), pwr.getChildRelationshipsOf(spouseId))
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
						children: slUtl.getChildrenWithParentsId(pwr.getChildrenOf(spouseId), pwr.getChildRelationshipsOf(spouseId))
					});
				}
				return families;
			};

			var getParentFamilies = function (pwr) {

				return _.map(pwr.getParentRelationships(), function (cap) {
					return {
						husband: cap.$getFatherId() ? pwr.getPerson(cap.$getFatherId()) : null,
						wife: cap.$getMotherId() ? pwr.getPerson(cap.$getMotherId()) : null,
						relationshipId: cap.id
					};
				});
			};

			var processPersonRelationships = function (primaryId, spouseId, family) {
				++processFamiliesCount;
				fsApi.getPersonWithRelationships(primaryId, { persons: true }).then(function (response) {
					var couple;
					if (spouseId) {
						couple = response.getSpouseRelationship(spouseId);
					}
					var children = slUtl.getChildrenWithParentsId(
					response.getChildrenOf(spouseId),
					response.getChildRelationshipsOf(spouseId));
					if (personId === family.husband.id || personId === family.wife.id) {
						slPpl.addSpouseFamily(personId, family, couple, children);
					} else {
						slPpl.addParentFamily(personId, family, couple, children);
					}
					++returnProcessFamiliesCount;
					if (processFamiliesCount === returnProcessFamiliesCount) {
						slDrw.actRest(slActv.who());
					}
				});
			};

			var processFamilies = function (spouseFamilies) {
				for (var i = 0; i < spouseFamilies.length; i++) {
					var family = spouseFamilies[i];
					// if we haven't passed in the children or we haven't passed in a couple
					// then read them
					if (!family.children ||
					(!family.couple && !!family.husband && !!family.wife)) {
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
						processPersonRelationships(primaryId, spouseId, family);
					} else {
						var couple = family.couple;
						var children = family.children;
						if (family.husband && personId === family.husband.id || family.wife && personId === family.wife.id) {
							slPpl.addSpouseFamily(personId, family, couple, children);
						} else {
							slPpl.addParentFamily(personId, family, couple, children);
						}
					}
				}
			};


			slActv.loadExtendedFamily = function () {
				processFamiliesCount = 0;
				returnProcessFamiliesCount = 0;
				var person = slActv.who();
				if (!person.complete) {
					fsApi.getPersonWithRelationships(personId, { persons: true }).then(function (response) {
						var spouseFamilies = getSpouseFamilies(response);
						var parentFamilies = getParentFamilies(response);
						processFamilies(spouseFamilies);
						processFamilies(parentFamilies);
						if (processFamiliesCount === returnProcessFamiliesCount) {
							slDrw.actRest(person);
						}
						slSel.startSelection();
						person.complete = true;
					});
				}
			};

			slActv.setPerson = function (personFS,persId) {
				if (personFS) {
					personId = persId;
					slPpl.addPerson(personFS);
					slPpl.getSources(persId, slActv.drawAttSources, slDrw.drawAttPhrase);
					slActv.redraw();
					slActv.loadExtendedFamily();

				} else {
					alert('No person found with id: ' + persId);
				}
			};



			slActv.loadPerson = function (persId) {
				fsApi.getPerson(persId).then(function (response) {
					var personFS = response.getPerson();
					slActv.setPerson(personFS,persId);
				});
			};

			slActv.redraw = function () {
				var person = slActv.who();
				slDrw.background(personId);
				slDrw.actPerson(personId);
				slDrw.AttSources(personId);
				if (person.complete) {
					slDrw.actRest(person);
					slSel.startSelection();
				}
			};

			slActv.change = function (prsnId) {
				prsnId = slTxt.trimEndSpace(prsnId);
				if (personId === prsnId) {
					return;
				}
				var foundPerson = slPpl.getPerson(prsnId);
				if (foundPerson) {
					personId = prsnId;
					slActv.redraw();
					slActv.loadExtendedFamily();
					slActv.drawAttSources();
				} else {
					// Loads extended family after completion
					slActv.loadPerson(prsnId);
				}
			};

			slActv.drawAttSources = function () {
				var person = slPpl.getPerson(personId);
				if (!person.sourcesClean) {
//					slSrc.cleanup(person);  what needs cleaned up?
					person.sourcesClean = true;
				}
				slDrw.AttSources(personId);
			};

			return slActv;
		} ]);

})();
	