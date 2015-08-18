(function () {
	'use strict';
	var slApp = angular.module('sourceLink');


	slApp.factory('slDrw',
		['slCtx1', 'slSel', 'slPpl', 'slSrc', 'slGeom', 'slCSS',
			function (slCtx1, slSel, slPpl, slSrc, slGeom, slCSS) {

			var align;
			var famAlign;
			var select = true;
			var drawMarks = slCtx1.drawMrks();
			var slDrw = {};
			var spouceCnt = 0;
			var parentCnt = 0;
			var AttSrc = slSel.attSrc;

			slDrw.reset = function () {
				spouceCnt = 0;
				parentCnt = 0;
			};

/* unused

			var circleHWidth = function (centerX, centerY, radius, hY) {
				if (drawMarks) {
					slCtx1.setDrawStyle('red', 'red');
					slCtx1.drawDot(centerX, centerY);
				}
				var dY = Math.abs(hY - centerY);
				if (dY >= radius) {
					return 0;
				}
				var width = 2 * Math.sqrt(radius * radius - (dY * dY));
				if (drawMarks) {
					slCtx1.setDrawStyle('orange', 'orange');
					slCtx1.drawLine(centerX - width / 2, hY, centerX + width / 2, hY);
					slCtx1.setDrawStyle('red', 'red');
					slCtx1.drawDot(centerX, hY);
				}
				return width;
			};
*/

			var alignPersonFamilyInfo = function (align, textY) {
				textY += slCSS.familyIndent;
				var HWidth = align.persBox.d.x - (align.indent * 2);
				// Divide in half with spouses and families on the left and 
				// parents and families on the right
				famAlign = {
					y: textY,
					w: HWidth
				};
			};

			//==================================================================
			// Draw the person name dates and places centered at xy with maximum
			// line width (HWidth) and TextHeight
			var drawActvPerson = function (personId, x, y, HWidth, select) {
				var textHeight = slCtx1.setFontSize(slCSS.actvPersonFontSize);
				slCtx1.setTextStyle('black', 'left');
				var textY = y;
				var lineSpace = textHeight;
				var centerX = align.persBox.m.centerX();
				var person = slPpl.getPerson(personId);
				textY = slCtx1.renderName(person, 'R', centerX, textY, HWidth, textHeight, lineSpace, select);
				textHeight = slCtx1.setFontSize(slCSS.actvPersonInfoFontSize);
				textY = slCtx1.renderBirthDeath(person, 'R', centerX, textY, HWidth, textHeight, lineSpace, select);
				return textY;
			};

			slDrw.background = function (personId) {
				slDrw.reset();
				align = slCtx1.drawBackground(personId);
				slSel.setRegions(align);
			};
			
			var clip = 1;  // Dimension to back off from adjacent area 
			var topAttachedSourceArea = function () {
				return new slGeom.rectangle(align.attBox.m.left(), align.attBox.m.top(),
					align.attBox.d.x, align.attBox.d.y - align.persBox.d.y);
			};

			var divideAttachedSourceArea = function (count,attDim) {
				var topCount = Math.floor(count / 3);
				var sideCount = topCount;
				var rem = count % 3;
				if (rem === 1) {
					++topCount;
				} if (rem === 2) {
					++sideCount;
				}
				var sideDim = attDim.side;
				var topDim = attDim.top;
				var sideBoxDim = new slGeom.xy(sideDim.x,(sideDim.y + clip)/sideCount);
				var topBoxDim = new slGeom.xy(topDim.x/topCount,topDim.y);
				var areas = [];
				var i;
				var len = sideCount;
				// Create areas for left side
				var nextLoc = new slGeom.xy(align.attBox.m.left(),align.persBox.m.top() - clip + (sideBoxDim.y *(sideCount - 1)));
				var area = new slGeom.rectangle(nextLoc.x,nextLoc.y,sideBoxDim.x,sideBoxDim.y);
				for (i = 0; i < len; i++) {
					areas.push(area.m.clone());
					area.loc.y -= sideBoxDim.y;
				}
				// Create areas for top
				len = topCount;
				area.loc.y = align.attBox.m.top();
				area.d = topBoxDim;
				for (i = 0; i < len; i++) {
					areas.push(area.m.clone());
					area.loc.x += topBoxDim.x;
				}
				// Create areas for right side
				len = sideCount;
				area.loc.x = align.attBox.m.right() - sideBoxDim.x;
				area.loc.y = align.persBox.m.top() - clip;
				area.d = sideBoxDim;
				for (i = 0; i < len; i++) {
					areas.push(area.m.clone());
					area.loc.y += sideBoxDim.y;
				}
				return areas;
			};

			var attSrcTitle = function (sources) {
				var first = sources[0];
				if (sources.length > 1) {
					return sources.length.toString() + ' ' + first.type + ' Records';
				}
				return first.title;
			};

			var fontSizeToFit = function(phrase,area) {
				var fontSize = Math.floor(area.d.y / 2);
				slCtx1.setFontSize(fontSize);
				var phraseW = slCtx1.textWidth(phrase);
				if (phraseW >= area.d.x) {
					fontSize = Math.floor(0.9 * fontSize * area.d.x / phraseW);
				}
				return fontSize;
			};

			var drawPhrase = function (phrase, area) {
				var fontSize = fontSizeToFit(phrase,area);
				var textHeight = slCtx1.setFontSize(fontSize);
				slCtx1.setTextStyle('black', 'center', 'middle');
				var HWidth = area.d.x;
				var textY = area.m.centerY();
				var centerX = area.m.centerX();
				var lineSpace = textHeight;
				textY = slCtx1.renderPhrase(phrase, centerX, textY, HWidth, textHeight, lineSpace);
			};

			var grpToSources = function (sourceGrp) {
				var sources = [];
				var len = sourceGrp.length;
				for (var i = 0; i < len; i++) {
					var source = slSrc.get(sourceGrp[i]);
					if (source) {
						sources.push(source);
					}
				}
				return sources;
			};


			var drawAttSelResult = function(attSel,which,centerX, textY, HWidth, textHeight, lineSpace/*, maxY*/) {
				var txt = '';
				var len = attSel.length;
				for (var i = 0; i < len; i++) {
					var rslt = attSel[i];
					if (txt.length > 0) {
						txt += ' ';
					}
					txt += rslt[0];
					if (rslt[1] > 1) {
						txt += '[' + rslt[1] + ']';
					}
				}

				textY = slCtx1.renderPhrase(txt, centerX, textY, HWidth, textHeight, lineSpace,
					slCSS.matchBoxColors[which]);
				return textY;
			};

			var drawAttachedSource = function (idx, sourceGrp) {
				var selRects = slSel.attRects();
				var area = selRects[idx][1];
				slCtx1.renderAttSrcBox(area);
				slCtx1.setTextStyle('black', 'center');
				var HWidth = area.d.x;
				var textY = area.m.top() + align.indent;
				var centerX = area.m.centerX();
				var textHeight = slCtx1.setFontSize(slCSS.attSrcTitleFontSize);
				var lineSpace = textHeight;
				var sources = grpToSources(sourceGrp);
				var title = attSrcTitle(sources);
				textY = slCtx1.renderPhrase(title, centerX, textY, HWidth, textHeight, lineSpace);
				textHeight = slCtx1.setFontSize(slCSS.attSrcFontSize);
				slCtx1.setTextStyle('black', 'center');
				var attSel = slSel.getAttSel(idx);
				if (attSel) {
					if (attSel.exact) {
						textY = drawAttSelResult(attSel.exact,'exact',centerX, textY, HWidth, textHeight, lineSpace, area.m.bottom());
					}
					if (attSel.near) {
						textY = drawAttSelResult(attSel.near,'near',centerX, textY, HWidth, textHeight, lineSpace, area.m.bottom());
					}
					if (attSel.no) {
						textY =drawAttSelResult(attSel.no,'no',centerX, textY, HWidth, textHeight, lineSpace, area.m.bottom());
					}
				}
//				slCtx1.renderSourceEvents(sources,centerX, textY, HWidth, textHeight, lineSpace, area.m.bottom());
				return textY;
			};

			slDrw.drawAttPhrase = function (msg) {
				var area = topAttachedSourceArea();
				var txtArea = area.m.shrink(20);
				drawPhrase(msg, txtArea);
			};

			slDrw.AttAreas = function (person) {
				var len = person.sources.length;
				for (var i = 0; i < len; i++) {
					drawAttachedSource(i, person.sources[i]);
				}
			};

			slDrw.AttSources = function (personId) {
				// organize sources sequentially and combine duplicate
				// sources together:  BIRTH  DEATH/BURIAL  MARRIAGE

				var attDim = {
					side: new slGeom.xy((align.attBox.d.x - align.persBox.d.x)/2 - clip,align.persBox.d.y + clip),
					top: new slGeom.xy(align.attBox.d.x, align.persBox.loc.y - align.attBox.loc.y - clip)
				};
//				slCtx1.clearAttachedSourceRegion(align,attDim);		always cleared?
				slSel.clearAtt();
				var person = slPpl.getPerson(personId);
				if (person.living) {
					slDrw.drawAttPhrase('Sources Are Not Attached to a Living Person');
					return;
				}
				if (person && person.sources) {
					var len = person.sources.length;
					var attachedAreas = divideAttachedSourceArea(len,attDim);
					for (var i = 0; i < len; i++) {
						slSel.pushSR([i.toString, attachedAreas[i]], AttSrc);
						drawAttachedSource(i,person.sources[i]);
					}
				} else {
					slDrw.drawAttPhrase('There Are No Attached Sources');
				}
			};


			slDrw.actPerson = function (personId) {
				var HWidth = align.persBox.d.x - (align.indent * 2);
				var textY = align.persBox.m.top() + align.indent;
				var textX = align.persBox.m.centerX();
				textY = drawActvPerson(personId, textX, textY, HWidth, true);
				alignPersonFamilyInfo(align, textY);

			};

			slDrw.actRest = function (person) {
				var i;
				var textY;
				var textHeight = slCtx1.setFontSize(slCSS.famFontSize);
				if (person.spouses) {
					textY = famAlign.y;
					for (i = 0; i < person.spouses.length; i++) {
						textY = slDrw.spouseFamily(person.id, i, textY);
						textY += textHeight;
					}
				}
				if (person.parents) {
					textY = famAlign.y;
					for (i = 0; i < person.parents.length; i++) {
						textY = slDrw.parentFamily(person.id, i, textY);
						textY += textHeight;
					}
				}
			};

			slDrw.spouseFamily = function (actId,whichSpouse,tY) {
				var textHeight = slCtx1.setFontSize(slCSS.famFontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = align.persBox.m.left() + secW/2;
				var textY = tY ? tY : famAlign.y;

				secW -= slCtx1.shrinkW();

				if (drawMarks) {
					slCtx1.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					slCtx1.drawLine(x - halfW, textY, x + halfW, textY);
					slCtx1.setDrawStyle('red', 'red');
					slCtx1.drawDot(x, textY);
				}
				
				var person = slPpl.getPerson(actId);
				var spouse = slPpl.getPerson(person.spouses[whichSpouse].spouse);

				slCtx1.setTextStyle('blue', 'center');
				var spouseSelID = 'p' + spouceCnt;
				if (secW > 300) {
					textY = slCtx1.renderNameYearPl(spouse, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				} else {
					textY = slCtx1.renderNameYear(spouse, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				}
				textY = slCtx1.renderMarriage(spouse,person.spouses[whichSpouse].marriage, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				slCtx1.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				slCtx1.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				var seqGrp = ['d' + spouceCnt++,'c'];
				textY = slCtx1.renderChildren(person.spouses[whichSpouse].children, seqGrp, x, textY, secW, textY, select);
				return textY;
			};

			slDrw.parentFamily = function (actId, whichParent, tY) {
				var textHeight = slCtx1.setFontSize(slCSS.famFontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = align.persBox.m.right() - secW/2;
				var textY = tY ? tY : famAlign.y;

				secW -= slCtx1.shrinkW();

				if (drawMarks) {
					slCtx1.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					slCtx1.drawLine(x - halfW, textY, x + halfW, textY);
					slCtx1.setDrawStyle('red', 'red');
					slCtx1.drawDot(x, textY);
				}

				var person = slPpl.getPerson(actId);
				var husband = slPpl.getPerson(person.parents[whichParent].husband);
				var wife = slPpl.getPerson(person.parents[whichParent].wife);
				slCtx1.setTextStyle('blue', 'center');

				var fatherSelID = 'f' + parentCnt;
				var motherSelID = 'm' + parentCnt;
				if (secW > 300) {
					textY = slCtx1.renderNameYearPl(husband, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
					textY = slCtx1.renderNameYearPl(wife, motherSelID, x, textY, secW, textHeight, lineSpace, select);
				} else {
					textY = slCtx1.renderNameYear(husband, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
					textY = slCtx1.renderNameYear(wife, motherSelID, x, textY, secW, textHeight, lineSpace, select);
				}
				textY = slCtx1.renderMarriage(wife,person.parents[whichParent].marriage, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
				slCtx1.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				slCtx1.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				var seqGrp = ['a' + parentCnt++,'s'];
				textY = slCtx1.renderChildren(person.parents[whichParent].children, seqGrp, x, textY, secW, textY, select);
				return textY;
			};

			slDrw.child = function (child) {
				console.log('slDrw.child: ' + child);
			};

			return slDrw;
		}]);
})();
