(function () {
	'use strict';
	var slApp = angular.module('sourceLink');
	slApp.factory('slCtx1', ['$window', 'slTxt', 'slPpl', 'slCtx2', 'slSel', 'slCtry', 'slGeom', 'alert',
		function ($window, slTxt, slPpl, slCtx2, slSel, slCtry, slGeom, alert) {

			var canvas1; // Canvas where information of all people and sources is displayed
			var ctx1;	// 2d context of canvas1
			var windowWidth;
			var windowHeight;
			var extraWidth;
			var extraHeight;
			var canvasWidth;
			var canvasHeight;
			var navbarHeight = 51;	// should be the same value set as canvas top in style.less
			var border = 3;			// should be the same value set as canvas border in style.less
			var familyName = '';
			var IDPrfx = ' \u2022 ';
			var drawMarks = false;
			var actvPersonId;
			var slCtx1 = {};


			Array.prototype.extend = function (otherArray) {
				otherArray.forEach(function (v) { this.push(v); }, this);
			};

			slCtx1.drawMrks = function () {
				return drawMarks;
			};


			var initCanvas = function () {
				windowWidth = $window.innerWidth;
				windowHeight = $window.innerHeight;
				canvasWidth = windowWidth - 2 * border;
				canvasHeight = windowHeight - navbarHeight - 2 * border;
				canvas1.width = canvasWidth;
				canvas1.height = canvasHeight;

				slCtx2.setDim(canvasWidth, canvasHeight);

				extraWidth = windowWidth - canvasWidth - 2 * border;
				extraHeight = windowHeight - canvasHeight - 2 * border;
			};

			slCtx1.setCanvas = function (cnvs) {
				canvas1 = cnvs;
				initCanvas();
			};

			slCtx1.setContext = function (context) {
				ctx1 = context;
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================

			slCtx1.lineWidth = function (width) {
				ctx1.lineWidth = width;
			};

			slCtx1.setDrawStyle = function (fillColor, strokeColor) {
				ctx1.fillStyle = fillColor;
				ctx1.strokeStyle = strokeColor;
			};

			slCtx1.drawRect = function (rect) {
				ctx1.strokeRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			slCtx1.fillRect = function (rect) {
				ctx1.fillRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			slCtx1.drawBox = function (rect) {
				slCtx1.lineWidth(3);
				slCtx1.fillRect(rect);
				slCtx1.drawRect(rect);
			};

			slCtx1.drawLine = function (x1, y1, x2, y2) {
				ctx1.beginPath();
				ctx1.moveTo(x1, y1);
				ctx1.lineTo(x2, y2);
				ctx1.stroke();
			};

			slCtx1.drawDot = function (x, y) {
				slCtx1.drawCircle(x, y, 1);
			};


			slCtx1.drawCircle = function (centerX, centerY, radius) {
				ctx1.beginPath();
				ctx1.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx1.closePath();
				ctx1.fill();
				ctx1.stroke();
			};

			//========================================================================
			// draw text at x,y in ctx1

			slCtx1.boldFont = function () {
				ctx1.font = 'bold ' + ctx1.font;
			};

			slCtx1.normalFont = function () {
				ctx1.font = ctx1.font.replace('bold ', '');
			};


			slCtx1.drawText = function (text, x, y) {
				ctx1.fillStyle = 'black';
				ctx1.fillText(text, x, y);
				if (drawMarks) {
					slCtx2.setDrawStyle('red1171red');
					slCtx2.drawDot(x, y);
				}
			};


			//=================================================================================
			//=================================================================================
			// functions that manage the detail canvas:  ctx1
			//=================================================================================
			// return x dimension of a text segment using current settings
			slCtx1.textWidth = function (text) {
				return ctx1.measureText(text).width;
			};

			slCtx1.setTextStyle = function (fill, txtAlgn) {
				ctx1.fillStyle = fill;
				ctx1.textAlign = txtAlgn;
			};

			//==============================================================================
			// Trim the last character from textA[0] and return the width of the removed char
			slCtx1.trimLastChar = function (textA, numberToTrim) {
				if (textA[0].length === 0) {
					return 0;
				}
				var tW = 0;	// total width of deleted characters
				if (slTxt.isValid(numberToTrim)) {
					for (var i = textA[0].length - numberToTrim; i < textA[0].length; i++) {
						tW += slCtx1.textWidth(textA[0].charAt(i));
					}
					textA[0] = textA[0].substring(0, textA[0].length - numberToTrim);
				} else {
					tW += slCtx1.textWidth(textA[0].charAt(textA[0].length - 1));
					textA[0] = textA[0].substring(0, textA[0].length - 1);
				}
				return tW;
			};

			//========================================================
			// concat text to end of textA which is an array[0] 
			// of text string.  return the new text width.
			slCtx1.concat = function (textA, text) {
				textA[0] += text;
				return slCtx1.textWidth(text);
			};

			// return dayMonth string: '1 Jan' of date
			var dayMonth = function(date) {
				var retVal = '';
				if (date[0] > 0 && date[1] > 0) {
					retVal += date[0] + ' ' + slTxt.abbrMonth(date[1] - 1);
				}
				return retVal;
			};

			var year = function(date) {
				if (date && date.length > 2) {
					return date[2].toString();
				}
				return '';
			};


			var reduceGivName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					for (; ; ) {
						reduced += slCtx1.trimLastChar(name);
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
				slCtx1.trimLastChar(givName);
				return reduced;
			};

			var reduceFamName = function (givName, needToReduce) {
				var parts = givName[0].split(' ');
				var i;
				var reduced = 0;
				for (i = parts.length - 1; i >= 0; i--) {
					var name = [parts[i]];
					reduced += slCtx1.trimLastChar(name);
					if (reduced >= needToReduce) {
						if (i > 3) {
							slCtx1.trimLastChar(name);
							slCtx1.trimLastChar(name);
							slCtx1.trimLastChar(name);
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
				slCtx1.trimLastChar(givName);
				return reduced;
			};

			// Shorten name by stripping vowels and punctuation
			var stripInternalVowels = function (name) {
				if (name === '') {
					return [0, ''];
				}
				var newName = name[0] + name.substring(1, name.length).
					replace(/[aeiouAEIOU\.,-\/#!$%\^&\*;:{}=\-_`~()\'\`]/g, '');
				return [slCtx1.textWidth(name) - slCtx1.textWidth(newName), newName];
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
					var nameW = slCtx1.textWidth(names[i]);
					names[i] = names[i][0];
					var chrW = slCtx1.textWidth(names[i]);
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
				var removedW = removeVowels(gparts, reduceW);
				if (removedW < reduceW) {
					removedW += removeVowels(fparts, reduceW - removedW);
					if (removedW < reduceW) {
						removedW += setToInitials(gparts, reduceW - removedW);
						if (removedW < reduceW) {
							removedW += setToInitials(fparts, reduceW - removedW);
						}
					}
				}
				givName = slTxt.createLine(gparts);
				famName = slTxt.createLine(fparts);
				var givW = slCtx1.textWidth(givName);
				var famW = slCtx1.textWidth(famName);
				if (givW > 0) {
					name = givName;
					if (famW > 0) {
						name += ' ' + famName;
					}
				} else if (famW > 0) {
					name = famName;
				}
				return [name, givW, famW];
			};






			//=============================================================
			// date[[day#],[month#],[year#]]
			// txtX = [string]:	where the string is stored
/* obsolete
			var reduceMonth = function (daymonth) {
				var startMonth = daymonth.search(/[A-za-z]/);
				return daymonth.substring(0, startMonth + 3);
			};
*/
			var addSimpleDate = function (date, txtA) {
				var extend = '';
				if (date[0] > 0) {
					txtA[0] += date[0];
					extend = ' ';
				}
				if (date[1] > 0) {
					txtA[0] += extend + slTxt.abbrMonth(date[1] - 1);
					extend = ' ';
				}
				if (date.length > 2) {
					txtA[0] += extend + date[2];
				}
			};

			var addDate = function (prefix, date, txtA) {
				if (!date) {
					return false;
				}
				// if date is valid then one of the values must be valid
				
				txtA[0] += prefix;
				if (date.to) {
					// display as range
					addSimpleDate(date.from, txtA);
					txtA[0] += '-';
					addSimpleDate(date.to, txtA);
				} else if (date.about) {
					txtA[0] += 'abt';
					addSimpleDate(date.about, txtA);
				} else {
					addSimpleDate(date,txtA);
				}
				txtA[0] += ' ';
				return true;
			};

			// return [state, country, newPlaceLength] || undefined
			var extractStateCountry = function(place) {
				var plLen = place.length;
				var state;
				var country;
				if (plLen > 0 && !isNaN(place[plLen-1])) {
					var cId = place[plLen-1];
					country = slCtry.countryAbrv(cId);
					if (plLen > 1 && !isNaN(place[plLen-2])) {
						var sId = place[plLen-2];
						state = slCtry.stateAbrv(cId, sId);
					} 
					return [state, country,plLen - 2];
				}
				return undefined;
			};

			var addPlace = function (place, txtA) {
				if (!place) {
					return false;
				}
				var added = false;
				var sc = extractStateCountry(place);
				var stateCtry;
				var plLen = place.length;
				if (sc) {
					stateCtry = sc[0] ? sc[0] + ' ' + sc[1] : sc[1];
					plLen = sc[2];
				}
				for (var i = 0; i < plLen; i++) {
					if (slTxt.isValid(place[i])) {
						if (added) {
							txtA[0] += ', ';
						}
						txtA[0] += place[i];
						added = true;
					} else {
						break;
					}
				}
				if (stateCtry) {
					if (added) {
						txtA[0] += ', ';
					}
					txtA[0] += stateCtry;
				}
				return txtA[0].length > 0;
			};

			// 1. Remove vowels from inside words
			// 2. Shorten words to first 3 characters
			// 3. Combine first letter of each word into single word
			var reducePart = function (subPlace, reduceW) {
				var parts = subPlace.split(' ');
				var results;
				subPlace = '';
				var totalReduced = 0;
				var widthBefore;
				var widthAfter;
				var abrv;
				var i;
				if (parts.length > 1) {
					for (i = 0; i < parts.length; i++) {
						if (totalReduced <= reduceW) {
							results = stripInternalVowels(parts[i]);
							totalReduced += results[0];
							if (totalReduced <= reduceW && results[1].length > 3) {
								widthBefore = slCtx1.textWidth(results[1]);
								abrv = results[1].substring(0, 3);
								widthAfter = slCtx1.textWidth(abrv);
								parts[i] = abrv;
								subPlace += abrv + ' ';
								totalReduced += widthBefore - widthAfter;
							} else {
								parts[i] = results[1];
								subPlace += results[1] + ' ';
							}
						} else {
							subPlace += parts[i] + ' ';
						}
					}
					if (totalReduced <= reduceW) {
						// create single word from starting letters of each part
						subPlace = '';
						for (i = 0; i < parts.length; i++) {
							widthBefore = slCtx1.textWidth(parts[i]);
							widthAfter = slCtx1.textWidth(parts[i][0]);
							totalReduced += widthBefore - widthAfter;
							subPlace += parts[i][0];
						}
					} else {
						subPlace = subPlace.substring(0, subPlace.length - 1);
					}
				} else if (parts[0].length > 3) {
					results = stripInternalVowels(parts[0]);
					totalReduced += results[0];
					if (totalReduced <= reduceW && results[1].length > 3) {
						widthBefore = slCtx1.textWidth(results[1]);
						abrv = results[1].substring(0, 3);
						widthAfter = slCtx1.textWidth(abrv);
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
				var sc = extractStateCountry(place);
				var plLen = place.length;
				if (sc) {
					place[plLen - 1] = sc[1];
					if (sc[0]) {
						place[plLen - 2] = sc[0];
					}
					plLen = sc[2];
				}
				for (var i = plLen - 1; i >= 0; i--) {
					if (slTxt.isValid(place[i])) {
						results = reducePart(place[i], reduceW - totalReduced);
						totalReduced += results[0];
						place[i] = results[1];
						if (totalReduced > reduceW) {
							return totalReduced;
						}
					}
				}
				// If still haven't reduced enough, throw away place pieces from back to front
				while (place.length > 1) {
					var last = place.pop();
					totalReduced += slCtx1.textWidth(last);
					if (totalReduced > reduceW) {
						return totalReduced;
					}
				}
				results = reducePart(place[0], reduceW - totalReduced);
				totalReduced += results[0];
				place[0] = results[1];
				return totalReduced;
			};

			var vowel = 'aeiou';
			var reduceVowels = function(phrase,needToReduce) {
				var reduced = 0;  // width reduced so far
				var i;
				for (i = phrase.length - 1; i > 0; i--) {
					var chr = phrase.charAt(i);
					if (vowel.indexOf(chr) >= 0) {
						if (phrase.charAt(i - 1) !== ' ') {
							phrase = phrase.slice(0,i) + phrase.slice(i+1,phrase.length);
							reduced += slCtx1.textWidth(chr);
							if (reduced >= needToReduce) {
								return [reduced,phrase];
							}
						}
					}
				}
				return [reduced,phrase];
			};

			var createPhrase = function(words) {
				var phrase = '';
				var i;
				for (i = 0; i < words.length; i++) {
					phrase += ' ' + words[i];
				}
				return phrase;
			};

			var punctuation = ',;:.';
			var shortenWords = function(phrase,needToReduce) {
				var reduced = 0;  // width reduced so far
				var words = phrase.split(' ');
				var i;
				for (i = words.length - 1; i >= 0; i--) {
					var word = words[i];
					var j;
					var end = word.length - 1;
					var endChar = '';
					var lastChar = word.charAt(end);
					if (punctuation.indexOf(lastChar) >= 0) {
						endChar = lastChar;
						--end;
					}
					for (j = end; j >= 3; j--) {
						var chr = word.charAt(j);
						reduced += slCtx1.textWidth(chr);
						if (reduced >= needToReduce) {
							word = word.slice(0,j) + endChar;
							words[i] = word;
							phrase = createPhrase(words);
							return [reduced,phrase];
						}
					}
					word = word.slice(0,3) + endChar;
					words[i] = word;
				}
				phrase = createPhrase(words);
				return [reduced,phrase];
			};

			var createAcronym = function (phrase) {
				var words = phrase.split(' ');
				var acronym = '';
				var i;
				var len = words.length;
				for (i = 0; i < len; i++) {
					var word = words[i];
					acronym += word.charAt(0);
				}
				return acronym;
			};

			// 1. Remove vowels from inside words
			// 2. Shorten words to first 3 characters
			// 3. Combine first letter of each word into single word
			var reducePhrase = function(phrase,needToReduce) {
				// Work from the back to reduce
				var result = reduceVowels(phrase,needToReduce);
				if (result[0] >= needToReduce) {
					return result[1];
				}
				phrase = result[1];
				needToReduce -= result[0];
				result = shortenWords(phrase, needToReduce);
				if (result[0] >= needToReduce) {
					return result[1];
				}
				phrase = result[1];
				needToReduce -= result[0];
				return createAcronym(phrase);
			};

			var reduceMarriage = function (prefix, event, width) {
				var mText = [''];
				addDate(prefix, event.date, mText);
				if (!addPlace(event.place, mText)) {
					mText[0] = mText[0].substring(0, mText[0].length - 1);
				}
				var mW = slCtx1.textWidth(mText[0]);
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
				var bW = slCtx1.textWidth(bText[0]);
				var dText = [''];
				if (death) {
					addDate(dPrefix, death.date, dText);
					if (!addPlace(death.place, dText)) {
						dText[0] = dText[0].substring(0, dText[0].length - 1);
					}
				}
				var dW = slCtx1.textWidth(dText[0]);
				var idW = slCtx1.textWidth(ID);
				var bdText = bText[0] + ' ' + dText[0] + ID;
				var totalW = slCtx1.textWidth(bdText);
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

			var personLivingStatus = function (person) {
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
				if (!date) {
					return undefined;
				}
				var textA = [''];
				var locX = slCtx1.concat(textA, prefix);
				var startSel = slSel.nextSR();
				var dyMnth = dayMonth(date);
				var mW = slCtx1.concat(textA, dyMnth);
				if (mW > 0) {
					if (select) {
						slSel.pushSR([preID + 'M', slGeom.rect(locX, y - height, mW, height)]);
					}
					locX += mW;
					locX += slCtx1.concat(textA, ' ');
				}
				var yr = year(date);
				var yW = slCtx1.concat(textA, yr);
				if (yW > 0) {
					if (select) {
						slSel.pushSR([preID + 'Y', slGeom.rect(locX, y - height, yW, height)]);
					}
					locX += yW;
				} else {
					locX -= slCtx1.trimLastChar(textA);
				}
				return [textA[0], locX, startSel];
			};
			//==========================================================================================
			//	concatPlace: concat the place array into one text string
			var concatPlace = function (place, preID, y, height, select) {
				if (!place) {
					return undefined;
				}
				var foundValid = false;
				var startSel = slSel.nextSR();
				var i;
				for (i = 0; i < place.length; i++) {
					if (slTxt.isValid(place[i])) {
						foundValid = true;
						break;
					}
				}
				if (!foundValid) {
					return undefined;
				}
				var locX = 0;
				var textA = [''];
				var sc = extractStateCountry(place);
				var plLen = place.length;
				if (sc) {
					if (sc[0]) {
						place[place.length - 2] = sc[0];
					}
					place[place.length - 1] = sc[1];
				}
				for (i = 0; i < plLen; ++i) {
					var iW = slCtx1.concat(textA, place[i]);
					if (iW > 0) {
						if (select) {
							slSel.pushSR([preID + 'P' + i, slGeom.rect(locX, y - height, iW, height)]);
						}
						locX += iW;
						locX += slCtx1.concat(textA, ', ');
					}
				}
				locX -= slCtx1.trimLastChar(textA, 2);
				return [textA[0], locX, startSel];
			};
			//==========================================================================================
			// concat - 'birthYear-deathYear'
			var concatBirthDeathYears = function (person, preID, y, height, select) {
				var locX = 0;
				var text = '';
				var startSel = slSel.nextSR();
				var width = 0;
				var birthYear = slPpl.year(person.birth);
				if (birthYear) {
					text = birthYear;
					var bYW = slCtx1.textWidth(birthYear);
					if (select) {
						slSel.pushSR([preID + 'bY', slGeom.rect(locX, y - height, bYW, height)]);
					}
					width += bYW;
				} else {
					text = '?';
					width += slCtx1.textWidth(text);
				}
				var separator = '-';
				text += separator;
				width += slCtx1.textWidth(separator);
				locX += width;
				var deathYear = slPpl.year(person.death);
				if (deathYear) {
					text += deathYear;
					var dYW = slCtx1.textWidth(deathYear);
					if (select) {
						slSel.pushSR([preID + 'dY', slGeom.rect(locX, y - height, dYW, height)]);
					}
					width += dYW;
				} else {
					var status = personLivingStatus(person);
					text += status;
					width += slCtx1.textWidth(status);
				}
				return [text, width, startSel];
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


			//==================================================
			// return amount to shrink text lines base on current
			// font settings
			slCtx1.shrinkW = function () {
				return slCtx1.textWidth('XX');
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

			var setUnattachedSourcesColors = function () {
				slCtx1.setDrawStyle('#C3AD82', '#7F7155');
			};

			var setAttachedSourcesColors = function () {
				slCtx1.setDrawStyle('#60CDA2', '#2B7420');
			};

			var setAttachedBoxColors = function () {
				slCtx1.setDrawStyle('#60CDA2', '#2B7420');
			};


/*  Needed?
			slCtx1.clearAttachedSourceRegion = function (align,attDim) {
				var sideDim = attDim.side;
				var topDim = attDim.top;
				var leftSideBox = new slCtx1.slGeom.rectangle(align.attBox.left(), align.attBox.right, canvasWidth, canvasHeight);
				setAttachedSourcesColors();
				slCtx1.drawBox(innerBox);

			};

			slCtx1.clearUnattachedSourceRegion = function () {

			};
*/
			slCtx1.renderAttSrcBox = function (area) {
				setAttachedBoxColors();
				slCtx1.drawBox(area);
			};


			slCtx1.drawBackground = function (personId) {
				canvasResize();
				actvPersonId = personId;
				ctx1.lineWidth = 1;
				var edgeWidth = 5;
				var person;
				var colors;
				var dimensionY = (canvasHeight) / 4;
				var dimensionX = (canvasWidth) / 7;
				var outerBox = new slGeom.rectangle(0, 0, canvasWidth, canvasHeight);
				var innerBox = new slGeom.rectangle(outerBox.loc.x + dimensionX, outerBox.loc.y + dimensionY,
										outerBox.d.x - 2 * dimensionX, outerBox.d.y - dimensionY);
				var personBox = new slGeom.rectangle(innerBox.loc.x + dimensionX, innerBox.loc.y + dimensionY,
										innerBox.d.x - 2 * dimensionX, innerBox.d.y - dimensionY);
				setUnattachedSourcesColors();
				slCtx1.drawBox(outerBox);
				setAttachedSourcesColors();
				slCtx1.drawBox(innerBox);
				person = slPpl.getPerson(personId);
				if (!person) {
					alert('No person found for: ' + personId);
				}
				var gender = (!person || !person.gender) ? 'U' : person.gender;
				colors = personColors(gender);
				slCtx1.setDrawStyle(colors[0], colors[1]);
				slCtx1.drawBox(personBox);
				personBox = personBox.shrink(edgeWidth);
				slCtx1.setDrawStyle(colors[2], colors[2]);
				slCtx1.drawBox(personBox);
				return {
					unAttBox: outerBox,
					attBox: innerBox,
					persBox: personBox,
					indent: 20
				};
			};

			slCtx1.setFontSize = function (fontSize) {
				ctx1.font = fontSize + 'px Tahoma';
				return fontSize * 1.2;
			};



			//=================================================================================
			// renderName - draw name of person centered on canvas at location x,y  The max line
			//				width is width and character height is height.  If name is too
			//				long to fit on one line then draw on two lines.  If name will
			//				not fit on two lines then reduce name to fit and draw on two lines.
			slCtx1.renderName = function (person, preID, x, y, width, height, lineSpace, select) {
				var famName = person.name[1];
				if (preID === 'R') {
					familyName = famName;
				}
				var givName = person.name[0];
				var fullName = givName + ' ' + famName;
				var givWidth = slCtx1.textWidth(givName);
				var famWidth = slCtx1.textWidth(famName);
				var fullW = slCtx1.textWidth(fullName);
				var nextSR;
				if (select) {
					nextSR = slSel.nextSR();
				}
				if (width >= fullW) {
					slCtx1.drawText(fullName, x, y);
					if (select) {
						slSel.pushSR([preID + 'nG', slGeom.rect(x - fullW / 2, y - height, givWidth, height)]);
						slSel.pushSR([preID + 'nF', slGeom.rect(x + fullW / 2 - famWidth, y - height, famWidth, height)]);
					}
					return y + lineSpace;
				} else {
					// Name is too long.	Split on two lines
					var nextY = y + lineSpace; // positive y is down
					if (width >= givWidth) {
						slCtx1.drawText(givName, x, y);
						slCtx1.drawText(famName, x, nextY);
						if (select) {
							slSel.pushSR([preID + 'RnG', slGeom.rect(x - givWidth / 2, y, givWidth, height)]);
							slSel.pushSR([preID + 'nF', slGeom.rect(x - famWidth / 2, y - lineSpace, famWidth, height)]);
						}
						return y + lineSpace * 2;
					} else {
						// Name is too long to fit on two lines
						var neededSpace = givWidth - width;
						var gname = [givName];
						reduceGivName(gname, neededSpace);
						givName = gname[0];
						slCtx1.drawText(givName, x, y);
						givWidth = slCtx1.textWidth(givName);
						if (famWidth > width) {
							neededSpace = famWidth - width;
							famName = reduceFamName(famName, neededSpace);
							famWidth = slCtx1.textWidth(famName);
						}
						slCtx1.drawText(' ' + famName, x, y);
						if (select) {
							slSel.pushSR([preID + 'nG', slGeom.rect(x - width / 2, y, givWidth, height)]);
							slSel.pushSR([preID + 'nF', slGeom.rect(x - width / 2, nextY, famWidth, height)]);
						}
						return y + lineSpace * 2;
					}
				}
			};
			//=============================================================================================
			// renderNameYear  draw then persons name and birth year
			//			start person name at left edge and birth year at right edge
			//			reduce so it will fit within width
			slCtx1.renderNameYear = function (person, preID, x, y, width, height, lineSpace, select) {
				if (!person) {
					return y;
				}
				ctx1.textAlign = 'left';
				var maxYearW = slCtx1.textWidth('4444');
				var spWidth = slCtx1.textWidth(' ');
				var maxNameW = width - maxYearW - spWidth;
				var startName = x - width / 2;	// left edge of name
				var startYear = x + width / 2 - maxYearW;
				var famName = person.name[1];
				var givName = person.name[0];
				var name;
				if (famName.toLowerCase() === familyName.toLowerCase() && givName !== '') {
					famName = '';
					name = givName;
				} else {
					name = slTxt.createLine([givName, famName]);
				}
				var nameW = slCtx1.textWidth(name);
				var givW;
				var famW;
				if (nameW > maxNameW) {
					var result = reduceName(givName, famName, nameW - maxNameW);
					name = result[0];
					nameW = slCtx1.textWidth(name);
					givW = result[1];
					famW = result[2];
				} else {
					givW = slCtx1.textWidth(givName);
					famW = slCtx1.textWidth(famName);
				}
				slCtx1.drawText(name, startName, y);
				if (select && givW > 0) {
					if (givW > 0) {
						slSel.pushSR([preID + 'nG', slGeom.rect(startName, y - height, givW, height)]);
					}
					if (famW > 0) {
						slSel.pushSR([preID + 'nF', slGeom.rect(startName + nameW - famW, y - height, famW, height)]);
					}
				}
				if (slPpl.noEvent(person.birth)) {
					slCtx1.drawText(personLivingStatus(person), startYear, y);
					return y + lineSpace;
				}
				var birthYear = slPpl.year(person.birth);
				if (birthYear) {
					slCtx1.drawText(birthYear, startYear, y);
					if (select) {
						slSel.pushSR([preID + 'bY', slGeom.rect(startYear, y - height, maxYearW, height)]);
					}
				} else {
					slCtx1.drawText(personLivingStatus(person), startYear, y);
				}
				return y + lineSpace;
			};

			//=============================================================================================
			// renderNameYearPl  draw then persons name and birth year and birth place so each field lines up
			//			start at left edge determined by half width left of x
			//			reduce so it will fit on one line.
			slCtx1.renderNameYearPl = function (person, preID, x, y, width, height, lineSpace, select) {
				if (!person) {
					return y;
				}
				ctx1.textAlign = 'left';
				var maxNameW = width / 3;
				var maxYearW = slCtx1.textWidth('4444');
				var spWidth = slCtx1.textWidth(' ');
				var maxPlaceW = width - maxNameW - maxYearW - 2 * spWidth;
				var startName = x - width / 2;	// left edge of name
				var startYear = startName + maxNameW + spWidth;
				var startPlace = startYear + maxYearW + spWidth;
				var famName = person.name[1];
				var givName = person.name[0];
				var name;
				if (famName.toLowerCase() === familyName.toLowerCase() && givName !== '') {
					famName = '';
					name = givName;
				} else {
					name = slTxt.createLine([givName, famName]);
				}
				if (person.id === actvPersonId) {
					slCtx1.boldFont();
				}
				var nameW = slCtx1.textWidth(name);
				var givW;
				var famW;
				if (nameW > maxNameW) {
					var result = reduceName(givName, famName, nameW - maxNameW);
					name = result[0];
					nameW = slCtx1.textWidth(name);
					givW = result[1];
					famW = result[2];
				} else {
					givW = slCtx1.textWidth(givName);
					famW = slCtx1.textWidth(famName);
				}
				slCtx1.drawText(name, startName, y);

				if (select && givW > 0) {
					if (givW > 0) {
						slSel.pushSR([preID + 'nG', slGeom.rect(startName, y - height, givW, height)]);
					}
					if (famW > 0) {
						slSel.pushSR([preID + 'nF', slGeom.rect(startName + nameW - famW, y - height, famW, height)]);
					}
				}
				if (person.id === actvPersonId) {
					slCtx1.normalFont();
				}
				if (slPpl.noEvent(person.birth)) {
					slCtx1.drawText(personLivingStatus(person), startYear, y);
					return y + lineSpace;
				}
				var bEv = slPpl.copyEvent(person,'b',person.birth);
				var birthYear = slPpl.year(bEv);
				if (birthYear) {
					slCtx1.drawText(birthYear, startYear, y);
					if (select) {
						slSel.pushSR([preID + 'bY', slGeom.rect(startYear, y - height, maxYearW, height)]);
					}
				} else {
					slCtx1.drawText(personLivingStatus(person), startYear, y);
				}
				var plcText = [''];
				addPlace(bEv.place, plcText);
				var plcW = slCtx1.textWidth(plcText);
				if (plcW > 0) {
					var place = bEv.place.slice(0);
					if (plcW > maxPlaceW) {
						reducePlace(place, plcW - maxPlaceW);
					}
					plcText = [''];
					addPlace(place, plcText);
					slCtx1.drawText(plcText[0], startPlace, y);
					if (select) {
						var locX = startPlace;
						var cspW = slCtx1.textWidth(', ');
						for (var i = 0; i < place.length; i++) {
							if (place[i] === '') {
								break;
							} else {
								var subPlW = slCtx1.textWidth(place[i]);
								slSel.pushSR([preID + 'bP' + i, slGeom.rect(locX, y - height, subPlW, height)]);
								locX += subPlW + cspW;
							}
						}
					}
				}
				return y + lineSpace;
			};

			slCtx1.renderMarriage = function (person,MarriageEvent, preID, x, y, width, height, lineSpace, select) {
				preID += 'm';
				if (slPpl.noEvent(MarriageEvent)) {
					ctx1.textAlign = 'center';
					slCtx1.drawText('No Cple Rltnshp', x, y);
					return y + lineSpace;
				}
				ctx1.textAlign = 'left'; // concatenate text parts from left to right
				var event = slPpl.copyEvent(person,'m',MarriageEvent);
				var mWidth = reduceMarriage('', event, width);
				if (drawMarks) {
					slCtx2.setDrawStyle('blue', 'blue');
					slCtx2.drawLine(x - mWidth / 2, y, x + mWidth / 2, y);
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
				var spW = slCtx1.textWidth(' ');
				cWidth = 0;
				concatParts.forEach(concatWidth);
				var lineW = cWidth + spW;
				var makeTwoLines = lineW > width;
				offsetX = makeTwoLines ? x - (concatParts[0][idxW] / 2) : x - (lineW / 2);
				slCtx1.drawText(concatParts[0][idxTxt], offsetX, y + offsetY);
				if (select) {
					if (concatParts.length > 1) {
						slSel.offsetSelectRects(concatParts[0][idxSR], concatParts[1][idxSR], offsetX, offsetY);
					} else {
						slSel.offsetSelectRects(concatParts[0][idxSR], slSel.nextSR(), offsetX, offsetY);
					}
				}
				if (concatParts.length > 1) {
					offsetY += makeTwoLines ? lineSpace : 0;
					offsetX = makeTwoLines ? x - (concatParts[1][idxW] / 2) : offsetX + concatParts[0][idxW] + spW;
					slCtx1.drawText(concatParts[1][idxTxt], offsetX, y + offsetY);
					if (select) {
						slSel.offsetSelectRects(concatParts[1][idxSR], slSel.nextSR(), offsetX, offsetY);
					}
				}
				offsetY += lineSpace;
				return y + offsetY;
			};

			var samePlace = function (event1, event2) {
				if (slPpl.noPlace(event1) || slPpl.noPlace(event2)) {
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

			
			// render txt centered about x at y;
			var renderTxt = function (txt, x, y, lineSpace) {
				var offsetX = x - slCtx1.textWidth(txt) / 2;
				slCtx1.drawText(txt, offsetX, y);
				return y + lineSpace;
			};


			slCtx1.renderBirthDeath = function (person, preID, x, y, width, height, lineSpace, select) {
				ctx1.textAlign = 'left'; // concatenate text parts from left to right
				var ID = person.id;
				var idW = slCtx1.textWidth(ID);
				var idPW = slCtx1.textWidth(IDPrfx);
				var lineW = 0; // draw width of line
				var offsetX = 0;
				if (!person.birth && !person.death) {
					// No birth death information
					var txt = personLivingStatus(person) + IDPrfx + ID;
					lineW = slCtx1.textWidth(txt);
					offsetX = x - lineW / 2;
					slCtx1.drawText(txt, offsetX, y);
					return y + lineSpace;
				}
				// concatParts = [[text,width,startSR],...]
				var concatParts = [];

				var birth = slPpl.copyEvent(person,'b',person.birth);
				var death = slPpl.copyEvent(person,'d',person.death);
				// create an array of identified regions for selection
				var offsetY = 0;
				var spW = slCtx1.textWidth(' '); // Width of space char

				var i;	// in for loops
				if (slPpl.noMonth(birth) && slPpl.noMonth(death)) {
					// all we have are years for birth and death dates
					var noPlace = slPpl.noPlace(birth) && slPpl.noPlace(death);
					var noYear = slPpl.noYear(birth) && slPpl.noYear(death);
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
								concatParts.push(concatPlace(person.place, preID + 'x', y, height, select));
								lineW = concatParts[0][idxW] + idW + spW + concatParts[0][idxW];
								if (lineW > width) {
									// render on two lines
									lineW = concatParts[0][idxW] + idPW + idW;
									offsetX = x - lineW / 2;
									slCtx1.drawText(concatParts[0][idxTxt] + IDPrfx + ID, offsetX, y);
									if (select) {
										slSel.offsetSelectRects(0, concatParts[1][idxSR], offsetX, 0);
									}
									y += lineSpace;
									offsetX = x - concatParts[1][idxW] / 2;
									slCtx1.drawText(concatParts[1][idxTxt], offsetX, y);
									if (select) {
										slSel.offsetSelectRects(concatParts[1][idxSR], slSel.nextSR(), offsetX, lineSpace);
									}
								} else {
									// render on one line
									offsetX = x - lineW / 2;
									var text = concatParts[0][idxTxt] + ' ' + concatParts[1][idxTxt] + IDPrfx + ID;
									slCtx1.drawText(text, offsetX, y);
									if (select) {
										slSel.offsetSelectRects(0, concatParts[1][idxSR], offsetX, 0);
										offsetX += concatParts[0][idxW] + spW;
										slSel.offsetSelectRects(concatParts[2][idxSR], slSel.nextSR(), offsetX, 0);
									}
								}
							} else {
								// years only to render
								lineW = concatParts[0][idxW] + idPW + idW;
								offsetX = x - lineW / 2;
								slCtx1.drawText(concatParts[0][idxTxt] + IDPrfx + ID, offsetX, y);
								if (select) {
									slSel.offsetSelectRects(0, slSel.nextSR(), offsetX, 0);
								}
							}
							return y + lineSpace;
						}
						// years only but different birth and death places render normally
					}
				}


				var bdWidth = reduceBirthDeath(birth, death, 'BIRTH ', 'DEATH ', IDPrfx + ID, width);
				if (drawMarks) {
					// Draw Text marker Lines
					var lineY = y;
					for (i = 0; i < bdWidth.length; i++) {
						slCtx2.setDrawStyle('blue', 'blue');
						slCtx2.drawLine(x - bdWidth[i] / 2, lineY, x + bdWidth[i] / 2, lineY);
						lineY += lineSpace;
					}
				}

				var rab = 0;
				var line = ['']; // text line
				var concatValue;
				if (birth) {
					if (birth.date) {
						concatValue = concatDate('BIRTH ', birth.date, preID + 'b', y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
					if (birth.place) {
						concatValue = concatPlace(birth.place, preID + 'b', y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
				}
				if (death) {
					if (death.date) {
						concatValue = concatDate('DEATH ', death.date, preID + 'd', y, height, select);
						if (concatValue) {
							concatParts.push(concatValue);
						}
					}
					if (death.place) {
						concatValue = concatPlace(death.place, preID + 'd', y, height, select);
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
							slCtx1.trimLastChar(line);
							slCtx1.drawText(line[0], offsetX, y + offsetY);
							line[0] = '';
							lineW = 0;
							if (select) {
								slSel.offsetSelectRects(concatParts[rab][idxSR], concatParts[i][idxSR], offsetX, offsetY);
							}
							rab = i;
							offsetY += lineSpace;
						} else {
							alert('line segment does not fit: ' + concatParts[i][idxTxt]);
						}
					} else {
						// fits.  Shift this text to end of line
						if (select && lineW > 0) {
							var endSR = (i < concatParts.length - 1) ? concatParts[i + 1][idxSR] : slSel.nextSR();
							slSel.offsetSelectRects(concatParts[i][idxSR], endSR, lineW, 0);
						}
					}
					line[0] += concatParts[i][idxTxt];
					lineW += thisW;
					lineW += slCtx1.concat(line, ' ');
				}
				if (lineW + slCtx1.textWidth(IDPrfx + ID) <= width) {
					// render entire line
					lineW += slCtx1.concat(line, IDPrfx + ID);
					offsetX = x - lineW / 2;
					slCtx1.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						// Offset this entire line to center start point
						slSel.offsetSelectRects(concatParts[rab][idxSR], slSel.nextSR(), offsetX, offsetY);
					}
				} else {
					lineW -= slCtx1.trimLastChar(line);
					offsetX = x - lineW / 2;
					slCtx1.drawText(line[0], offsetX, y + offsetY);
					if (select) {
						slSel.offsetSelectRects(concatParts[rab][idxSR], slSel.nextSR(), offsetX, offsetY);
					}
					offsetY += lineSpace;
					lineW = idPW + idW;
					offsetX = x - lineW / 2;
					slCtx1.drawText(IDPrfx + ID, offsetX, y + offsetY);
				}
				offsetY += lineSpace;
				return y + offsetY;
			};

			slCtx1.renderChildren = function (children, seqGrp, x, y, secW, textY, fontSize, select) {
				if (!children) {
					return;
				}
				var textHeight = slCtx1.setFontSize(fontSize);
				var lineSpace = textHeight * 0.6;
				var i;
				for (i = 0; i < children.length; i++) {
					var childId = children[i];
					var child = slPpl.getPerson(childId);
					var childSelID = seqGrp[1] + i + seqGrp[0];
					textY = slCtx1.renderNameYearPl(child, childSelID, x, textY, secW, textHeight, lineSpace, select);
					textY += lineSpace;
				}
			};

			var splitPhrase = function (parts, at) {
				var twoLines = ['',''];
				var len = parts.length;
				for (var i = 0; i < len; i++) {
					if (i <= at) {
						if (twoLines[0].length > 0) {
							twoLines[0] += ' ';
						}
						twoLines[0] += parts[i];
					} else {
						if (twoLines[1].length > 0) {
							twoLines[1] += ' ';
						}
						twoLines[1] += parts[i];
					}
				}
				return twoLines;
			};


			//=================================================================================
			// renderPhrase - draw phrase with selection id centered on canvas at location x,y.
			//				The max line width is maxW and character height is height.
			//				If phrase is too long to fit on one line then draw on two lines.
			//				If phrase will not fit on two lines then reduce to fit on two lines.
			slCtx1.renderPhrase = function (phrase, x, y, maxW, height, lineSpace) {
				var fullW = slCtx1.textWidth(phrase);
				if (maxW >= fullW) {
					slCtx1.drawText(phrase, x, y);
					return y + lineSpace;
				} 
				// phrase is too long.	Split into two lines
				// find whitespace closest to center of phrase
				var halfWay = phrase.length / 2;
				var parts = phrase.split(' ');
				var len = parts.length;
				var charCnt = 0;
				var twoLines;
				var i;
				for (i = 0; i < len; i++) {
					var nextCnt = parts[i].length;
					if ((charCnt + nextCnt) < halfWay) {
						charCnt += nextCnt + 1;
					} else {
						if ((halfWay - charCnt) > (charCnt + nextCnt - halfWay)) {
							twoLines = splitPhrase(parts, i);
						} else {
							twoLines = splitPhrase(parts, i - 1);
						}
						break;
					}
				}
				for (i = 0; i < 2; i++) {
					if (i > 0) {
						y += lineSpace;
					}
					var lwidth = slCtx1.textWidth(twoLines[i]);
					if (lwidth > maxW) {
						twoLines[i] = reducePhrase(twoLines[i],lwidth - maxW);
					}
					slCtx1.drawText(twoLines[i], x, y);
				}
				return y + lineSpace;	
			};

			var dateCompleteness = function (date) {
				if (date) {
					if (date.about || date.to) {
						return 1;
					}
					var cnt = 1;
					var len = date.length;
					for (var i = 0; i < len; i++) {
						if (date[i] > 0) {
							++cnt;
						}
					}
					return cnt;
				}
				return 0;
			};

			var bestEventDate = function (sources) {
				var len = sources.length;
				var best = sources[0].event.date;
				for (var i = 1; i < len; i++) {
					if (dateCompleteness(best) < dateCompleteness(sources[i].event.date)) {
						best = sources[i].event.date;
					}
				}
				return best;
			};

			var placeCompleteness = function(place) {
				if (place) {
					return place.length;
				}
				return 0;
			};

			var bestEventPlace = function (sources) {
				var len = sources.length;
				var best = sources[0].event.place;
				for (var i = 1; i < len; i++) {
					if (placeCompleteness(best) < placeCompleteness(sources[i].event.place)) {
						best = sources[i].event.place;
					}
				}
				return best;
			};

			slCtx1.renderSourceEvents = function (sources, x, y, maxW, height, lineSpace, maxY) {
				var first = sources[0];
				var txt = [''];
				if (first.type) {
					txt[0] += first.type + ' ';
				}
				var date = bestEventDate(sources);
				var place = bestEventPlace(sources);
				addDate('', date, txt);
				txt[0] += ' ';
				addPlace(place, txt);
				return slCtx1.renderPhrase(txt[0], x, y, maxW, height, lineSpace);
			};

			return slCtx1;
		} ]);

})();
