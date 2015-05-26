(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');


	rwApp.factory('rwDrw',
		['rwCtx1', 'rwPpl', function (rwCtx1, rwPpl) {

			var align;
			var famAlign;
			var select = true;
			var drawMarks = rwCtx1.drawMrks();
			var rwDrw = {};
			var spouceCnt = 0;
			var parentCnt = 0;

			rwDrw.reset = function () {
				spouceCnt = 0;
				parentCnt = 0;
			};

			var circleHWidth = function (centerX, centerY, radius, hY) {
				if (drawMarks) {
					rwCtx1.setDrawStyle('red', 'red');
					rwCtx1.drawDot(centerX, centerY);
				}
				var dY = Math.abs(hY - centerY);
				if (dY >= radius) {
					return 0;
				}
				var width = 2 * Math.sqrt(radius * radius - (dY * dY));
				if (drawMarks) {
					rwCtx1.setDrawStyle('orange', 'orange');
					rwCtx1.drawLine(centerX - width / 2, hY, centerX + width / 2, hY);
					rwCtx1.setDrawStyle('red', 'red');
					rwCtx1.drawDot(centerX, hY);
				}
				return width;
			};

			var alignPersonFamilyInfo = function (align, textY) {
				var fontSize = 16;
				var textHeight = rwCtx1.setFontSize(fontSize);
				var lineSpace = textHeight;
				textY += lineSpace * 2;
				
				var HWidth = rwCtx1.drawSquare() ? align.persBox.d.x - align.indent : circleHWidth(align.x, align.y, align.innerRadius, textY);
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
			var drawPerson = function (personId, x, y, HWidth, fontSize, select) {
				var textY = y;
				var textHeight = rwCtx1.setFontSize(fontSize);
				var lineSpace = textHeight;
				var centerX = rwCtx1.drawSquare() ? align.persBox.centerX() : align.x;
				var person = rwPpl.getPerson(personId);
				textY = rwCtx1.renderName(person, 'R', centerX, textY, HWidth, textHeight, lineSpace, select);
				textHeight = rwCtx1.setFontSize(fontSize * 3 / 4);
				rwCtx1.setTextStyle('black', 'center');
				rwCtx1.renderBirthDeath(person, 'R', centerX, textY, HWidth, textHeight, lineSpace, select);
				return textY;
			};

			rwDrw.background = function (personId) {
				rwDrw.reset();
				align = rwCtx1.drawBackground(personId);
			};


			rwDrw.actPerson = function (personId) {
				var fontSize = 16;
				rwCtx1.setFontSize(fontSize);
				rwCtx1.setTextStyle('black', 'center');
				var textX;
				var textY;
				var HWidth;
				if (rwCtx1.drawSquare()) {
					HWidth = align.persBox.d.x - align.indent;
					textY = align.persBox.top() + align.indent;
					textX = align.persBox.centerX();
				} else {
					HWidth = circleHWidth(align.x, align.y, align.innerRadius, textY) - rwCtx1.shrinkW();
					textY = align.y - align.innerRadius * 0.7;
					textX = align.x;
				}
				textY = drawPerson(personId, textX, textY, HWidth, 16, true);
				alignPersonFamilyInfo(align, textY);

			};

			rwDrw.actRest = function (person) {
				var i;
				if (person.spouses) {
					for (i = 0; i < person.spouses.length; i++) {
						rwDrw.spouseFamily(person.id, i);
					}
				}
				if (person.parents) {
					for (i = 0; i < person.parents.length; i++) {
						rwDrw.parentFamily(person.id, i);
					}
				}
			};

			rwDrw.spouseFamily = function (actId,whichSpouse) {
				var fontSize = 13;
				var textHeight = rwCtx1.setFontSize(fontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = rwCtx1.drawSquare() ? align.persBox.left() + secW/2 : align.x - secW / 2;
				var textY = famAlign.y;

				secW -= rwCtx1.shrinkW();

				if (drawMarks) {
					rwCtx1.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					rwCtx1.drawLine(x - halfW, textY, x + halfW, textY);
					rwCtx1.setDrawStyle('red', 'red');
					rwCtx1.drawDot(x, textY);
				}
				
				var person = rwPpl.getPerson(actId);
				var spouse = rwPpl.getPerson(person.spouses[whichSpouse].spouse);

				rwCtx1.setTextStyle('blue', 'center');
				var spouseSelID = 'p' + spouceCnt;
				if (secW > 300) {
					textY = rwCtx1.renderNameYearPl(spouse, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				} else {
					textY = rwCtx1.renderNameYear(spouse, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				}
				textY = rwCtx1.renderMarriage(person.spouses[whichSpouse].marriage, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				rwCtx1.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				rwCtx1.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				//fontSize = 3 * fontSize / 4;
				var seqGrp = ['d' + spouceCnt++,'c'];
				rwCtx1.renderChildren(person.spouses[whichSpouse].children, seqGrp, x, textY, secW, textY, fontSize, select);
			};

			rwDrw.parentFamily = function (actId, whichParent) {
				var fontSize = 13;
				var textHeight = rwCtx1.setFontSize(fontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = rwCtx1.drawSquare() ? align.persBox.right() - secW/2 : align.x + secW / 2;
				var textY = famAlign.y;
				

				secW -= rwCtx1.shrinkW();

				if (drawMarks) {
					rwCtx1.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					rwCtx1.drawLine(x - halfW, textY, x + halfW, textY);
					rwCtx1.setDrawStyle('red', 'red');
					rwCtx1.drawDot(x, textY);
				}

				var person = rwPpl.getPerson(actId);
				var husband = rwPpl.getPerson(person.parents[whichParent].husband);
				var wife = rwPpl.getPerson(person.parents[whichParent].wife);
				rwCtx1.setTextStyle('blue', 'center');

				var fatherSelID = 'f' + parentCnt;
				var motherSelID = 'm' + parentCnt;
				if (secW > 300) {
					textY = rwCtx1.renderNameYearPl(husband, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
					textY = rwCtx1.renderNameYearPl(wife, motherSelID, x, textY, secW, textHeight, lineSpace, select);
				} else {
					textY = rwCtx1.renderNameYear(husband, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
					textY = rwCtx1.renderNameYear(wife, motherSelID, x, textY, secW, textHeight, lineSpace, select);
				}
				textY = rwCtx1.renderMarriage(person.parents[whichParent].marriage, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
				rwCtx1.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				rwCtx1.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				//fontSize = 3 * fontSize / 4;
				var seqGrp = ['a' + parentCnt++,'s'];
				rwCtx1.renderChildren(person.parents[whichParent].children, seqGrp, x, textY, secW, textY, fontSize, select);
			};

			rwDrw.child = function (child) {
				console.log('rwDrw.child: ' + child);
			};

			return rwDrw;
		}]);
})();
