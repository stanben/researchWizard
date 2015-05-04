(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');
	rwApp.factory('rwCtx', ['$window', 'rwTxt',
		function ($window, rwTxt) {

			var canvas;
			var ctx;
			var canvasWidth;
			var canvasHeight;
			var navbarHeight = 45;
			//================================================================================
			// selectRects: array of ['id', rectangle] values to identify the location of 
			//				the selection fields on the canvas.
			var selectRects = [];
			var familyName = '';
			var drawMarks = false;
			var rwCtx = {};

			console.log('start rwCtx factory');

			Array.prototype.extend = function (otherArray) {
				otherArray.forEach(function (v) { this.push(v); }, this);
			};

			rwCtx.drawMrks = function () {
				return drawMarks;
			};

			rwCtx.setCanvas = function (cnvs) {
				canvas = cnvs;
				canvas.width = $window.innerWidth;
				canvas.height = $window.innerHeight;
				canvasWidth = canvas.width;
				canvasHeight = canvas.height;
			};

			rwCtx.setContext = function (context) {
				ctx = context;
			};


			//========================================================
			// return x dimension of a text segment using current settings
			rwCtx.textWidth = function (text) {
				return ctx.measureText(text).width;
			};

			rwCtx.setTextStyle = function (fill, txtAlgn) {
				ctx.fillStyle = fill;
				ctx.textAlign = txtAlgn;
			};

			//==============================================================================
			// Trim the last character from textA[0] and return the width of the removed char
			rwCtx.trimLastChar = function (textA, numberToTrim) {
				if (textA[0].length === 0) {
					return 0;
				}
				var tW = 0;		// total width of deleted characters
				if (rwTxt.isValid(numberToTrim)) {
					for (var i = textA[0].length - numberToTrim; i < textA[0].length; i++) {
						tW += rwCtx.textWidth(textA[0].charAt(i));
					}
					textA[0] = textA[0].substring(0, textA[0].length - numberToTrim);
				} else {
					tW += rwCtx.textWidth(textA[0].charAt(textA[0].length - 1));
					textA[0] = textA[0].substring(0, textA[0].length - 1);
				}
				return tW;
			};

			//========================================================
			// concat text to end of textA which is an array[0] 
			// of text string.  return the new text width.
			rwCtx.concat = function (textA, text) {
				textA[0] += text;
				return rwCtx.textWidth(text);
			};

			var getFamName = function (person) {
				var famName = person.$getSurname();
				if (famName === undefined) {
					famName = '';
				}
				return famName;
			};

			var getGivName = function (person) {
				var givName = person.$getGivenName();
				if (givName === undefined) {
					givName = '';
				}
				return givName;
			};

			var getBirthYear = function (person) {
				var birthDate = person.$getDisplayBirthDate();
				if (birthDate === undefined) {
					return '';
				}
				var bd = splitDate(birthDate);
				return bd[bd.length - 1];
			};

			var getBirthDate = function (person) {
				var birthDate = person.$getDisplayBirthDate();
				if (birthDate === undefined) {
					birthDate = '';
				}
				return birthDate;
			};

			var getMarriageDate = function (couple) {
				var fact = couple.$getMarriageFact();
				if (fact) {
					var marriageDate = fact.$getDate();
					if (marriageDate) {
						return marriageDate;
					}
				}
				return '';
			};

			var getMarriagePlace = function (couple) {
				var fact = couple.$getMarriageFact();
				if (fact) {
					var marriagePlace = fact.$getNormalizedPlace();
					if (marriagePlace) {
						return marriagePlace;
					}
				}
				return '';
			};

			var getBirthPlace = function (person) {
				var birthPlace = person.$getDisplayBirthPlace();
				if (birthPlace === undefined) {
					birthPlace = '';
				}
				return birthPlace;
			};

			var getDeathDate = function (person) {
				var deathDate = person.$getDisplayDeathDate();
				if (deathDate === undefined) {
					deathDate = '';
				}
				return deathDate;
			};

			var getDeathPlace = function (person) {
				var deathPlace = person.$getDisplayDeathPlace();
				if (deathPlace === undefined) {
					deathPlace = '';
				}
				return deathPlace;
			};

			var reduceGivName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					for (;;) {
						reduced += rwCtx.trimLastChar(name);
						if (reduced >= needToReduce || name[0].length === 1) {
							break;
						}
					}
					parts[i] = name[0];
					if (reduced >= needToReduce) {
						break;
					}
				}
				givName[0] = '';
				for (i = 0; i < parts.length; i++) {
					givName[0] += parts[i];
					givName[0] += ' ';
				}
				rwCtx.trimLastChar(givName);
				return reduced;
			};

			var reduceFamName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					reduced += rwCtx.trimLastChar(name);
					if (reduced >= needToReduce) {
						if (i > 3) {
							rwCtx.trimLastChar(name);
							rwCtx.trimLastChar(name);
							rwCtx.trimLastChar(name);
						} else {
							name[0] = '';
						}
						name[0] += '...';
						for (var j = parts.length - 1; j > i; j--) {
							parts.pop();
						}
						break;
					}
				}
				givName[0] = '';
				for (i = 0; i < parts.length; i++) {
					givName[0] += parts[i];
					givName[0] = ' ';
				}
				rwCtx.trimLastChar(givName);
				return reduced;
			};


			var splitDate = function (date) {
				var results = ['', ''];	// monthDay, year
				if (!rwTxt.isValid(date)) {
					return results;
				}
				var parts = date.split(' ');
				var lastEntry = parts[parts.length - 1];

				if (!isNaN(lastEntry)) {
					results[1] = lastEntry;
					parts.pop();
				}
				if (parts.length > 1) {
					results[0] = parts[0] + ' ' + parts[1].substring(0, 3);
				} else if (parts.length === 1) {
					if (!isNaN(parts[0])) {
						return results;	// number is invalid date.
					}
					results[0] = parts[0].substring(0, 3);
				}
				return results;
			};

			var splitPlace = function (place) {
				var results = ['', '', '', ''];	// town county state country
				if (!rwTxt.isValid(place)) {
					return results;
				}
				var parts = place.split(',');
				if (parts.length === 0) {
					return results;
				}
				for (var i = 0; i < parts.length; i++) {
					parts[i] = rwTxt.trimEndSpace(parts[i]);
				}
				if (parts.length > 4) {
					$window.alert('Place has more than 4 parts: ' + place);
					while (parts.length > 4) {
						parts.pop();
					}
				}
				return parts;
			};

			//=============================================================
			// date[['prefix','id'][dayMonthStg,yearStg]]
			// txtX = [string]:	where the string is stored
			var addDate = function (date, txtA) {
				if (rwTxt.isValid(date[1][0])) {
					txtA[0] += date[0][0];	// Prefix
					txtA[0] += date[1][0];
					if (rwTxt.isValid(date[1][1])) {
						txtA[0] += ' ' + date[1][1];
					}

				} else if (rwTxt.isValid(date[1][1])) {
					txtA[0] += date[0][0] + date[1][1];
				}
				txtA[0] += ' ';
			};

			var addPlace = function (place, txtA) {
				var added = false;
				if (rwTxt.isValid(place.town)) {
					txtA[0] += place[0] + place.town;
					added = true;
				}
				if (rwTxt.isValid(place.county)) {
					if (added) {
						txtA[0] += ', ';
					} else {
						txtA[0] += place[0];
						added = true;
					}
					txtA[0] += place.county;
				}
				if (rwTxt.isValid(place.state)) {
					if (added) {
						txtA[0] += ', ';
					} else {
						txtA[0] += place[0];
						added = true;
					}
					txtA[0] += place.state;
				}
				if (rwTxt.isValid(place.nation)) {
					if (added) {
						txtA[0] += ', ';
					} else {
						txtA[0] += place[0];
						added = true;
					}
					txtA[0] += place.nation;
				}
				if (!added) {
					rwCtx.trimLastChar(txtA);
				}
			};

			var reducePart = function (subPlace) {
				var parts = subPlace.split(' ');
				var wBefore = rwCtx.textWidth(subPlace);
				subPlace = '';
				if (parts.length > 1) {
					for (var i = 0; i < parts.length; i++) {
						subPlace += parts[i][0];
					}
				} else {
					subPlace = parts[0].substring(0, 3) + '.';
				}
				var wAfter = rwCtx.textWidth(subPlace);
				return wBefore - wAfter;
			};

			var reducePlace = function (place, reduceW) {
				// Work from the back to reduce
				var totalReduced = 0;
				if (rwTxt.isValid(place.nation)) {
					totalReduced += reducePart(place.nation);
					if (totalReduced > reduceW) {
						return totalReduced;
					}
				}
				if (rwTxt.isValid(place.state)) {
					totalReduced += reducePart(place.state);
					if (totalReduced > reduceW) {
						return totalReduced;
					}
				}
				if (rwTxt.isValid(place.county)) {
					totalReduced += reducePart(place.county);
					if (totalReduced > reduceW) {
						return totalReduced;
					}
				}
				if (rwTxt.isValid(place.city)) {
					totalReduced += reducePart(place.city);
				}
				return totalReduced;
			};

			var reduceMarriage = function (bdArr, width) {
				var mText = [''];
				addDate(bdArr[0], mText);
				addPlace(bdArr[1], mText);
				var mW = rwCtx.textWidth(mText);
				if (mW > width) {
					mW -= reducePlace(bdArr[1][1], mW - width);
				}

				return mW;
			};

			//=======================================================================
			// reduceBirthDeath
			//	bdArr[4] =	[0][0]: String Prefix
			//				[0][1]: Selection ID prefix
			//				[1][n]: substrings
			//	ID = person ID
			//	width = maximum width of created text
			//	reduce string lengths in order to fit text into
			//	as few of lines as practicle.
			// if the text will fit one line then a [linewidth] will be returned
			// otherwise an [linewidth1, linewidth2] will be returned for linewidth
			// of the birth and death info respectively.
			var reduceBirthDeath = function (person, bdArr, ID, width) {
				//var dittoChar = '\u2033';
				var bText = [''];
				addDate(bdArr[0], bText);
				addPlace(bdArr[1], bText);
				var bW = rwCtx.textWidth(bText);
				var dText = [''];
				addDate(bdArr[2], dText);
				addPlace(bdArr[3], dText);
				var dW = rwCtx.textWidth(dText);
				var idW = rwCtx.textWidth(person.id);
				var bdText = bText + ' ' + dText + ' ' + person.id;
				var totalW = rwCtx.textWidth(bdText);
				if (totalW > width) {
					if (bW > width) {
						bW -= reducePlace(bdArr[1][1], bW - width);
					}
					if (dW + idW > width) {
						dW -= reducePlace(bdArr[3][1], dW + idW - width);
					}
					return [
						bW,
						dW
					];
				}
				return [
				totalW
				];
			};


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
			//	'n' = person's name -->		'G' = given name(s)		'F' = family name(s)
			//	'b' = birth			-->		'M' = day and month		'Y' = year	'P' = place <#>
			//	'h' = christening	-->		'M' = day and month		'Y' = year	'P' = place <#>
			//	'm'	= marriage		-->		'M' = day and month		'Y' = year	'P' = place <#>
			//	'd' = death event	-->		'M' = day and month		'Y' = year	'P' = place <#>
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

			//==========================================================================================
			// concatDate
			//==========================================================================================
			//			Take the date information from dateA.	Append to the string to display in textA. 
			//			Place the selection id which identifies the information and the corresponding selection
			//			rectangle into selectRects.
			//	dateA[0][0]: Date Prefix
			//	dateA[0][1]: Selection ID prefix
			//	dataA[1][0]: day month string
			//	dataA[1][1]: year string
			//	textA[0]: string the date text is concatenated into
			//
			var concatDate = function (dateA, y, height, textA, select) {
				var foundValid = false;
				for (var i = 0; i < dateA[1].length; i++) {
					if (rwTxt.isValid(dateA[1][i])) {
						foundValid = true;
						break;
					}
				}
				if (!foundValid) {
					return;
				}
				var id = dateA[0][1];
				var sX = 0;
				sX += rwCtx.concat(textA, dateA[0][0]);
				var mW = rwCtx.concat(textA, dateA[1][0]);
				if (mW > 0) {
					if (select && mW > 0) {
						selectRects.push([id + 'M', rwCtx.rect(sX, y - height, mW, height)]);
					}
					sX += mW;
					sX += rwCtx.concat(textA, ' ');
				}
				var yW = rwCtx.concat(textA, dateA[1][1]);
				if (yW > 0) {
					if (select && yW > 0) {
						selectRects.push([id + 'Y', rwCtx.rect(sX, y - height, yW, height)]);
					}
					sX += yW;
				} else {
					rwCtx.trimLastChar(textA);
				}
			};

			//==========================================================================================
			//	concatPlace: Take the information from placeA.	Append to the string to display in textA
			//			Place the id which identifies the information and the selection rectangle
			//			into selectRects.
			//	placeA[0][0]: Place Prefix
			//	placeA[0][1]: Selection ID prefix
			//	placeA[1][n]: place substrings
			//	textA[0]: string the place text is concatanated into
			//	
			var concatPlace = function (placeA, y, height, textA, select) {
				var foundValid = false;
				var i;
				for (i = 0; i < placeA[1].length; i++) {
					if (rwTxt.isValid(placeA[1][i])) {
						foundValid = true;
						break;
					}
				}
				if (!foundValid) {
					return;
				}
				var id = placeA[0][1];
				var sX = 0;
				sX += rwCtx.concat(textA, placeA[0][0]);
				for (i = 0; i < placeA[1].length; ++i) {
					var iW = rwCtx.concat(textA, placeA[1][i]);
					if (iW > 0) {
						if (select && iW > 0) {
							selectRects.push([id + 'P' + i, rwCtx.rect(sX, y - height, iW, height)]);
						}
						sX += iW;
						sX += rwCtx.concat(textA, ', ');
					}
				}
				rwCtx.trimLastChar(textA, 2);
			};

			var offsetSelectRects = function (start, end, offsetX, offsetY) {
				for (var i = start; i < end; i++) {
					selectRects[i][1].loc.x += offsetX;
					selectRects[i][1].loc.y += offsetY;
					if (drawMarks) {
						rwCtx.setDrawStyle('green', 'green');
						rwCtx.drawRect(selectRects[i][1]);
					}
				}
			};



			var getWidth = function () {
				return $window.innerWidth; //  || $document.documentElement.clientWidth || $document.body.clientWidth;
			};

			var getHeight = function () {
				return $window.innerHeight; // $window.innerHeight || $document.documentElement.clientHeight || $document.body.clientHeight;
			};


			

			var canvasResize = function () {
				var resized = false;
				if (canvasWidth !== getWidth()) {
					canvas.width = canvasWidth = getWidth();
					resized = true;
				}
				if (canvasHeight !== getHeight()) {
					canvas.height = canvasHeight = getHeight();
					resized = true;
				}
				return resized;
			};

			var drawInfoArc = function (centerX, centerY, outerRadius, innerRadius, startAngle, endAngle) {
				ctx.beginPath();
				ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
				ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			};

			//========================================================
			// create an x,y point
			rwCtx.point = function (x, y) {
				return {
					x: x,
					y: y
				};
			};

			//========================================================
			// create rectangle object which consists of an x,y location (loc)
			// and a delta x,y width and length (d).
			rwCtx.rectangle = function (x, y, width, height) {
				return {
					loc: rwCtx.point(x, y),
					d: rwCtx.point(width, height)
				};
			};

			//========================================================
			// return bounding rectangle for a text segment using
			// left X postion of text.  Y placement, width of text and
			// height of text.
			rwCtx.rect = function (leftX, locY, width, height) {
				var growTxtR = 0.1 * height;
				return rwCtx.rectangle(leftX - growTxtR, locY + 0.2 * height - growTxtR, width + 2 * growTxtR, height + 2 * growTxtR);
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================
			rwCtx.setDrawStyle = function (fillColor, strokeColor) {
				ctx.fillStyle = fillColor;
				ctx.strokeStyle = strokeColor;
			};

			rwCtx.drawRect = function (rect) {
				ctx.rect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
				ctx.stroke();
			};

			rwCtx.drawLine = function (x1, y1, x2, y2) {
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			};



			rwCtx.drawText = function (text, x, y) {
				ctx.fillStyle = 'black';
				ctx.fillText(text, x, y);
				if (drawMarks) {
					rwCtx.setDrawStyle('red', 'red');
					rwCtx.drawDot(x, y);
				}
			};

			rwCtx.drawCircle = function (centerX, centerY, radius) {
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			};

			rwCtx.drawDot = function (x, y) {
				rwCtx.drawCircle(x, y, 1);
			};



			//==================================================
			// return amount to shrink text lines base on current
			// font settings
			rwCtx.shrinkW = function () {
				return rwCtx.textWidth('XX');
			};

			rwCtx.drawBackground = function (person) {
				canvasResize();
				var w = canvasWidth;
				var h = canvasHeight;
				if (h < 0.7 * w) {
					w = h / 0.7;
				} else {
					h = 0.7 * w;
				}
				ctx.lineWidth = 1;
				var centerX = w / 2;
				var centerY = 0.72 * h + navbarHeight;
				var UAStartAngle = 0.87 * Math.PI;
				var UAEndAngle = 0.13 * Math.PI;
				// Radius values for unattached sources
				var UAOuterRadius = 0.7 * h;
				var UAInnerRadius = 0.7 * UAOuterRadius;
				var thickness = UAOuterRadius - UAInnerRadius;
				var space = 0;
				//	Determine vertical distance from center of circle to bottom
				// of outer arc
				var centerToBottom = UAOuterRadius * Math.sin(Math.PI - UAStartAngle);
				// Radius values for attached sources
				var outerRadius = UAInnerRadius - space;
				var innerRadius = outerRadius - thickness;
				var endAngle = Math.asin(centerToBottom / outerRadius);
				var startAngle = Math.PI - endAngle;
				// radius of person area.
				var PRadius = innerRadius - space;
				rwCtx.setDrawStyle('#C3AD82', '#7F7155');
				drawInfoArc(centerX, centerY, UAOuterRadius, UAInnerRadius, UAStartAngle, UAEndAngle);
				rwCtx.setDrawStyle('#40AD82', '#2B7420');
				drawInfoArc(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle);
				var gender = person.$getDisplayGender();
				var maleCardColor = '#AACBDA';
				var femaleCardColor = '#EFBFBF';
				var UnknownColor = '#C5C5C5';
				if (!rwTxt.isValid(gender)) {
					rwCtx.setDrawStyle('#C2C2C2', '#656565');
					rwCtx.drawCircle(centerX, centerY, PRadius);
					rwCtx.setDrawStyle(UnknownColor, UnknownColor);
					rwCtx.drawCircle(centerX, centerY, PRadius - 20);
				} else if (gender === 'Male') {
					rwCtx.setDrawStyle('#8BA4C3', '#546376');
					rwCtx.drawCircle(centerX, centerY, PRadius);
					rwCtx.setDrawStyle(maleCardColor, maleCardColor);
					rwCtx.drawCircle(centerX, centerY, PRadius - 20);
				} else if (gender === 'Female') {
					rwCtx.setDrawStyle('#C38BB7', '#74536D');
					rwCtx.drawCircle(centerX, centerY, PRadius);
					rwCtx.setDrawStyle(femaleCardColor, femaleCardColor);
					rwCtx.drawCircle(centerX, centerY, PRadius - 20);
				}

				return {
					edgeRadius: UAOuterRadius,
					centerRadius: outerRadius,
					innerRadius: PRadius,
					x: centerX,
					y: centerY
				};
			};

			rwCtx.setFontSize = function (fontSize) {
				ctx.font = fontSize + 'px Arial';
				return fontSize * 1.2;
			};



			//=================================================================================
			// renderName - draw name of person centered on canvas at location x,y  The max line
			//				width is width and character height is height.  If name is too
			//				long to fit on one line then draw on two lines.  If name will
			//				not fit on two lines then reduce name to fit and draw on two lines.
			rwCtx.renderName = function (person, preID, x, y, width, height, lineSpace, select) {
				var famName = getFamName(person);
				if (preID === 'R') {
					familyName = famName;
				}
				var givName = getGivName(person);
				var fullName = givName + ' ' + famName;
				var givWidth = rwCtx.textWidth(givName);
				var famWidth = rwCtx.textWidth(famName);
				var fullW = rwCtx.textWidth(fullName);
				var nextSR;
				var i;
				if (select) {
					nextSR = selectRects.length;
				}
				if (width >= fullW) {
					rwCtx.drawText(fullName, x, y);
					if (select) {
						selectRects.push([preID + 'nG', rwCtx.rect(x - fullW / 2, y - height, givWidth, height)]);
						selectRects.push([preID + 'RnF', rwCtx.rect(x + fullW / 2 - famWidth, y - height, famWidth, height)]);
						if (drawMarks) {
							rwCtx.setDrawStyle('green', 'green');
							for (i = nextSR; i < selectRects.length; i++) {
								rwCtx.drawRect(selectRects[i][1]);
							}
						}
					}
					return y + lineSpace;
				} else {
					// Name is too long.	Split on two lines
					var nextY = y + lineSpace;	// positive y is down
					if (width >= givWidth) {
						rwCtx.drawText(givName, x, y);
						rwCtx.drawText(famName, x, nextY);
						if (select) {
							selectRects.push([preID + 'RnG', rwCtx.rect(x - givWidth / 2, y, givWidth, height)]);
							selectRects.push([preID + 'nF', rwCtx.rect(x - famWidth / 2, y - lineSpace, famWidth, height)]);
							if (drawMarks) {
								rwCtx.setDrawStyle('green', 'green');
								for (i = nextSR; i < selectRects.length; i++) {
									rwCtx.drawRect(selectRects[i][1]);
								}
							}
						}
						return y + lineSpace * 2;
					} else {
						// Name is too long to fit on two lines
						var neededSpace = givWidth - width;
						var gname = [givName];
						reduceGivName(gname, neededSpace);
						givName = gname[0];
						rwCtx.drawText(givName, x, y);
						givWidth = rwCtx.textWidth(givName);
						if (famWidth > width) {
							neededSpace = famWidth - width;
							famName = reduceFamName(famName, neededSpace);
							famWidth = rwCtx.textWidth(famName);
						}
						rwCtx.drawText(' ' + famName, x, y);
						if (select) {
							selectRects.push([preID + 'nG', rwCtx.rect(x - width / 2, y, givWidth, height)]);
							selectRects.push([preID + 'nF', rwCtx.rect(x - width / 2, nextY, famWidth, height)]);
							if (drawMarks) {
								rwCtx.setDrawStyle('green', 'green');
								for (i = nextSR; i < selectRects.length; i++) {
									rwCtx.drawRect(selectRects[i][1]);
								}
							}
						}
						return y + lineSpace * 2;
					}
				}
			};

			//=============================================================================================
			// renderNameYear  draw then persons name and birth year centered on the canvas at x,y
			//				reduce so it will fit on one line.
			rwCtx.renderNameYear = function (person, preID, x, y, width, height, lineSpace, select) {
				ctx.textAlign = 'center';	// center the text at x
				var famName = getFamName(person);
				var givName = getGivName(person);
				var birthYear = getBirthYear(person);
				var line = rwTxt.createLine([givName, famName, birthYear]);
				var givWidth = rwCtx.textWidth(givName);
				var famWidth = rwCtx.textWidth(famName);
				var bYWidth = rwCtx.textWidth(birthYear);
				var spWidth = rwCtx.textWidth(' ');
				var fullW = rwCtx.textWidth(line);
				var nextSR;
				if (select) {
					nextSR = selectRects.length;
				}
				var newWidth;
				if (fullW > width) {
					if (famName === familyName) {
						famName = familyName[0];
						newWidth = rwCtx.textWidth(famName);
						fullW -= famWidth - newWidth;
						famWidth = newWidth;
					}
					if (fullW > width) {
						var gname = [givName];
						reduceGivName(gname, fullW - width);
						givName = gname[0];
						givWidth = rwCtx.textWidth(givName);
					}
					line = rwTxt.createLine([givName, famName, birthYear]);
					fullW = rwCtx.textWidth(line);
				}
				rwCtx.drawText(line, x, y);
				if (select) {
					var locX = x - fullW / 2;
					if (givWidth > 0) {
						selectRects.push([preID + 'nG', rwCtx.rect(locX, y - height, givWidth, height)]);
					}
					locX += givWidth + spWidth + famWidth + spWidth;
					if (bYWidth > 0) {
						selectRects.push([preID + 'bY', rwCtx.rect(locX, y - height, bYWidth, height)]);
					}
					if (drawMarks) {
						rwCtx.setDrawStyle('green', 'green');
						for (var i = nextSR; i < selectRects.length; i++) {
							rwCtx.drawRect(selectRects[i][1]);
						}
					}
				}
				return y + lineSpace;
			};

			rwCtx.renderMarriage = function (couple, preID, x, y, width, height, lineSpace, select) {
				var text = [[''], ['']];
				ctx.textAlign = 'left';	// concatenate text parts from left to right
				var marriageDate = getMarriageDate(couple);
				var marriagePlace = getMarriagePlace(couple);
				var bdArr = [
				[['', preID + 'b'], splitDate(marriageDate)],
				[['', preID + 'b'], splitPlace(marriagePlace)]
				];

				var mWidth = reduceMarriage(bdArr, width);
				if (drawMarks) {
					rwCtx.setDrawStyle('blue', 'blue');
					rwCtx.drawLine(x - mWidth / 2, y, x + mWidth / 2, y);
				}
				// Draw Text marker Lines
				var offsetX = 0;
				var offsetY = 0;
				var rectABegin = [0, 0];
				rectABegin[0] = selectRects.length;
				var line = [''];	// build next text line to draw
				concatDate(bdArr[0], y, height, text[0], select);
				rectABegin[1] = selectRects.length;
				concatPlace(bdArr[1], y, height, text[1], select);
				var dW = rwCtx.textWidth(text[0]);
				var pW = rwCtx.textWidth(text[1]);
				var spW = rwCtx.textWidth(' ');
				var lineW = dW + pW;
				if (lineW === 0) {
					return y;
				}
				lineW += spW;
				if (lineW > width) {
					offsetX = x - (dW / 2);
					line[0] = text[0];
					rwCtx.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						offsetSelectRects(rectABegin[0], rectABegin[1], offsetX, offsetY);
					}
					offsetY += lineSpace;
					offsetX = x - (pW / 2);
					line[0] = text[1];
					rwCtx.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						offsetSelectRects(rectABegin[1], selectRects.length, offsetX, offsetY);
					}
					offsetY += lineSpace;
					return y + offsetY;
				}

				offsetX = x - (lineW / 2);
				line[0] = text[0] + ' ' + text[1];
				rwCtx.drawText(line[0], offsetX, y + offsetY);
				if (select) {
					offsetSelectRects(rectABegin[0], selectRects.length, offsetX, offsetY);
				}
				offsetY += lineSpace;
				return y + offsetY;
			};


			rwCtx.renderBirthDeath = function (person, preID, x, y, width, height, lineSpace, select) {
				var birthDate = getBirthDate(person);
				var birthPlace = getBirthPlace(person);
				var deathDate = getDeathDate(person);
				var deathPlace = getDeathPlace(person);

				// text string inside an array to pass as argument and modify
				var text = [[''], [''], [''], ['']];
				// create an array of identified regions for selection
				var sX = 0;		// scan x location text
				var i;		// in for loops
				ctx.textAlign = 'left';	// concatenate text parts from left to right
				if (birthDate.length <= 4 && deathDate.length <= 4) {
					if (birthPlace.length === 0 || deathPlace.length === 0 ||
						birthPlace === deathPlace) {
						// render byear-dyear place
						if (birthDate.length > 0 || deathDate.length > 0) {
							// Exists at least one date
							if (birthDate.length > 0) {
								var bW = rwCtx.concat(text[0], birthDate);
								if (select) {
									selectRects.push([preID + 'bY', rwCtx.rect(sX, y - height, bW, height)]);
								}
								sX += bW;
							}
							if (deathDate.length > 0) {
								sX += rwCtx.concat(text[0], '-');
								var dW = rwCtx.concat(text[0], deathDate);
								if (select) {
									selectRects.push([preID + 'dY', rwCtx.rect(sX, y - height, dW, height)]);
								}
								sX += dW;
							}
						}
						var idPfx = ''; // prefix to place
						var bdPrts;		// place parts
						var pW;		// textWidth of place
						if (birthPlace.length > 0 && deathPlace.length > 0) {
							idPfx = preID + 'bdP';
						} else if (birthPlace.length > 0) {
							idPfx = preID + 'bP';
						} else if (deathPlace.length > 0) {
							idPfx = preID + 'dP';
						}
						if (birthPlace.length > 0) {
							if (sX > 0) {
								sX += rwCtx.concat(text[0], ' ');
							}

							pW = rwCtx.textWidth(birthPlace);
							bdPrts = splitPlace(birthPlace);
						} else if (deathPlace.length > 0) {
							if (sX > 0) {
								sX += rwCtx.concat(text[0], ' ');
							}
							pW = rwCtx.textWidth(deathPlace);
							bdPrts = splitPlace(deathPlace);
						}
						var tW = sX + pW;
						if (tW > width) {
							pW -= reducePlace(bdPrts, tW - width);
							tW = sX + pW;
							if (tW > width) {
								sX -= rwCtx.trimLastChar(text);
								var offX = sX / 2;
								if (select) {
									offsetSelectRects(0, selectRects.length, offX, 0);
								}
								rwCtx.drawText(text[0][0], x - offX, y);
								y += lineSpace;
								text[0][0] = '';
								sX = 0;
							}
						}
						rwCtx.drawText(text[0][0], sX, y);
						if (select && idPfx !== '') {
							for (i = 0; i < bdPrts.length; i++) {
								var iWidth = rwCtx.textWidth(bdPrts[i]);
								if (iWidth > 0) {
									selectRects.push([idPfx + i, rwCtx.rect(sX, y - height, iWidth, height)]);
									sX += rwCtx.textWidth(', ');
								}
							}
						}
						return y + lineSpace;
					}
				}
				var ID = person.id;
				var bdArr = [
				[['BIRTH ', preID + 'b'], splitDate(birthDate)],
				[['', preID + 'b'], splitPlace(birthPlace)],
				[['DEATH ', preID + 'd'], splitDate(deathDate)],
				[['', preID + 'd'], splitPlace(deathPlace)]
				];

				var bdWidth = reduceBirthDeath(person, bdArr, ID, width);
				if (drawMarks) {
					var lineY = y;
					for (i = 0; i < bdWidth.length; i++) {
						rwCtx.setDrawStyle('blue', 'blue');
						rwCtx.drawLine(x - bdWidth[i] / 2, lineY, x + bdWidth[i] / 2, lineY);
						lineY += lineSpace;
					}
				}
				// Draw Text marker Lines
				var offsetX = 0;
				var offsetY = 0;
				var rectABegin = [0, 0, 0];
				var rab = 0;
				rectABegin[rab] = selectRects.length;
				var line = [''];	// build next text line to draw
				var lineW = 0;	// draw width of line

				for (i = 0; i < 4; i++) {
					rectABegin[i] = selectRects.length;
					if (i === 0 || i === 2) {
						concatDate(bdArr[i], y, height, text[i], select);
					} else {
						concatPlace(bdArr[i], y, height, text[i], select);
					}
					var thisW = rwCtx.textWidth(text[i]);
					if (thisW === 0) {
						continue;
					}
					if (thisW + lineW > width) {
						offsetX = x - (lineW / 2);
						rwCtx.trimLastChar(line);
						rwCtx.drawText(line[0], offsetX, y + offsetY);
						line[0] = '';
						lineW = 0;
						if (select) {
							offsetSelectRects(rectABegin[rab], rectABegin[i], offsetX, offsetY);
						}
						rab++;
						offsetY += lineSpace;
					}
					line[0] += text[i];
					lineW += thisW;
					lineW += rwCtx.concat(line, ' ');
				}
				var IDPrfx = '\u2022 ';
				if (lineW + rwCtx.textWidth(IDPrfx + ID) <= width) {
					lineW += rwCtx.concat(line, IDPrfx + ID);
					offsetX = x - lineW / 2;
					rwCtx.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						offsetSelectRects(rectABegin[rab], selectRects.length, offsetX, offsetY);
					}
				} else {
					lineW -= rwCtx.trimLastChar(line);
					offsetX = x - lineW / 2;
					rwCtx.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						offsetSelectRects(rectABegin[rab], selectRects.length, offsetX, offsetY);
					}
					offsetY += lineSpace;
					ctx.textAlign = 'center';
					rwCtx.drawText(IDPrfx + ID, x, y + offsetY);
				}
				offsetY += lineSpace;
				return y + offsetY;
			};

			rwCtx.renderChildren = function (seqGrp, children, x, y, secW, textY, fontSize, select) {
				var textHeight = rwCtx.setFontSize(fontSize);
				var lineSpace = textHeight * 0.6;
				var i;
				for (i = 0; i < children.length; i++) {
					var child = children[i].person;
					var childSelID = 'c' + i + seqGrp;
					textY = rwCtx.renderNameYear(child, childSelID, x, textY, secW, textHeight, lineSpace, select);
					textY += lineSpace;
				}
			};

			return rwCtx;
		}]);

})();