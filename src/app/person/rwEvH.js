//===================================================================================
// Mouse event Handler
(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');

	rwApp.directive('resize', function ($window,rwActv) {
		return function () {
			var w = angular.element($window);
			w.on('resize', function () {
				rwActv.redraw();
			});
		};

	});

	// Handle mouse events
	rwApp.factory('rwEvH', ['$window', 'rwCtx2', 'rwActv', 'rwSel',
		function ($window, rwCtx2, rwActv, rwSel) {
			var rwEvH = {};
			
			var highlighted = -1;		// index of SR highlited when cursor enters it's area
			var selected = -1;			// index of SR if cursor is inside it's area at mouse up

			var deselect = function () {
				rwCtx2.clearOverlay(rwSel.rect(selected));
			};

			var select = function () {
				rwCtx2.highliteSelection(rwSel.rect(selected));
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
				rwCtx2.clearOverlay(rwSel.rect(highlighted));
			};

			var highLight = function () {
				rwCtx2.highlite(rwSel.rect(highlighted));
			};

			rwEvH.clear = function () {
				if (highlighted >= 0) {
					unHighlight();
				}
				if (selected >= 0) {
					deselect();
				}
				rwSel.clear();
				selected = -1;
				highlighted = -1;
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

			

			rwEvH.makeFatherActive = function (num) {
				var person = rwActv.who();
				var newPersonID = person.parents[num].husband;
				if (newPersonID !== person.id) {
					rwEvH.clear();
					rwActv.change(newPersonID);
				}
			};

			rwEvH.makeMotherActive = function (num) {
				var person = rwActv.who();
				var newPersonID = person.parents[num].wife;
				if (newPersonID !== person.id) {
					rwEvH.clear();
					rwActv.change(newPersonID);
				}
			};

			rwEvH.makeSpouseActive = function (num) {
				var person = rwActv.who();
				var newPersonID = person.spouses[num].spouse;
				if (newPersonID !== person.id) {
					rwEvH.clear();
					rwActv.change(newPersonID);
				}
			};

			rwEvH.makeSiblingActive = function (cp) {
				var person = rwActv.who();
				var newPersonID = person.parents[cp[1]].children[cp[0]];
				if (newPersonID !== person.id) {
					rwEvH.clear();
					rwActv.change(newPersonID);
				}
			};

			rwEvH.makeChildActive = function (cs) {
				var person = rwActv.who();
				var newPersonID = person.spouses[cs[1]].children[cs[0]];
				if (newPersonID !== person.id) {
					rwEvH.clear();
					rwActv.change(newPersonID);
				}
			};

			var selectActivePerson = function () {
				switch (rwSel.selId(highlighted)[0]) {
					case 'R':	// reference Person
						rwEvH.clear();
						rwActv.redraw();
						return;	// no change.
					case 'f':	//father
						rwEvH.makeFatherActive(rwSel.getPersonSequenceNumber(highlighted));
						break;
					case 'm':	//mother
						rwEvH.makeMotherActive(rwSel.getPersonSequenceNumber(highlighted));
						break;
					case 'p':	//spouse
						rwEvH.makeSpouseActive(rwSel.getPersonSequenceNumber(highlighted));
						break;
					case 's':	//sibling
						rwEvH.makeSiblingActive(rwSel.getPersonGroupSequenceNumber(highlighted));
						break;
					case 'c':	//child
						rwEvH.makeChildActive(rwSel.getPersonGroupSequenceNumber(highlighted));
						break;
					default:
						$window.alert('Unknown selectionID: ' + rwSel.selId(highlighted));
				}
			};

			rwEvH.mouseUp = function (event) {
				if (rwSel.ready()) {
					if (event.ctrlKey) {
						if (highlighted >= 0) {
							selectActivePerson();
							return;
						}
					}
					if (event.shiftKey) {
						// shift key deselects selected item
						if (selected >= 0) {
							deselect();
							selected = -1;
						}
						return;
					}
					if (highlighted === selected) {
						// already selected
						return;
					}
					if (selected >= 0) {
						deselect();
					}
					selected = highlighted;
					if (selected >= 0) {
						select();
					}
				}
			};

			


			rwEvH.mouseMove = function (event) {
				if (rwSel.ready()) {
					var loc = canvasLoc(event);
					if (highlighted >= 0) {
						if (rwSel.insideArea(loc.x,loc.y,rwSel.rect(highlighted))) {
							return;		// cursor is still within highlite area
						}
						if (selected === -1) {
							unHighlight();
						}
					}
					highlighted = rwSel.searchSR(loc.x, loc.y);
					if (highlighted !== -1 && selected === -1) {
						highLight();
					}
				}
			};

			return rwEvH;
		}]);
})();