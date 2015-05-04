(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');


	rwApp.factory('rwDrw',
		['rwCtx', function (rwCtx) {

			var align;
			var famAlign;
			var select = true;
			var drawMarks = rwCtx.drawMrks();
			var rwDrw = {};
			var spouceCnt = 0;
			var parentCnt = 0;

			rwDrw.reset = function () {
				spouceCnt = 0;
				parentCnt = 0;
			};

			var circleHWidth = function (centerX, centerY, radius, hY) {
				if (drawMarks) {
					rwCtx.setDrawStyle('red', 'red');
					rwCtx.drawDot(centerX, centerY);
				}
				var dY = Math.abs(hY - centerY);
				if (dY >= radius) {
					return 0;
				}
				var width = 2 * Math.sqrt(radius * radius - (dY * dY));
				if (drawMarks) {
					rwCtx.setDrawStyle('orange', 'orange');
					rwCtx.drawLine(centerX - width / 2, hY, centerX + width / 2, hY);
					rwCtx.setDrawStyle('red', 'red');
					rwCtx.drawDot(centerX, hY);
				}
				return width;
			};

			var alignPersonFamilyInfo = function (align, textY) {
				var fontSize = 16;
				var textHeight = rwCtx.setFontSize(fontSize);
				var lineSpace = textHeight;
				textY += lineSpace * 2;
				var HWidth = circleHWidth(align.x, align.y, align.innerRadius, textY);
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
			var drawPerson = function (person, x, y, HWidth, fontSize, select) {
				var textY = y;
				var textHeight = rwCtx.setFontSize(fontSize);
				var lineSpace = textHeight;

				textY = rwCtx.renderName(person, 'R', align.x, textY, HWidth, textHeight, lineSpace, select);
				textHeight = rwCtx.setFontSize(fontSize * 3 / 4);
				rwCtx.setTextStyle('black', 'center');
				rwCtx.renderBirthDeath(person, 'R', align.x, textY, HWidth, textHeight, lineSpace, select);
				return textY;
			};

			rwDrw.background = function (person) {
				if (align === undefined) {
					align = rwCtx.drawBackground(person);
				}
			};


			rwDrw.actPerson = function (person) {
				rwCtx.setFontSize(16);
				rwCtx.setTextStyle('black', 'center');
				var textY = align.y - align.innerRadius * 0.7;
				var HWidth = circleHWidth(align.x, align.y, align.innerRadius, textY) - rwCtx.shrinkW();
				textY = drawPerson(person, align.x, textY, HWidth, 16, true);
				alignPersonFamilyInfo(align, textY);
			};

			rwDrw.spouseFamily = function (actId,family,couple,children) {
				var fontSize = 13;
				var textHeight = rwCtx.setFontSize(fontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = align.x - secW / 2;
				var textY = famAlign.y;

				secW -= rwCtx.shrinkW();

				if (drawMarks) {
					rwCtx.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					rwCtx.drawLine(x - halfW, textY, x + halfW, textY);
					rwCtx.setDrawStyle('red', 'red');
					rwCtx.drawDot(x, textY);
				}

				var spouse;
				if (family.husband.id === actId) {
					spouse = family.wife;
				} else {
					spouse = family.husband;
				} 
				rwCtx.setTextStyle('blue', 'center');
				var spouseSelID = 'p' + spouceCnt;
				textY = rwCtx.renderNameYear(spouse, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				textY = rwCtx.renderMarriage(couple, spouseSelID, x, textY, secW, textHeight, lineSpace, select);
				rwCtx.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				rwCtx.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				//fontSize = 3 * fontSize / 4;
				var seqGrp = 'd' + spouceCnt++;
				rwCtx.renderChildren(seqGrp, children, x, textY, secW, textY, fontSize, select);
			};

			rwDrw.parentFamily = function (family, couple, children) {
				var fontSize = 13;
				var textHeight = rwCtx.setFontSize(fontSize);
				var lineSpace = textHeight;
				var secW = famAlign.w / 2;
				var x = align.x + secW / 2;
				var textY = famAlign.y;
				

				secW -= rwCtx.shrinkW();

				if (drawMarks) {
					rwCtx.setDrawStyle('orange', 'orange');
					var halfW = secW / 2;
					rwCtx.drawLine(x - halfW, textY, x + halfW, textY);
					rwCtx.setDrawStyle('red', 'red');
					rwCtx.drawDot(x, textY);
				}

				var husband = family.husband;
				var wife = family.wife;
				rwCtx.setTextStyle('blue', 'center');

				var fatherSelID = 'f' + parentCnt;
				var motherSelID = 'm' + parentCnt;
				textY = rwCtx.renderNameYear(husband, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
				textY = rwCtx.renderNameYear(wife, motherSelID, x, textY, secW, textHeight, lineSpace, select);
				textY = rwCtx.renderMarriage(couple, fatherSelID, x, textY, secW, textHeight, lineSpace, select);
				rwCtx.setDrawStyle('black', 'black');
				var lineY = textY - textHeight / 2;
				rwCtx.drawLine(x - secW / 2, lineY, x + secW / 2, lineY);
				textY += lineSpace;
				//fontSize = 3 * fontSize / 4;
				var seqGrp = 'a' + parentCnt++;
				rwCtx.renderChildren(seqGrp, children, x, textY, secW, textY, fontSize, select);
			};

			rwDrw.child = function (child) {
				console.log('rwDrw.child: ' + child);
			};

			return rwDrw;
		}]);
})();
