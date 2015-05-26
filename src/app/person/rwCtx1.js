(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');
	rwApp.factory('rwCtx1', ['$window', 'rwTxt', 'rwPpl', 'rwCtx2', 'rwSel',
		function ($window, rwTxt, rwPpl, rwCtx2, rwSel) {

			var canvas1;	// Canvas where information of all people and sources is displayed
			var ctx1;		// 2d context of canvas1
			var windowWidth;
			var windowHeight;
			var extraWidth;
			var extraHeight;
			var canvasWidth;
			var canvasHeight;
			var navbarHeight = 51;		// should be the same value set as canvas top in style.less
			var border = 3;				// should be the same value set as canvas border in style.less
			var familyName = '';
			var IDPrfx = ' \u2022 ';
			var drawArcs = false;
			var drawMarks = false;
			var actvPersonId;
			var rwCtx1 = {};

			console.log('start rwCtx1 factory');

			rwCtx1.drawSquare = function () {
				return !drawArcs;
			};


			Array.prototype.extend = function (otherArray) {
				otherArray.forEach(function (v) { this.push(v); }, this);
			};

			rwCtx1.drawMrks = function () {
				return drawMarks;
			};


			var initCanvas = function () {
				windowWidth = $window.innerWidth;
				windowHeight = $window.innerHeight;
				canvasWidth = windowWidth - 2 * border;
				canvasHeight = windowHeight - navbarHeight - 2 * border;
				if (drawArcs) {
					if (canvasWidth < 1.5 * canvasHeight) {
						canvasHeight = Math.round(canvasWidth / 1.5);
					} else {
						canvasWidth = Math.round(1.5 * canvasHeight);
					}
				}
				canvas1.width = canvasWidth;
				canvas1.height = canvasHeight;

				rwCtx2.setDim(canvasWidth,canvasHeight);
				
				extraWidth = windowWidth - canvasWidth - 2 * border;
				extraHeight = windowHeight - canvasHeight - 2 * border;
			};

			rwCtx1.setCanvas = function (cnvs) {
				canvas1 = cnvs;
				initCanvas();
			};

			rwCtx1.setContext = function (context) {
				ctx1 = context;
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================

			rwCtx1.lineWidth = function (width) {
				ctx1.lineWidth = width;
			};

			rwCtx1.setDrawStyle = function (fillColor, strokeColor) {
				ctx1.fillStyle = fillColor;
				ctx1.strokeStyle = strokeColor;
			};

			rwCtx1.drawRect = function (rect) {
				ctx1.strokeRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			rwCtx1.fillRect = function (rect) {
				ctx1.fillRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			rwCtx1.drawBox = function (rect) {
				rwCtx1.lineWidth(3);
				rwCtx1.fillRect(rect);
				rwCtx1.drawRect(rect);
			};

			rwCtx1.drawLine = function (x1, y1, x2, y2) {
				ctx1.beginPath();
				ctx1.moveTo(x1, y1);
				ctx1.lineTo(x2, y2);
				ctx1.stroke();
			};

			rwCtx1.drawDot = function (x, y) {
				rwCtx1.drawCircle(x, y, 1);
			};
			

			rwCtx1.drawCircle = function (centerX, centerY, radius) {
				ctx1.beginPath();
				ctx1.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx1.closePath();
				ctx1.fill();
				ctx1.stroke();
			};

			//========================================================================
			// draw text at x,y in ctx1

			rwCtx1.boldFont = function () {
				ctx1.font = 'bold ' + ctx1.font;
			};

			rwCtx1.normalFont = function () {
				ctx1.font = ctx1.font.replace('bold ','');
			};


			rwCtx1.drawText = function (text, x, y) {
				ctx1.fillStyle = 'black';
				ctx1.fillText(text, x, y);
				if (drawMarks) {
					rwCtx2.setDrawStyle('red1171red');
					rwCtx2.drawDot(x, y);
				}
			};


			//=================================================================================
			//=================================================================================
			// functions that manage the detail canvas:  ctx1
			//=================================================================================
			// return x dimension of a text segment using current settings
			rwCtx1.textWidth = function (text) {
				return ctx1.measureText(text).width;
			};

			rwCtx1.setTextStyle = function (fill, txtAlgn) {
				ctx1.fillStyle = fill;
				ctx1.textAlign = txtAlgn;
			};

			//==============================================================================
			// Trim the last character from textA[0] and return the width of the removed char
			rwCtx1.trimLastChar = function (textA, numberToTrim) {
				if (textA[0].length === 0) {
					return 0;
				}
				var tW = 0;		// total width of deleted characters
				if (rwTxt.isValid(numberToTrim)) {
					for (var i = textA[0].length - numberToTrim; i < textA[0].length; i++) {
						tW += rwCtx1.textWidth(textA[0].charAt(i));
					}
					textA[0] = textA[0].substring(0, textA[0].length - numberToTrim);
				} else {
					tW += rwCtx1.textWidth(textA[0].charAt(textA[0].length - 1));
					textA[0] = textA[0].substring(0, textA[0].length - 1);
				}
				return tW;
			};

			//========================================================
			// concat text to end of textA which is an array[0] 
			// of text string.  return the new text width.
			rwCtx1.concat = function (textA, text) {
				textA[0] += text;
				return rwCtx1.textWidth(text);
			};


			var reduceGivName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					for (;;) {
						reduced += rwCtx1.trimLastChar(name);
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
				rwCtx1.trimLastChar(givName);
				return reduced;
			};

			var reduceFamName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					reduced += rwCtx1.trimLastChar(name);
					if (reduced >= needToReduce) {
						if (i > 3) {
							rwCtx1.trimLastChar(name);
							rwCtx1.trimLastChar(name);
							rwCtx1.trimLastChar(name);
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
				rwCtx1.trimLastChar(givName);
				return reduced;
			};

			// Shorten name by stripping vowels and punctuation
			var stripInternalVowels = function (name) {	
				if (name === '') {
					return [0, ''];
				}
				var newName = name[0] + name.substring(1, name.length).
					replace(/[aeiouAEIOU\.,-\/#!$%\^&\*;:{}=\-_`~()\'\`]/g,'');
				return [rwCtx1.textWidth(name) - rwCtx1.textWidth(newName), newName];
			};

			var removeVowels = function (names, reduceW) {
				var totalReduced = 0;
				for (var i = names.length - 1; i >= 0; i--) {
					var result = stripInternalVowels(names[i]);
					totalReduced += result[0];
					names[i] = result[1];
					if (totalReduced >= reduceW) {
						break;
					}
				}
				return totalReduced;
			};

			var setToInitials = function (names, reduceW) {
				var totalReduced = 0;
				for (var i = names.length - 1; i >= 0; i--) {
					if (names[i] === '') {
						continue;
					}
					var nameW = rwCtx1.textWidth(names[i]);
					names[i] = names[i][0];
					var chrW = rwCtx1.textWidth(names[i]);
					totalReduced += nameW - chrW;
					if (totalReduced >= reduceW) {
						break;
					}
				}
				return totalReduced;
			};

			// To reduce the total name width,
			//		1. reduce the middle names by taking out internal vowels.
			//		2. reduce first name by taking out internal vowels
			//		3. reduce last name by taking out internal vowels
			//		4. reduce middle names to initials
			//		5. reduce last name to initial
			//		6. reduce first name to initial
			var reduceName = function (givName, famName, reduceW) {
				var name = '';
				var gparts = givName.split(' ');
				var fparts = famName.split(' ');
				var removedW = removeVowels(gparts,reduceW);
				if (removedW < reduceW) {
					removedW += removeVowels(fparts,reduceW - removedW);
					if (removedW < reduceW) {
						removedW += setToInitials(gparts,reduceW - removedW);
						if (removedW < reduceW) {
							removedW += setToInitials(fparts,reduceW - removedW);
						}
					}
				}
				givName = rwTxt.createLine(gparts);
				famName = rwTxt.createLine(fparts);
				var givW = rwCtx1.textWidth(givName);
				var famW = rwCtx1.textWidth(famName);
				if (givW > 0) {
					name = givName;
					if (famW > 0 ) {
						name += ' ' + famName;
					}
				} else if (famW > 0) {
					name = famName;
				}
				return [name,givW,famW];
			};


			

			

			//=============================================================
			// date[dayMonthStg,yearStg]]
			// txtX = [string]:	where the string is stored
			var reduceMonth = function(daymonth) {
				var startMonth = daymonth.search(/[A-za-z]/);
				return daymonth.substring(0,startMonth + 3);
			};

			var addDate = function (prefix, date, txtA) {
				if (!date) {
					return false;
				}
				if (rwTxt.isValid(date[0])) {
					txtA[0] += prefix;
					date[0] = reduceMonth(date[0]);
					txtA[0] += date[0];
					if (rwTxt.isValid(date[1])) {
						txtA[0] += ' ' + date[1];
					}
					txtA[0] += ' ';
				} else if (rwTxt.isValid(date[1])) {
					txtA[0] += prefix + date[1];
					txtA[0] += ' ';
				}
				return txtA[0].length > 0;
			};

			var addPlace = function (place, txtA) {
				if (!place) {
					return false;
				}
				var added = false;
				for (var i = 0; i < place.length; i++) {
					if (rwTxt.isValid(place[i])) {
						if (added) {
							txtA[0] += ', ';
						}
						txtA[0] += place[i];
						added = true;
					} else {
						break;
					}
				}
				return txtA[0].length > 0;
			};

			// 1. Remove vowels from inside word
			// 2. shorten word to first 3 characters
			var reducePart = function (subPlace, reduceW) {
				var parts = subPlace.split(' ');
				var results;
				subPlace = '';
				var totalReduced = 0;
				var widthBefore;
				var widthAfter;
				var abrv;
				if (parts.length > 1) {
					for (var i = 0; i < parts.length; i++) {
						if (totalReduced < reduceW) {
							results = stripInternalVowels(parts[i][0]);
							totalReduced += results[0];
							if (totalReduced < reduceW && results[1].length > 3) {
								widthBefore = rwCtx1.textWidth(results[1]);
								abrv = results[1].substring(0, 3);
								widthAfter = rwCtx1.textWidth(abrv);
								subPlace += abrv + ' ';
								totalReduced += widthBefore - widthAfter;
							} else {
								subPlace += results[1] + ' ';
							}
						} else {
							subPlace += parts[i] + ' ';
						}
					}
					subPlace = subPlace.substring(0,subPlace.length - 1);
				} else if (parts[0].length > 3) {
					results = stripInternalVowels(parts[0]);
					totalReduced += results[0];
					if (totalReduced < reduceW && results[1].length > 3) {
						widthBefore = rwCtx1.textWidth(results[1]);
						abrv = results[1].substring(0, 3);
						widthAfter = rwCtx1.textWidth(abrv);
						subPlace += abrv;
						totalReduced += widthBefore - widthAfter;
					} else {
						subPlace += results[1];
					}
				} else {
					subPlace = parts[0];
				}
				return [totalReduced, subPlace];
			};

			var reducePlace = function (place, reduceW) {
				// Work from the back to reduce
				var totalReduced = 0;
				var results;
				for (var i = place.length - 1; i >= 1; i--) {
					if (rwTxt.isValid(place[i])) {
						results = reducePart(place[i], reduceW - totalReduced);
						totalReduced += results[0];
						place[i] = results[1];
						if (totalReduced > reduceW) {
							return totalReduced;
						}
					}
				}
				while (place.length > 1) {
					var last = place.pop();
					totalReduced += rwCtx1.textWidth(last);
					if (totalReduced > reduceW) {
						return totalReduced;
					}
				}
				results = reducePart(place[0], reduceW - totalReduced);
				totalReduced += results[0];
				place[0] = results[1];
				return totalReduced;
			};

			var reduceMarriage = function (prefix, event, width) {
				var mText = [''];
				addDate(prefix, event.date, mText);
				if (!addPlace(event.place, mText)) {
					mText[0] = mText[0].substring(0, mText[0].length - 1);
				}
				var mW = rwCtx1.textWidth(mText[0]);
				if (mW > width) {
					mW -= reducePlace(event.place, mW - width);
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
			var reduceBirthDeath = function (birth, death, bPrefix, dPrefix, ID, width) {
				//var dittoChar = '\u2033';
				var bText = [''];
				if (birth) {
					addDate(bPrefix, birth.date, bText);
					if (!addPlace(birth.place, bText)) {
						bText[0] = bText[0].substring(0, bText[0].length - 1);
					}
				}
				var bW = rwCtx1.textWidth(bText[0]);
				var dText = [''];
				if (death) {
					addDate(dPrefix, death.date, dText);
					if (!addPlace(death.place, dText)) {
						dText[0] = dText[0].substring(0, dText[0].length - 1);
					}
					addPlace(death.date, dText);
				}
				var dW = rwCtx1.textWidth(dText[0]);
				var idW = rwCtx1.textWidth(ID);
				var bdText = bText[0] + ' ' + dText[0] + ID;
				var totalW = rwCtx1.textWidth(bdText);
				if (totalW > width) {
					if (bW > width) {
						bW -= reducePlace(birth.place, bW - width);
					}
					if (dW + idW > width) {
						dW -= reducePlace(death.place, dW + idW - width);
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

			var personLivingStatus = function(person) {
				return person.living ? 'Lvng' : 'Dcsd';
			};
			
			//==========================================================================================
			//==========================================================================================
			//  concat methods
			//==========================================================================================
			//   all concat methods return concatV[text,textWidth,startingSelectRectLocation]
			//==========================================================================================
			var idxTxt = 0;
			var idxW = 1;
			var idxSR = 2;
			// use these functions on foreach method on [concatV,...]
			var cWidth;
			var concatWidth = function (element) { cWidth += element[idxW]; };
			//==========================================================================================
			// concatDate - concat date parts into one text string
			var concatDate = function (prefix, date, preID, y, height, select) {
				if (!date || !rwTxt.isValid(date[0]) && !rwTxt.isValid(date[1])) {
					return undefined;
				}
				var textA = [''];
				var locX = rwCtx1.concat(textA,prefix);
				var startSel = rwSel.nextSR();
				var mW = rwCtx1.concat(textA,date[0]);
				if (mW > 0) {
					if (select) {
						rwSel.pushSR([preID + 'M', rwCtx1.rect(locX, y - height, mW, height)]);
					}
					locX += mW;
					locX += rwCtx1.concat(textA, ' ');
				}
				var yW = rwCtx1.concat(textA,date[1]);
				if (yW > 0) {
					if (select) {
						rwSel.pushSR([preID + 'Y', rwCtx1.rect(locX, y - height, yW, height)]);
					}
					locX += yW;
				} else {
					locX -= rwCtx1.trimLastChar(textA);
				}
				return [textA[0],locX,startSel];
			};
			//==========================================================================================
			//	concatPlace: concat the place array into one text string
			var concatPlace = function (place, preID, y, height, select) {
				if (!place) {
					return undefined;
				}
				var foundValid = false;
				var startSel = rwSel.nextSR();
				var i;
				for (i = 0; i < place.length; i++) {
					if (rwTxt.isValid(place[i])) {
						foundValid = true;
						break;
					}
				}
				if (!foundValid) {
					return undefined;
				}
				var locX = 0;
				var textA = [''];
				for (i = 0; i < place.length; ++i) {
					var iW = rwCtx1.concat(textA, place[i]);
					if (iW > 0) {
						if (select) {
							rwSel.pushSR([preID + 'P' + i, rwCtx1.rect(locX, y - height, iW, height)]);
						}
						locX += iW;
						locX += rwCtx1.concat(textA, ', ');
					}
				}
				locX -= rwCtx1.trimLastChar(textA, 2);
				return [textA[0],locX,startSel];
			};
			//==========================================================================================
			// concat - 'birthYear-deathYear'
			var concatBirthDeathYears = function(person,preID,y,height,select) {
				var locX = 0;
				var text = '';
				var startSel = rwSel.nextSR();
				var width = 0;
				var birthYear = rwPpl.year(person.birth);
				if (birthYear) {
					text = birthYear;
					var bYW = rwCtx1.textWidth(birthYear);
					if (select) {
						rwSel.pushSR([preID + 'bY', rwCtx1.rect(locX, y - height, bYW, height)]);
					}
					width += bYW;
				} else {
					text = '?';
					width += rwCtx1.textWidth(text);
				}
				var separator = '-';
				text += separator;
				width += rwCtx1.textWidth(separator);
				locX += width;
				var deathYear = rwPpl.year(person.death);
				if (deathYear) {
					text += deathYear;
					var dYW = rwCtx1.textWidth(deathYear);
					if (select) {
						rwSel.pushSR([preID + 'dY', rwCtx1.rect(locX, y - height, dYW, height)]);
					}
					width += dYW;
				} else {
					var status = personLivingStatus(person);
					text += status;
					width += rwCtx1.textWidth(status);
				}
				return [text,width,startSel];
			};



			var getWidth = function () {
				return $window.innerWidth; //  || $document.documentElement.clientWidth || $document.body.clientWidth;
			};

			var getHeight = function () {
				return $window.innerHeight; // $window.innerHeight || $document.documentElement.clientHeight || $document.body.clientHeight;
			};


			

			var canvasResize = function () {
				var resized = false;
				if (windowWidth !== getWidth() || windowHeight !== getHeight()) {
					initCanvas();
					resized = true;
				}
				return resized;
			};

			var drawInfoArc = function (centerX, centerY, outerRadius, innerRadius, startAngle, endAngle) {
				ctx1.beginPath();
				ctx1.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
				ctx1.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
				ctx1.closePath();
				ctx1.fill();
				ctx1.stroke();
			};

			//========================================================
			// create an x,y point
			rwCtx1.point = function (x, y) {
				return {
					x: x,
					y: y
				};
			};

			//========================================================
			// create rectangle object which consists of an x,y location (loc)
			// and a delta x,y width and length (d).
			rwCtx1.rectangle = function (x, y, width, height) {
				var shrink = function (dim) {
					this.loc.x += dim;
					this.loc.y += dim;
					this.d.x -= 2 * dim;
					this.d.y -= 2 * dim;
				};

				var centerX = function () {
					return this.loc.x + this.d.x / 2;
				};

				var centerY = function () {
					return this.loc.x + this.d.x / 2;
				};

				var left = function () {
					return this.loc.x;
				};

				var right = function () {
					return this.loc.x + this.d.x;
				};

				var top = function () {
					return this.loc.y;
				};

				var bottom = function () {
					return this.loc.y + this.d.y;
				};

				return {
					
					shrink: shrink,
					centerY: centerY,
					centerX: centerX,
					left: left,
					right: right,
					top: top,
					bottom: bottom,
					loc: rwCtx1.point(x, y),
					d: rwCtx1.point(width, height)
				};
			};

			//========================================================
			// return bounding rectangle for a text segment using
			// left X postion of text.  Y placement, width of text and
			// height of text.
			rwCtx1.rect = function (leftX, locY, width, height) {
				var growTxtR = 0.1 * height;
				return rwCtx1.rectangle(leftX - growTxtR, locY + 0.2 * height - growTxtR, width + 2 * growTxtR, height + 2 * growTxtR);
			};

			


			//==================================================
			// return amount to shrink text lines base on current
			// font settings
			rwCtx1.shrinkW = function () {
				return rwCtx1.textWidth('XX');
			};

			var personColors = function (gender) {
				var maleCardColor = '#AACBDA';
				var femaleCardColor = '#EFBFBF';
				var UnknownColor = '#C5C5C5';
				if (gender === 'U') {
					return ['#C2C2C2', '#656565', UnknownColor];
				} else if (gender === 'M') {
					return ['#8BA4C3', '#546376', maleCardColor];
				} else if (gender === 'F') {
					return ['#C38BB7', '#74536D', femaleCardColor];
				}
			};

			var setUnattachedSourcesColors = function()
			{
				rwCtx1.setDrawStyle('#C3AD82', '#7F7155');
			};

			var setAttachedSourcesColors = function()
			{
				rwCtx1.setDrawStyle('#40AD82', '#2B7420');
			};

			rwCtx1.drawBackground = function (personId) {
				canvasResize();
				actvPersonId = personId;
				ctx1.lineWidth = 1;
				var edgeWidth = 5;
				var person;
				var colors;
				if (drawArcs) {
					var centerX = canvasWidth / 2;
					var centerY = 0.75 * canvasHeight;
					var UAStartAngle = Math.PI - 0.34;
					var UAEndAngle = 0.34;
					// Radius values for unattached sources
					var UAOuterRadius = 0.75 * canvasHeight - 3;
					var thickness = UAOuterRadius/3;
					var UAInnerRadius = UAOuterRadius - thickness;
				
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
					setUnattachedSourcesColors();
					drawInfoArc(centerX, centerY, UAOuterRadius, UAInnerRadius, UAStartAngle, UAEndAngle);
					setAttachedSourcesColors();
					drawInfoArc(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle);
					//var gender = person.$getDisplayGender();
					// set background color according to gender
					
					person = rwPpl.getPerson(personId);
					colors = personColors(person.gender);
					rwCtx1.setDrawStyle(colors[0], colors[1]);
					rwCtx1.drawCircle(centerX, centerY, PRadius);
					rwCtx1.setDrawStyle(colors[2], colors[2]);
					rwCtx1.drawCircle(centerX, centerY, PRadius - edgeWidth);
					return {
						edgeRadius: UAOuterRadius,
						centerRadius: outerRadius,
						innerRadius: PRadius,
						x: centerX,
						y: centerY
					};
				} else {
					var dimensionY = (canvasHeight) / 4;
					var dimensionX = (canvasWidth) / 7;
					var outerBox = rwCtx1.rectangle(0, 0, canvasWidth, canvasHeight);
					var innerBox = rwCtx1.rectangle(outerBox.loc.x + dimensionX, outerBox.loc.y + dimensionY,
											outerBox.d.x - 2 * dimensionX,outerBox.d.y - dimensionY);
					var personBox = rwCtx1.rectangle(innerBox.loc.x + dimensionX, innerBox.loc.y + dimensionY,
											innerBox.d.x - 2 * dimensionX,innerBox.d.y - dimensionY);
					setUnattachedSourcesColors();
					rwCtx1.drawBox(outerBox);
					setAttachedSourcesColors();
					rwCtx1.drawBox(innerBox);
					person = rwPpl.getPerson(personId);
					if (!person) {
						$window.alert('No person found for: ' + personId);
					}
					var gender = (!person || !person.gender) ? 'U' : person.gender;
					colors = personColors(gender);
					rwCtx1.setDrawStyle(colors[0], colors[1]);
					rwCtx1.drawBox(personBox);
					personBox.shrink(edgeWidth);
					rwCtx1.setDrawStyle(colors[2], colors[2]);
					rwCtx1.drawBox(personBox);
					return {
						unAttBox: outerBox,
						attBox:	innerBox,
						persBox: personBox,
						indent:	20
					};
				}
			};

			rwCtx1.setFontSize = function (fontSize) {
				ctx1.font = fontSize + 'px Arial';
				return fontSize * 1.2;
			};



			//=================================================================================
			// renderName - draw name of person centered on canvas at location x,y  The max line
			//				width is width and character height is height.  If name is too
			//				long to fit on one line then draw on two lines.  If name will
			//				not fit on two lines then reduce name to fit and draw on two lines.
			rwCtx1.renderName = function (person, preID, x, y, width, height, lineSpace, select) {
				var famName = person.name[1];
				if (preID === 'R') {
					familyName = famName;
				}
				var givName = person.name[0];
				var fullName = givName + ' ' + famName;
				var givWidth = rwCtx1.textWidth(givName);
				var famWidth = rwCtx1.textWidth(famName);
				var fullW = rwCtx1.textWidth(fullName);
				var nextSR;
				if (select) {
					nextSR = rwSel.nextSR();
				}
				if (width >= fullW) {
					rwCtx1.drawText(fullName, x, y);
					if (select) {
						rwSel.pushSR([preID + 'nG', rwCtx1.rect(x - fullW / 2, y - height, givWidth, height)]);
						rwSel.pushSR([preID + 'nF', rwCtx1.rect(x + fullW / 2 - famWidth, y - height, famWidth, height)]);
					}
					return y + lineSpace;
				} else {
					// Name is too long.	Split on two lines
					var nextY = y + lineSpace;	// positive y is down
					if (width >= givWidth) {
						rwCtx1.drawText(givName, x, y);
						rwCtx1.drawText(famName, x, nextY);
						if (select) {
							rwSel.pushSR([preID + 'RnG', rwCtx1.rect(x - givWidth / 2, y, givWidth, height)]);
							rwSel.pushSR([preID + 'nF', rwCtx1.rect(x - famWidth / 2, y - lineSpace, famWidth, height)]);
						}
						return y + lineSpace * 2;
					} else {
						// Name is too long to fit on two lines
						var neededSpace = givWidth - width;
						var gname = [givName];
						reduceGivName(gname, neededSpace);
						givName = gname[0];
						rwCtx1.drawText(givName, x, y);
						givWidth = rwCtx1.textWidth(givName);
						if (famWidth > width) {
							neededSpace = famWidth - width;
							famName = reduceFamName(famName, neededSpace);
							famWidth = rwCtx1.textWidth(famName);
						}
						rwCtx1.drawText(' ' + famName, x, y);
						if (select) {
							rwSel.pushSR([preID + 'nG', rwCtx1.rect(x - width / 2, y, givWidth, height)]);
							rwSel.pushSR([preID + 'nF', rwCtx1.rect(x - width / 2, nextY, famWidth, height)]);
						}
						return y + lineSpace * 2;
					}
				}
			};
			//=============================================================================================
			// renderNameYear  draw then persons name and birth year
			//			start person name at left edge and birth year at right edge
			//			reduce so it will fit within width
			rwCtx1.renderNameYear = function (person, preID, x, y, width, height, lineSpace, select) {
				if (!person) {
					return y;
				}
				ctx1.textAlign = 'left';
				var maxYearW = rwCtx1.textWidth('4444');
				var spWidth = rwCtx1.textWidth(' ');
				var maxNameW = width - maxYearW - spWidth;
				var startName = x - width / 2;		// left edge of name
				var startYear = x + width / 2 - maxYearW;
				var famName = person.name[1];
				var givName = person.name[0];
				var name;
				if (famName.toLowerCase() === familyName.toLowerCase() && givName !== '') {
					famName = '';
					name = givName;
				} else {
					name = rwTxt.createLine([givName, famName]);
				}
				var nameW = rwCtx1.textWidth(name);
				var givW;
				var famW;
				if (nameW > maxNameW) {
					var result = reduceName(givName, famName, nameW - maxNameW);
					name = result[0];
					nameW = rwCtx1.textWidth(name);
					givW = result[1];
					famW = result[2];
				} else {
					givW = rwCtx1.textWidth(givName);
					famW = rwCtx1.textWidth(famName);
				}
				rwCtx1.drawText(name, startName, y);
				if (select && givW > 0) {
					if (givW > 0) {
						rwSel.pushSR([preID + 'nG', rwCtx1.rect(startName, y - height, givW, height)]);
					}
					if (famW > 0) {
						rwSel.pushSR([preID + 'nF', rwCtx1.rect(startName + nameW - famW, y - height, famW, height)]);
					}
				}
				if (rwPpl.noEvent(person.birth)) {
					rwCtx1.drawText(personLivingStatus(person), startYear, y);
					return y + lineSpace;
				}
				var birthYear = rwPpl.year(person.birth);
				if (birthYear) {
					rwCtx1.drawText(birthYear, startYear, y);
					if (select) {
						rwSel.pushSR([preID + 'bY', rwCtx1.rect(startYear, y - height, maxYearW, height)]);
					}
				} else {
					rwCtx1.drawText(personLivingStatus(person), startYear, y);
				}
				return y + lineSpace;
			};

			//=============================================================================================
			// renderNameYearPl  draw then persons name and birth year and birth place
			//			start at left edge determined by half width left of x
			//			reduce so it will fit on one line.
			rwCtx1.renderNameYearPl = function (person, preID, x, y, width, height, lineSpace, select) {
				if (!person) {
					return y;
				}
				ctx1.textAlign = 'left';
				var maxNameW = width / 3;
				var maxYearW = rwCtx1.textWidth('4444');
				var spWidth = rwCtx1.textWidth(' ');
				var maxPlaceW = width - maxNameW - maxYearW - 2 * spWidth;
				var startName = x - width / 2;		// left edge of name
				var startYear = startName + maxNameW + spWidth;
				var startPlace = startYear + maxYearW + spWidth;
				var famName = person.name[1];
				var givName = person.name[0];
				var name;
				if (famName.toLowerCase() === familyName.toLowerCase() && givName !== '') {
					famName = '';
					name = givName;
				} else {
					name = rwTxt.createLine([givName, famName]);
				}
				if (person.id === actvPersonId) {
					rwCtx1.boldFont();
				}
				var nameW = rwCtx1.textWidth(name);
				var givW;
				var famW;
				if (nameW > maxNameW) {
					var result = reduceName(givName, famName, nameW - maxNameW);
					name = result[0];
					nameW = rwCtx1.textWidth(name);
					givW = result[1];
					famW = result[2];
				} else {
					givW = rwCtx1.textWidth(givName);
					famW = rwCtx1.textWidth(famName);
				}
				rwCtx1.drawText(name, startName, y);

				if (select && givW > 0) {
					if (givW > 0) {
						rwSel.pushSR([preID + 'nG', rwCtx1.rect(startName, y - height, givW, height)]);
					}
					if (famW > 0) {
						rwSel.pushSR([preID + 'nF', rwCtx1.rect(startName + nameW - famW, y - height, famW, height)]);
					}
				}
				if (person.id === actvPersonId) {
					rwCtx1.normalFont();
				}
				if (rwPpl.noEvent(person.birth)) {
					rwCtx1.drawText(personLivingStatus(person), startYear, y);
					return y + lineSpace;
				}
				var birthYear = rwPpl.year(person.birth);
				if (birthYear) {
					rwCtx1.drawText(birthYear, startYear, y);
					if (select) {
						rwSel.pushSR([preID + 'bY', rwCtx1.rect(startYear, y - height, maxYearW, height)]);
					}
				} else {
					rwCtx1.drawText(personLivingStatus(person), startYear, y);
				}
				var plcText = [''];
				addPlace(person.birth.place, plcText);
				var plcW = rwCtx1.textWidth(plcText);
				if (plcW > 0) {
					var place = person.birth.place.slice(0);
					if (plcW > maxPlaceW) {
						reducePlace(place, plcW - maxPlaceW);
					}
					plcText = [''];
					addPlace(place,plcText);
					rwCtx1.drawText(plcText[0], startPlace, y);
					if (select) {
						var locX = startPlace;
						var cspW = rwCtx1.textWidth(', ');
						for (var i = 0; i < place.length; i++) {
							if (place[i] === '') {
								break;
							} else {
								var subPlW = rwCtx1.textWidth(place[i]);
								rwSel.pushSR([preID + 'bP' + i, rwCtx1.rect(locX, y - height, subPlW, height)]);
								locX += subPlW + cspW;
							}
						}
					}
				}
				return y + lineSpace;
			};

			rwCtx1.renderMarriage = function (MarriageEvent, preID, x, y, width, height, lineSpace, select) {
				if (rwPpl.noEvent(MarriageEvent)) {
					ctx1.textAlign = 'center';
					rwCtx1.drawText('No Cple Rltnshp', x, y);
					return y + lineSpace;
				}
				ctx1.textAlign = 'left';	// concatenate text parts from left to right
				var event = rwPpl.copyEvent(MarriageEvent);
				var mWidth = reduceMarriage('',event, width);
				if (drawMarks) {
					rwCtx2.setDrawStyle('blue', 'blue');
					rwCtx2.drawLine(x - mWidth / 2, y, x + mWidth / 2, y);
				}
				// Draw Text marker Lines
				var offsetX = 0;
				var offsetY = 0;
				var concatParts = [];
				var concatValue;
				if (event.date) {
					concatValue = concatDate('', event.date, preID, y, height, select);
					if (concatValue) {
						concatParts.push(concatValue);
					}
				}
				if (event.place) {
					concatValue = concatPlace(event.place, preID, y, height, select);
					if (concatValue) {
						concatParts.push(concatValue);
					}
				}
				if (concatParts.length === 0) {
					// no date or place
					return y;
				}
				var spW = rwCtx1.textWidth(' ');
				cWidth = 0;
				concatParts.forEach(concatWidth);
				var lineW = cWidth + spW;
				var makeTwoLines = lineW > width;
				offsetX = makeTwoLines ? x - (concatParts[0][idxW] / 2) : x - (lineW / 2);		
				rwCtx1.drawText(concatParts[0][idxTxt], offsetX, y + offsetY);
				if (select) {
					rwSel.offsetSelectRects(concatParts[0][idxSR], concatParts[1][idxSR], offsetX, offsetY);
				}
				offsetY += makeTwoLines ? lineSpace : 0;
				offsetX = makeTwoLines ? x - (concatParts[1][idxW] / 2) : offsetX + concatParts[0][idxW] + spW;
				rwCtx1.drawText(concatParts[1][idxTxt], offsetX, y + offsetY);
				if (select) {
					rwSel.offsetSelectRects(concatParts[1][idxSR], rwSel.nextSR(), offsetX, offsetY);
				}
				offsetY += lineSpace;
				return y + offsetY;
			};

			var samePlace = function (event1, event2) {
				if (rwPpl.noPlace(event1) || rwPpl.noPlace(event2)) {
					return false;
				}
				if (event1.place.length === event2.place.length) {
					var same = true;
					for (var i = 0; i < event1.length; i++) {
						if (event1.place[i] !== event2.place[i]) {
							same = false;
							break;
						}
					}
					return same;
				}
				return false;
			};

/* unused
			var placeWidth = function (event) {
				var width = 0;
				if (rwPpl.noPlace(event)) {
					return width;
				}
				for (var i = 0; i < event.place.length; i++) {
					width += rwCtx1.textWidth(event.place[i]);
				}
				width += rwCtx1.textWidth(', ') * event.place.length - 1;
				return width;
			};


			var copyPlace = function (event) {
				if (rwPpl.noPlace(event)) {
					return undefined;
				}
				var result = [];
				for (var i = 0; i < event.place.length; i++) {
					result.push(event.place[i]);
				}
				return result;
			};

			var copyDate = function (event) {
				if (rwPpl.noDate(event)) {
					return undefined;
				}
				var result = [];
				for (var i = 0; i < event.date.length; i++) {
					result.push(event.date[i]);
				}
				return result;
			};
*/
			// render txt centered about x at y;
			var renderTxt = function(txt,x,y,lineSpace) {
				var offsetX = x - rwCtx1.textWidth(txt)/2;
				rwCtx1.drawText(txt, offsetX, y);
				return y + lineSpace;
			};


			rwCtx1.renderBirthDeath = function (person, preID, x, y, width, height, lineSpace, select) {
				ctx1.textAlign = 'left';	// concatenate text parts from left to right
				var ID = IDPrfx + person.id;
				if (!person.birth && !person.death) {
					// No birth death information
					return renderTxt(personLivingStatus(person) + ID, x, y, lineSpace);
				}
				// concatParts = [[text,width,startSR],...]
				var concatParts = [];
				var offsetX = 0;
				var birth = rwPpl.copyEvent(person.birth);
				var death = rwPpl.copyEvent(person.death);
				// create an array of identified regions for selection
				var offsetY = 0;
				var spW = rwCtx1.textWidth(' ');	// Width of space char
				var lineW = 0;	// draw width of line
				var idW = rwCtx1.textWidth(ID);
				var i;		// in for loops
				if (rwPpl.noMonth(birth) && rwPpl.noMonth(death)) {
					// all we have are years for birth and death dates
					var noPlace = rwPpl.noPlace(birth) && rwPpl.noPlace(death);
					var noYear = rwPpl.noYear(birth) && rwPpl.noYear(death);
					if (noYear) {
						if (noPlace) {
							// No birth death information
							return renderTxt(person.id, x, y, lineSpace);
						}
						// No dates but places -- render normal
					} else {
						// years only
						var sameBDPlace = (birth && death) ? samePlace(birth.place, death.place) : false;
						if (noPlace || sameBDPlace) {
							concatParts.push(concatBirthDeathYears(person, preID, y, select));
							if (sameBDPlace) {
								concatParts.push(concatPlace(person.place, preID + 'xY', y, height, select));
								lineW = concatParts[0][idxW] + idW + spW + concatParts[0][idxW];
								if (lineW > width) {
									// render on two lines
									offsetX = x - (concatParts[0][idxW] + idW) / 2;
									rwCtx1.drawText(concatParts[0][idxTxt] + ID, offsetX, y);
									if (select) {
										rwSel.offsetSelectRects(0, concatParts[1][idxSR], offsetX, 0);
									}
									y += lineSpace;
									offsetX = x - concatParts[1][idxW] / 2;
									rwCtx1.drawText(concatParts[1][idxTxt], offsetX, y);
									if (select) {
										rwSel.offsetSelectRects(concatParts[1][idxSR], rwSel.nextSR(), offsetX, lineSpace);
									}
								} else {
									// render on one line
									offsetX = x - lineW / 2;
									var text = concatParts[0][idxTxt] + ' ' + concatParts[1][idxTxt] + ID;
									rwCtx1.drawText(text, offsetX, y);
									if (select) {
										rwSel.offsetSelectRects(0, concatParts[1][idxSR], offsetX, 0);
										offsetX += concatParts[0][idxW] + spW;
										rwSel.offsetSelectRects(concatParts[2][idxSR], rwSel.nextSR(), offsetX, 0);
									}
								}
							} else {
								// years only to render
								offsetX = x - (concatParts[0][idxW] + idW) / 2;
								rwCtx1.drawText(concatParts[0][idxTxt] + ID, offsetX, y);
								if (select) {
									rwSel.offsetSelectRects(0, rwSel.nextSR(), offsetX, 0);
								}
							}
							return y + lineSpace;
						}
						// years only but different birth and death places render normally
					}
				}
					
				
				var bdWidth = reduceBirthDeath(birth, death,'BIRTH ','DEATH ',ID, width);
				if (drawMarks) {
					// Draw Text marker Lines
					var lineY = y;
					for (i = 0; i < bdWidth.length; i++) {
						rwCtx2.setDrawStyle('blue', 'blue');
						rwCtx2.drawLine(x - bdWidth[i] / 2, lineY, x + bdWidth[i] / 2, lineY);
						lineY += lineSpace;
					}
				}
				
				var rab = 0;
				var line = [''];	// text line
				var concatValue;
				if (birth) {
					if (birth.date) {
						concatValue = concatDate('BIRTH ', birth.date, preID, y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
					if (birth.place) {
						concatValue = concatPlace(birth.place, preID, y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
				}
				if (death) {
					if (death.date) {
						concatValue = concatDate('DEATH ', death.date, preID, y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
					if (death.place) {
						concatValue = concatPlace(death.place, preID, y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
				}
				lineW = 0;
				for (i = 0; i < concatParts.length; i++) {
					var thisW = concatParts[i][idxW];
					if (thisW + lineW > width) {
						if (lineW > 0) {
							offsetX = x - (lineW / 2);
							rwCtx1.trimLastChar(line);
							rwCtx1.drawText(line[0], offsetX, y + offsetY);
							line[0] = '';
							lineW = 0;
							if (select) {
								rwSel.offsetSelectRects(concatParts[rab][idxSR], concatParts[i][idxSR], offsetX, offsetY);
							}
							rab = i;
							offsetY += lineSpace;
						}  else {
							$window.alert('line segment does not fit: ' + concatParts[i][idxTxt]);
						}
					} else {
						// fits.  Shift this text to end of line
						if (select && lineW > 0) {
							var endSR = (i < concatParts.length - 1) ? concatParts[i + 1][idxSR] : rwSel.nextSR();
							rwSel.offsetSelectRects(concatParts[i][idxSR], endSR, lineW, 0);
						}
					}
					line[0] += concatParts[i][idxTxt];
					lineW += thisW;
					lineW += rwCtx1.concat(line, ' ');
				}
				if (lineW + rwCtx1.textWidth(ID) <= width) {
					// render entire line
					lineW += rwCtx1.concat(line, ID);
					offsetX = x - lineW / 2;
					rwCtx1.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						// Offset this entire line to center start point
						rwSel.offsetSelectRects(concatParts[rab][idxSR], rwSel.nextSR(), offsetX, offsetY);
					}
				} else {
					lineW -= rwCtx1.trimLastChar(line);
					offsetX = x - lineW / 2;
					rwCtx1.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						rwSel.offsetSelectRects(concatParts[rab][idxSR], rwSel.nextSR(), offsetX, offsetY);
					}
					offsetY += lineSpace;
					ctx1.textAlign = 'center';
					rwCtx1.drawText(ID, x, y + offsetY);
				}
				offsetY += lineSpace;
				return y + offsetY;
			};

			rwCtx1.renderChildren = function (children, seqGrp, x, y, secW, textY, fontSize, select) {
				if (!children) {
					return;
				}
				var textHeight = rwCtx1.setFontSize(fontSize);
				var lineSpace = textHeight * 0.6;
				var i;
				for (i = 0; i < children.length; i++) {
					var childId = children[i];
					var child = rwPpl.getPerson(childId);
					var childSelID = seqGrp[1] + i + seqGrp[0];
					textY = rwCtx1.renderNameYearPl(child, childSelID, x, textY, secW, textHeight, lineSpace, select);
					textY += lineSpace;
				}
			};

			return rwCtx1;
		}]);

})();