(function () {
	'use strict';
	var slApp = angular.module('sourceLink');
	slApp.factory('slCtx2', ['slCSS', 'alert',
		function (slCSS,alert) {
			var canvas2;	// Overlay Canvas where selection and interaction takes place
			var ctx2;		// 2d context of canvas2
			var canvasWidth;
			var canvasHeight;
			var slCtx2 = {};

			slCtx2.setCanvas = function (cnvs) {
				canvas2 = cnvs;
			};

			slCtx2.setContext = function (context) {
				ctx2 = context;
			};


			slCtx2.setDim = function (width, height) {
				canvas2.width = canvasWidth = width;
				canvas2.height = canvasHeight = height;
				ctx2.clearRect(0, 0, canvasWidth, canvasHeight);
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================
			slCtx2.lineWidth = function (width) {
				ctx2.lineWidth = width;
			};

			slCtx2.setDrawStyle = function (fillColor, strokeColor) {
				ctx2.fillStyle = fillColor;
				ctx2.strokeStyle = strokeColor;
			};

			slCtx2.drawRect = function (rect) {
				ctx2.strokeRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
				//ctx2.stroke();
			};

			slCtx2.fillRect = function (rect) {
				ctx2.fillRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			slCtx2.drawLine = function (x1, y1, x2, y2) {
				ctx2.beginPath();
				ctx2.moveTo(x1, y1);
				ctx2.lineTo(x2, y2);
				ctx2.stroke();
			};

			slCtx2.drawDot = function (x, y) {
				slCtx2.drawCircle(x, y, 1);
			};

			slCtx2.drawCircle = function (centerX, centerY, radius) {
				ctx2.beginPath();
				ctx2.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx2.closePath();
				ctx2.fill();
				ctx2.stroke();
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================
			slCtx2.clearOverlay = function (rect) {
				ctx2.clearRect(rect.loc.x - 4, rect.loc.y - 4, rect.d.x + 8, rect.d.y + 8);
				if (rect.d.x < 0 || rect.d.y < 0) {
					alert('slCtx2.clearOverlay:  negative width or height');
				}
			};

			// Can set different color for highliting within each region
			var selectionHltColor = [
				slCSS.highliteSelection,
				slCSS.highliteLocation,
				slCSS.highliteLocation
			];

			slCtx2.highliteSelection = function (region, rect) {
				slCtx2.lineWidth(3);
				var color = selectionHltColor[region];
				slCtx2.setDrawStyle(color.fill, color.stroke);
				slCtx2.fillRect(rect);
				slCtx2.drawRect(rect);
			};

			// Can set different color for highliting within each region
			var locationHltColor = [
				slCSS.highliteSelection,
				slCSS.highliteLocation,
				slCSS.highliteLocation
			];

			var locationHltWidth = [2, 3, 3];

			slCtx2.highlite = function (region, rect) {
				slCtx2.lineWidth(locationHltWidth[region]);
				var color = locationHltColor[region];
				slCtx2.setDrawStyle(color.fill, color.stroke);
				slCtx2.drawRect(rect);
			};

			return slCtx2;
		}]);

})();
