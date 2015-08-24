(function () {
	'use strict';
	var slApp = angular.module('sourceLink');


	//====================================================================
	// slAnlz - Analyze Selection
	slApp.factory('slAnlz', ['$window', 'fsApi', 'slCtx2', 'slActv', 'slDrw', 'slSel', 'slPpl', 'slSrc', 'alert',
		function ($window, fsApi, slCtx2, slActv, slDrw, slSel, slPpl, slSrc, alert) {
		var slAnlz = {};

		slAnlz.startNewFSPersonTab = function () {
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

		var personIsLiving = function (person) {
			if (person.living) {
				var msg = 'No Attached Source for <strong>living</strong> person: ' +
					' <strong>' + person.name[0] + ' ' + person.name[1] + '</strong>';
				document.getElementById('navbar-msg').innerHTML = msg;
				return true;
			}
			return false;
		};

		slAnlz.person = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(person,seqNum)
			};
			if (slSrc.analyze(person, person, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.father = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var parents = slActv.who().parents[seqNum[0]];
			var fatherId = parents.husband;
			var father = slPpl.getPerson(fatherId);
			if (personIsLiving(father)) {
				return;
			}
			seqNum = seqNum.slice(1);
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(father, seqNum, parents),
				relation: 'father'
			};
			if (slSrc.analyze(person, father, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.mother = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var parents = slActv.who().parents[seqNum[0]];
			var motherId = parents.wife;
			var mother = slPpl.getPerson(motherId);
			if (personIsLiving(mother)) {
				return;
			}
			seqNum = seqNum.slice(1);
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(mother, seqNum, parents),
				relation: 'mother'
			};
			if (slSrc.analyze(person, mother, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.spouse = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var couple = slActv.who().spouses[seqNum[0]];
			var spouseId = couple.spouse;
			var spouse = slPpl.getPerson(spouseId);
			if (personIsLiving(spouse)) {
				return;
			}
			seqNum = seqNum.slice(1);
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(spouse, seqNum, couple),
				relation: 'spouse'
			};
			if (slSrc.analyze(person, spouse, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.sibling = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var siblingId = slActv.who().parents[seqNum[1]].children[seqNum[0]];
			var sibling = slPpl.getPerson(siblingId);
			if (personIsLiving(sibling)) {
				return;
			}
			seqNum = seqNum.slice(2);
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(sibling, seqNum),
				relation: 'sibling'
			};
			if (slSrc.analyze(person, sibling, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.child = function (seqNum) {
			var person = slActv.who();
			if (personIsLiving(person)) {
				return;
			}
			var childId = slActv.who().spouses[seqNum[1]].children[seqNum[0]];
			var child = slPpl.getPerson(childId);
			if (personIsLiving(child)) {
				return;
			}
			seqNum = seqNum.slice(2);
			var selectInfo = {
				seqNum: seqNum,
				itemName: slSel.eventText(seqNum[0]),
				compare: slSel.getCompare(child, seqNum),
				relation: 'child'
			};
			if (slSrc.analyze(person, child, selectInfo, slSel.addAttSel) > 0) {
				slDrw.AttAreas(person);
			}
		};

		slAnlz.deselect = function () {
			var msg = '<strong>click</strong> a field to confirm sources.   ' +
					'<strong>ctrl-click</strong> to select active person';
			document.getElementById('navbar-msg').innerHTML = msg;
			slSel.clearAttSel();
			slDrw.AttSources(slActv.who().id);
		};

		var selectPerson = function (selected) {
			var selCode = slSel.selId(selected);
			var seqNum;
			switch (selCode[0]) {
				case 'R': // reference Person
					if (selCode[1] === 'r') {
						slAnlz.startNewFSPersonTab(slActv.who().id);
					} else {
						seqNum = slSel.getActvSequenceNumber(selCode);
						slAnlz.person(seqNum);
					}
					return; // no change.
				case 'f': //father
					seqNum = slSel.getPersonSequenceNumber(selCode);
					slAnlz.father(seqNum);
					break;
				case 'm': //mother
					seqNum = slSel.getPersonSequenceNumber(selCode);
					slAnlz.mother(seqNum);
					break;
				case 'p': //spouse
					seqNum = slSel.getPersonSequenceNumber(selCode);
					slAnlz.spouse(seqNum);
					break;
				case 's': //sibling
					seqNum = slSel.getPersonGroupSequenceNumber(selCode);
					slAnlz.sibling(seqNum);
					break;
				case 'c': //child
					seqNum = slSel.getPersonGroupSequenceNumber(selCode);
					slAnlz.child(seqNum);
					break;
				default:
					alert('Unknown selectionID: ' + selCode);
			}
		};


		slAnlz.attSource = function (person, which) {
			var srcGrp = person.sources[which];
			var len = srcGrp.length;
			if (len > 1) {
				document.getElementById('navbar-msg').innerHTML = 'Comparing this source group with all the others is comming soon!!!';
			} else {
				document.getElementById('navbar-msg').innerHTML = 'Comparing this source with all the others is comming soon!!!';
			}
			
		};

		// Provide information as to how this source confirms
		// or contradicts info for the active person
		var selectAtt = function (selected) {
			var person = slActv.who();
			slSrc.select(person, selected[1]);
		};

		// Provide information as to how this source confirms
		// or contradicts info for the active person
		var selectUnatt = function (selected) {
			var selCode = slSel.selId(selected);
			console.log('selectUnatt is not implemented yet:' + selCode[0]);
		};



		var whichSelect = [selectPerson, selectAtt, selectUnatt];

		slAnlz.select = function (sel) {
			slSel.clearAttSel();
			whichSelect[sel[0]](sel);
		};

		return slAnlz;
	} ]);
})();