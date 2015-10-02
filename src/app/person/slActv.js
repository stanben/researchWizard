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
			
			// Keep track of busy state using a counter
			var busyCnt = 0;
			// functions to execute when no longer busy
			var busyQueue = [];

			slActv.addBusyQueue = function(func,args) {
				if (busyCnt === 0) {
					func(args);
				} else {
					if (busyQueue.length === 0) {
						slTxt.pushMsg('Waiting for data to load');
					}
					busyQueue.push([func, args]);
				}
			};

			var runBusyQueue = function() {
				var len = busyQueue.length;
				if (len > 0) {
					slTxt.popMsg();
					for (var i = 0; i < len; i++) {
						var funcarg = busyQueue[i];
						funcarg[0](funcarg[1]);
					}
					busyQueue.length = 0;
					
				}
			};



			slActv.who = function () {
				return slPpl.getPerson(personId);
			};

			// Set and clear busy state
			slActv.isBusy = function () {
				angular.element(document.getElementById('navbar-busy')).removeAttr('hidden');
			};

			slActv.notBusy = function () {
				angular.element(document.getElementById('navbar-busy')).attr('hidden', true);
			};

			slActv.incrBusy = function () {
				if (++busyCnt === 1) {
					slActv.isBusy();
				}
			};

			slActv.decrBusy = function () {
				if (--busyCnt === 0) {
					slActv.redraw();
//					slSrc.dumpEval();
					slActv.notBusy();
					runBusyQueue();
				}
				if (busyCnt < 0) {
					alert('busyCnt has gone negetive.');
				}
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
				slActv.incrBusy();
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
					slActv.decrBusy();
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
					slActv.incrBusy();
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
						slActv.decrBusy();
					});
				}
			};

			slActv.drawAttSources = function () {
				slDrw.AttSources(personId);
			};


			var callbacks = {
				drawSrcs: slActv.drawAttSources,
				drawAPhr: slDrw.drawAttPhrase,
				busy: slActv.incrBusy,
				notBusy: slActv.decrBusy
			};

			slActv.setPerson = function (personFS,persId) {
				if (personFS) {
					personId = persId;
					slPpl.addPerson(personFS);
					slPpl.getSources(persId, callbacks);
					slActv.redraw();
					slActv.loadExtendedFamily();

				} else {
					alert('No person found with id: ' + persId);
				}
			};



			slActv.loadPerson = function (persId) {
				slActv.incrBusy();
				fsApi.getPerson(persId).then(function (response) {
					var personFS = response.getPerson();
					slActv.setPerson(personFS, persId);
					slActv.decrBusy();
				});
			};

			slActv.redraw = function () {
				var person = slActv.who();
				slDrw.background(personId);
				slDrw.actPerson(personId);
				if (person.complete) {
					slDrw.actRest(person);
					slSel.startSelection();
				}
				if (person.sources) {
					slDrw.AttSources(personId);
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
				} else {
					// Loads extended family after completion
					slActv.loadPerson(prsnId);
				}
			};

			return slActv;
		} ]);

})();
	