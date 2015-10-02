//===================================================================================
// Input event Handler -- primarily from mouse interaction
(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	slApp.directive('resize', function ($window, slActv, slInpt) {
		return function () {
			var w = angular.element($window);
			w.on('resize', function () {
				slInpt.clear();
				slActv.redraw();
			});
		};
	});


	// Handle mouse events
	slApp.factory('slInpt', ['$window', '$state', 'slCtx2', 'slActv', 'slSel', 'slAnlz', 'slSrc', 'slTxt', 'alert',
		function ($window, $state, slCtx2, slActv, slSel, slAnlz, slSrc, slTxt, alert) {
			var slInpt = {};

			var highlighted;	// [grp,idx] of SR highlited when cursor enters it's area
			var selected;		// [grp,idx] of SR if cursor is inside it's area at mouse up
			var mouseLoc;

			var deselect = function () {
				slCtx2.clearOverlay(slSel.rect(selected));
			};

			var select = function () {
				slCtx2.highliteSelection(selected[0],slSel.rect(selected));
			};

			/* ====================== Unused ===========================
			var xyToText = function (xy) {
			return '(' + xy.x + ',' + xy.y + ')';
			};

			var rectToText = function (rect) {
			return xyToText(rect.loc) + 'd' + xyToText(rect.d);
			};
			*/

			var unHighlight = function () {
				slCtx2.clearOverlay(slSel.rect(highlighted));
			};

			var highLight = function () {
				slCtx2.highlite(highlighted[0],slSel.rect(highlighted));
			};

			slInpt.clear = function (continueSelection) {
				if (highlighted) {
					unHighlight();
				}
				if (selected) {
					deselect();
				}
				selected = undefined;
				highlighted = undefined;
				if (!continueSelection) {
					slSel.clear();
				}
			};


			// return the mouse location within the canvas
			var canvasLoc = function (event) {
				if (!event.offsetX) {
					return {
						x: event.pageX - event.currentTarget.offsetLeft,
						y: event.pageY - event.currentTarget.offsetTop
					};

				}
				return {
					x: event.offsetX,
					y: event.offsetY
				};
			};


			var setHighlightBox = function () {
				highlighted = slSel.searchSR(mouseLoc.x, mouseLoc.y);
				if (highlighted && !selected) {
					highLight();
				}
			};


			slInpt.changeID = function () {
				//$timeout(function () {
					var newPersonID = $window.prompt('New ID: ', '');
					if (newPersonID != null) {
						slInpt.clear();
						slActv.change(newPersonID);
					}
				//});
			};

			slInpt.viewInFS = function () {
				slAnlz.startNewFSPersonTab();
			};

			slInpt.logout = function () {
				slInpt.clear();
				angular.element(document.getElementById('buttons')).attr('hidden',true);
				$state.go('home');
			};


			slInpt.returnToCanvas = function () {
				angular.element(document.getElementById('underDisplay')).empty();
				angular.element(document.getElementById('underlay')).attr('hidden',true);
				angular.element(document.getElementById('canvas1')).removeAttr('hidden');
				angular.element(document.getElementById('canvas2')).removeAttr('hidden');
				slTxt.popMsg();
				slInpt.clear(true);
			};


			slInpt.makeFatherActive = function (num) {
				var person = slActv.who();
				var newPersonID = person.parents[num[0]].husband;
				if (newPersonID !== person.id) {
					slInpt.clear();
					slActv.change(newPersonID);
				}
			};

			slInpt.makeMotherActive = function (num) {
				var person = slActv.who();
				var newPersonID = person.parents[num[0]].wife;
				if (newPersonID !== person.id) {
					slInpt.clear();
					slActv.change(newPersonID);
				}
			};

			slInpt.makeSpouseActive = function (num) {
				var person = slActv.who();
				var newPersonID = person.spouses[num[0]].spouse;
				if (newPersonID !== person.id) {
					slInpt.clear();
					slActv.change(newPersonID);
				}
			};

			slInpt.makeSiblingActive = function (cp) {
				var person = slActv.who();
				var newPersonID = person.parents[cp[1]].children[cp[0]];
				if (newPersonID !== person.id) {
					slInpt.clear();
					slActv.change(newPersonID);
				}
			};

			slInpt.makeChildActive = function (cs) {
				var person = slActv.who();
				var newPersonID = person.spouses[cs[1]].children[cs[0]];
				if (newPersonID !== person.id) {
					slInpt.clear();
					slActv.change(newPersonID);
				}
			};

			var selectActivePerson = function () {
				var selCode = slSel.selId(highlighted);
				switch (selCode[0]) {
					case 'R': // reference Person
						slInpt.clear();
						slActv.redraw();
						return; // no change.
					case 'f': //father
						slInpt.makeFatherActive(slSel.getPersonSequenceNumber(selCode));
						break;
					case 'm': //mother
						slInpt.makeMotherActive(slSel.getPersonSequenceNumber(selCode));
						break;
					case 'p': //spouse
						slInpt.makeSpouseActive(slSel.getPersonSequenceNumber(selCode));
						break;
					case 's': //sibling
						slInpt.makeSiblingActive(slSel.getPersonGroupSequenceNumber(selCode));
						break;
					case 'c': //child
						slInpt.makeChildActive(slSel.getPersonGroupSequenceNumber(selCode));
						break;
					default:
						alert('Unknown selectionID: ' + selCode);
				}
				setHighlightBox();
			};

			// print the complete contents of this record
			var selectAttached = function () {
				var person = slActv.who();
				slAnlz.attSource(person,highlighted[1]);
				
			};

			var selectUnattached = function () {

			};



			var selectOpts = [selectActivePerson, selectAttached, selectUnattached];

			slInpt.mouseUp = function (event) {
				if (slSel.ready()) {
					if (event.ctrlKey) {
						if (highlighted) {
							slAnlz.deselect();
							if (highlighted[0] === 0) {
								selectOpts[highlighted[0]]();
							} else {
								slActv.addBusyQueue(selectOpts[highlighted[0]]);
							}
							return;
						}
					}
					if (event.shiftKey) {
						// shift key deselects selected item
						if (selected) {
							deselect();
							selected = undefined;
						}
						return;
					}
					if (highlighted === selected) {
						// already selected
						return;
					}
					if (selected) {
						deselect();
						slAnlz.deselect();
					}
					selected = highlighted;
					if (selected) {
						select();
						if (selected[0] === 0) {
							slAnlz.select(selected);
						} else {
							slActv.addBusyQueue(slAnlz.select, selected);
						}
					}
				}
			};

			slInpt.mouseMove = function (event) {
				if (slSel.ready()) {
					mouseLoc = canvasLoc(event);
					if (highlighted) {
						if (slSel.insideArea(mouseLoc.x, mouseLoc.y, slSel.rect(highlighted))) {
							return;	// cursor is still within highlite area
						}
						if (!selected) {
							unHighlight();
						}
					}
					setHighlightBox();
				}
			};

			return slInpt;
		} ]);
})();

