(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');

	// Handle selection rectangles in canvas
	rwApp.factory('rwSel', function () {

//================================================================================
// selectRects: array of ['id', rectangle] values to identify the location of 
//				the selection fields on the canvas.
//==========================================================================================
// List of selection ID's that are used to identify selection regions.
//	All selection ID's are temporary reflecting the current established relationships
//	All relationships/sequences are in relation to the REFERNCE person
//	There are cases where two unique selection ID's can reference the same person (such
//	as a person who is listed as a child of more than one set of parents).
//------------------------------------------------------------------------------------------
//	Selection ID's are broken into fields depending on the ID:
//	[required] <optional>
//	[person]<person sequence#><group><group sequence#>[event][EVENTTYPE]<typeSequence>
//  Example Birthyear of 2nd sibling of 1st parents:  s1a0bY
//------------------------------------------------------------------------------------------
//	Sequence numbers my have gaps based on missing information such as
//	more than one set of parents with a missing father or mother.
//==========================================================================================
//	[person]:
//------------------------------------------------------------------------------------------
//	'R' = reference Person (only one) no personSequence # needed 
//	'f' = father - person sequence numbers match corresponding wife's person sequence number
//	'm' = mother - person sequence numbers match corresponding husband's person sequence number
//	'p' = spouse - person sequence numbers based on chronoligical spouse
//	's' = sibling - person sequence numbers match a chronological sibling of a parent group
//	'c' = child - person sequence numbers match a chronological child of a wife group
//------------------------------------------------------------------------------------------
//	[event]-->[EVENTTYPE]
//------------------------------------------------------------------------------------------
//	'n' = person's name		-->		'G' = given name(s)		'F' = family name(s)
//	'b' = birth				-->		'M' = day and month		'Y' = year	'P' = place <#>
//	'h' = christening		-->		'M' = day and month		'Y' = year	'P' = place <#>
//	'm'	= marriage			-->		'M' = day and month		'Y' = year	'P' = place <#>
//	'd' = death				-->		'M' = day and month		'Y' = year	'P' = place <#>
//  'x' = birth and death	-->		'M' = day and month		'Y' = year	'P' = place <#>
//------------------------------------------------------------------------------------------
//	<group><group sequence#>		// groups will always be followed by seq number
//------------------------------------------------------------------------------------------
//	'a' = ancestor group -	matches the sequence number of father and/or mother
//	'd' = descendant group - matches the sequence number of spouse
//------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------
//	following are the set of ID's for the reference person
//------------------------------------------------------------------------------------------
//  Name:
//------------------------------------------------------------------------------------------
//	'RnG'	given name(s)					'RnF'	family name(s)
//------------------------------------------------------------------------------------------
//	Dates:
//------------------------------------------------------------------------------------------
//	'RbM'	birth Day and Month				'RbY'	birth Year
//	'Rd1mM'	1st marriage Day and Month		'Rd2Y'	2nd marriage Year
//	'RdM'	death Day and Month				'RdY'	death Year
//------------------------------------------------------------------------------------------
//	Places are broken into up to four(?) parts that were delimited by commas on input.
//------------------------------------------------------------------------------------------
//	'RbP0'	birth Place first part (town?)		'RbP1'	birth Place second part (county?)
//	'RbP2'	birth Place third part (state?)		'RbP3'	birth Place fourth part	(nation?)
//	'RdP0'	death Place first part (town?)		'RdP1'	death Place second part (county?)
//	'RdP2'	death Place third part (state?)		'RdP3'	death Place fourth part	(nation?)

			var selectRects = [];
			var readyToSelect = false;
			var printRects = false;
			var rwSel = {};

			rwSel.clear = function () {
				readyToSelect = false;
				selectRects = [];
			};

			rwSel.ready = function () {
				return readyToSelect;
			};

			rwSel.rect = function (idx) {
				return selectRects[idx][1];
			};

			rwSel.selId = function (idx) {
				return selectRects[idx][0];
			};

			rwSel.pushSR = function (selObj) {
				selectRects.push(selObj);
			};

			rwSel.nextSR = function () {
				return selectRects.length;
			};

			rwSel.offsetSelectRects = function (startSR, endSR, offsetX, offsetY) {
				for (var i = startSR; i < endSR; i++) {
					selectRects[i][1].loc.x += offsetX;
					selectRects[i][1].loc.y += offsetY;
				}
			};

			rwSel.startSelection = function () {
				/*
				var sortSR = function (a, b) {
					if (a[1].loc.x === b[1].loc.x) {
						return a[1].loc.y - b[1].loc.y;
					}
					return a[1].loc.x - b[1].loc.x;
				};
				selectRects.sort(sortSR);
				*/
				readyToSelect = true;
				if (printRects) {
					for (var i = 0; i < selectRects.length; i++) {
						var rect = selectRects[i][1];
						console.log(selectRects[i][0] + ': (' + Math.round(rect.loc.x) + ',' + Math.round(rect.loc.y) +
							')(' + Math.round(rect.loc.x + rect.d.x) + ',' + Math.round(rect.loc.y + rect.d.y) + ')');
					}
				}
			};

			// return true if x,y is inside rect
			rwSel.insideArea = function (x, y, rect) {
				return (x >= rect.loc.x && x <= rect.loc.x + rect.d.x &&
					y >= rect.loc.y && y <= rect.loc.y + rect.d.y);
			};

			rwSel.searchSR = function (x, y) {
				// search them all
				for (var i = 0; i < selectRects.length; i++) {
					if (rwSel.insideArea(x, y, selectRects[i][1])) {
						return i;
					}
				}
				return -1;
				/*  Doesn't work since rectangles can vary in width and heigh and
					sort is by upperRight corner.
				var min = 0;
				var max = selectRects.length - 1;
				var guess;

				while (min <= max) {
					guess = Math.floor((min + max) / 2);

					if (rwSel.insideArea(x, y, selectRects[guess][1])) {
						return guess;
					}
					else {
						var rect = selectRects[guess][1];
						if (rect.loc.x < x) {
							min = guess + 1;
						} else if (rect.loc.x === x) {
							if (rect.loc.y < y) {
								min = guess + 1;
							} else if (rect.loc.y === y) {
								return guess;
							} else {
								max = guess - 1;
							}
						} else {
							max = guess - 1;
						}
					}
				}
				return -1;
				*/
			};

			rwSel.getPersonSequenceNumber = function (seqNum) {
				var selId = rwSel.selId(seqNum);
				var scan = 1;
				var number = 0;
				var num = Number(selId[scan++]);
				while (!isNaN(num)) {
					number = number * 10 + num;
					num = Number(selId[scan++]);
				}
				return number;
			};

			rwSel.getPersonGroupSequenceNumber = function (seqNum) {
				var selId = rwSel.selId(seqNum);
				var scan = 1;
				var pNumber = 0;
				var gNumber = 0;
				var num = Number(selId[scan++]);
				while (!isNaN(num)) {
					pNumber = pNumber * 10 + num;
					num = Number(selId[scan++]);
				}
				num = Number(selId[scan++]);
				while (!isNaN(num)) {
					gNumber = gNumber * 10 + num;
					num = Number(selId[scan++]);
				}
				return [pNumber, gNumber];
			};

			return rwSel;
		});
})();