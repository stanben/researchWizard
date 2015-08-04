(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Manage the active person
	slApp.factory('slActv', ['fsApi', 'fsUtils', 'slPpl', 'slDrw', 'slSel', 'slSrc', 'slTxt', 'alert',
		function (fsApi, fsUtils, slPpl, slDrw, slSel, slSrc, slTxt, alert) {
			var personId;	// id of active person
			var slActv = {};

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
				fsApi.getPersonWithRelationships(primaryId, { persons: true }).then(function (response) {
					var couple;
					if (spouseId) {
						couple = response.getSpouseRelationship(spouseId);
					}
					var children = fsUtils.getChildrenWithParentsId(
					response.getChildrenOf(spouseId),
					response.getChildRelationshipsOf(spouseId));
					if (personId === family.husband.id || personId === family.wife.id) {
						var whichSpouse = slPpl.addSpouseFamily(personId, family, couple, children);
						slDrw.spouseFamily(personId, whichSpouse);
					} else {
						var whichParent = slPpl.addParentFamily(personId, family, couple, children);
						slDrw.parentFamily(personId, whichParent);
					}
				});
			};

			var processFamilies = function (spouseFamilies) {
				var drawFamilies = false;
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
				var person = slActv.who();
				if (!person.complete) {
					fsApi.getPersonWithRelationships(personId, { persons: true }).then(function (response) {
						var spouseFamilies = getSpouseFamilies(response);
						var parentFamilies = getParentFamilies(response);
						processFamilies(spouseFamilies);
						processFamilies(parentFamilies);
						slDrw.actRest(person);
						slSel.startSelection();
						person.complete = true;
						slPpl.personComplete();
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
				if (person.complete) {
					slDrw.actRest(person);
					slDrw.AttSources(personId);
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
				} else {
					// Loads extended family after completion
					slActv.loadPerson(prsnId);
				}
			};

			slActv.drawAttSources = function () {
				slPpl.installPersonSources();
				var person = slPpl.getPerson(personId);
				if (!person.sourcesClean) {
//					slSrc.cleanup(person);  what needs cleaned up?
					person.sourcesClean = true;
				}
				slDrw.AttSources(personId);
			};

			return slActv;
		} ]);


	//====================================================================
	// slAnlzSel - Analyze Selection
	slApp.factory('slAnlzSel', ['$window', 'fsApi', 'slCtx2', 'slActv', 'slSel', 'slPpl', 'alert',
		function ($window, fsApi, slCtx2, slActv, slSel, slPpl, alert) {
			var slAnlzSel = {};

			slAnlzSel.startNewFSPersonTab = function () {
				var personId = slActv.who().id;
				var choice = $window.confirm('Do you want to open this person\'s page in FamilySearch?');
				if (choice) {
					var url;
					var urltype = fsApi.getEnvironment();
					if (urltype) {
						url = 'https://' + urltype + '.familysearch.org';
					} else {
						url = 'https://' + 'familysearch.org';
					}
					url = url + '/tree/#view=ancestor&person=' + personId;
					slPpl.openTab(url);
				}
			};

			slAnlzSel.person = function (seqNum) {
				var numSources = 0;
				var person = slActv.who();
				var itemName = slSel.eventText(seqNum[0]);
				var place;
				if (seqNum.length > 1) {
					var event = slSel.getPersonEvent(person, seqNum[0]);
					if (event) {
						place = event.place[seqNum[1]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}	
				msg += ' of ' + person.name[0] + ' ' +
					person.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.father = function (seqNum) {
				var numSources = 0;
				var parents = slActv.who().parents[seqNum[0]];
				var fatherId = parents.husband;
				var father = slPpl.getPerson(fatherId);
				var itemName = slSel.eventText(seqNum[1]);
				var place;
				if (seqNum.length > 2) {
					var event;
					// Place name
					if (seqNum[1][0] === 'm') {
						event = parents.marriage;
					} else {
						event = slSel.getPersonEvent(father, seqNum[1]);
					}
					if (event) {
						place = event.place[seqNum[2]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}
				msg += ' of the father ' + father.name[0] + ' ' + father.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.mother = function (seqNum) {
				var numSources = 0;
				var parents = slActv.who().parents[seqNum[0]];
				var motherId = parents.wife;
				var mother = slPpl.getPerson(motherId);
				var itemName = slSel.eventText(seqNum[1]);
				var place;
				if (seqNum.length > 2) {
					var event;
					// Place name
					if (seqNum[1][0] === 'm') {
						event = parents.marriage;
					} else {
						event = slSel.getPersonEvent(mother, seqNum[1]);
					}
					if (event) {
						place = event.place[seqNum[2]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}
				msg += ' of the mother ' + mother.name[0] + ' ' + mother.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.spouse = function (seqNum) {
				var numSources = 0;
				var couple = slActv.who().spouses[seqNum[0]];
				var spouseId = couple.spouse;
				var spouse = slPpl.getPerson(spouseId);
				var itemName = slSel.eventText(seqNum[1]);
				var place;
				if (seqNum.length > 2) {
					var event;
					// Place name
					if (seqNum[1][0] === 'm') {
						event = couple.marriage;
					} else {
						event = slSel.getPersonEvent(spouse, seqNum[1]);
					}
					if (event) {
						place = event.place[seqNum[2]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}
				msg += ' of the spouse ' + spouse.name[0] + ' ' + spouse.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.sibling = function (seqNum) {
				var numSources = 0;
				var siblingId = slActv.who().parents[seqNum[1]].children[seqNum[0]];
				var sibling = slPpl.getPerson(siblingId);
				var itemName = slSel.eventText(seqNum[2]);
				var place;
				if (seqNum.length > 3) {
					var event = slSel.getPersonEvent(sibling, seqNum[2]);
					if (event) {
						place = event.place[seqNum[3]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}
				msg += ' of the sibling ' + sibling.name[0] + ' ' + sibling.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.child = function (seqNum) {
				var numSources = 0;
				var childId = slActv.who().spouses[seqNum[1]].children[seqNum[0]];
				var child = slPpl.getPerson(childId);
				var itemName = slSel.eventText(seqNum[2]);
				var place;
				if (seqNum.length > 3) {
					var event = slSel.getPersonEvent(child, seqNum[2]);
					if (event) {
						place = event.place[seqNum[3]];
					}
				}
				var msg = 'There are ' + numSources + ' sources which confirm the ' +
					itemName;
				if (place) {
					msg += ' <strong>' + place + '</strong>';
				}
				msg += ' of the child ' + child.name[0] + ' ' + child.name[1];
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			slAnlzSel.deselect = function () {
				var msg = '<strong>click</strong> a field to confirm sources.   ' +
						'<strong>ctrl-click</strong> to select active person';
				document.getElementById('navbar-msg').innerHTML = msg;
			};

			var selectPerson = function (selected) {
				var selCode = slSel.selId(selected);
				var seqNum;
				switch (selCode[0]) {
					case 'R': // reference Person
						if (selCode[1] === 'r') {
							slAnlzSel.startNewFSPersonTab(slActv.who().id);
						} else {
							seqNum = slSel.getActvSequenceNumber(selCode);
							slAnlzSel.person(seqNum);
						}
						return; // no change.
					case 'f': //father
						seqNum = slSel.getPersonSequenceNumber(selCode);
						slAnlzSel.father(seqNum);
						break;
					case 'm': //mother
						seqNum = slSel.getPersonSequenceNumber(selCode);
						slAnlzSel.mother(seqNum);
						break;
					case 'p': //spouse
						seqNum = slSel.getPersonSequenceNumber(selCode);
						slAnlzSel.spouse(seqNum);
						break;
					case 's': //sibling
						seqNum = slSel.getPersonGroupSequenceNumber(selCode);
						slAnlzSel.sibling(seqNum);
						break;
					case 'c': //child
						seqNum = slSel.getPersonGroupSequenceNumber(selCode);
						slAnlzSel.child(seqNum);
						break;
					default:
						alert('Unknown selectionID: ' + selCode);
				}
			};


			// Provide information as to how this source confirms
			// or contradicts info for the active person
			var selectAtt = function (selected) {
			};

			// Provide information as to how this source confirms
			// or contradicts info for the active person
			var selectUnatt = function (selected) {
			};



			var whichSelect = [selectPerson, selectAtt, selectUnatt];

			slAnlzSel.select = function (sel) {
				whichSelect[sel[0]](sel);
			};

			return slAnlzSel;
		} ]);
})();