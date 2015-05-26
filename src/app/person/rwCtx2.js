(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');
	rwApp.factory('rwCtx2', ['$window',
		function ($window) {
			var canvas2;	// Overlay Canvas where selection and interaction takes place
			var ctx2;		// 2d context of canvas2
			var canvasWidth;
			var canvasHeight;
			var rwCtx2 = {};

			rwCtx2.setCanvas = function (cnvs) {
				canvas2 = cnvs;
			};

			rwCtx2.setContext = function (context) {
				ctx2 = context;
			};


			rwCtx2.setDim = function (width, height) {
				canvas2.width = canvasWidth = width;
				canvas2.height = canvasHeight = height;
				ctx2.clearRect(0, 0, canvasWidth, canvasHeight);
			};

			//========================================================
			//========================================================
			//  Draw objects
			//========================================================
			rwCtx2.setDrawStyle = function (fillColor, strokeColor) {
				ctx2.fillStyle = fillColor;
				ctx2.strokeStyle = strokeColor;
			};

			rwCtx2.drawRect = function (rect) {
				ctx2.strokeRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
				//ctx2.stroke();
			};

			rwCtx2.fillRect = function (rect) {
				ctx2.fillRect(rect.loc.x, rect.loc.y, rect.d.x, rect.d.y);
			};

			rwCtx2.drawLine = function (x1, y1, x2, y2) {
				ctx2.beginPath();
				ctx2.moveTo(x1, y1);
				ctx2.lineTo(x2, y2);
				ctx2.stroke();
			};

			rwCtx2.drawDot = function (x, y) {
				rwCtx2.drawCircle(x, y, 1);
			};

			rwCtx2.drawCircle = function (centerX, centerY, radius) {
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
			rwCtx2.clearOverlay = function (rect) {
				ctx2.clearRect(rect.loc.x - 2, rect.loc.y - 2, rect.d.x + 4, rect.d.y + 4);
				if (rect.d.x < 0 || rect.d.y < 0) {
					$window.alert('rwCtx2.clearOverlay:  negative width or height');
				}
			};

			rwCtx2.highliteSelection = function (rect) {
				var solidRed = '#FF0000';
				var transpRed = 'rgba(255, 0, 0, 0.3)';
				rwCtx2.setDrawStyle(transpRed, solidRed);
				rwCtx2.fillRect(rect);
				rwCtx2.drawRect(rect);
			};

			rwCtx2.highlite = function (rect) {
				var solidRed = '#FF0000';
				rwCtx2.setDrawStyle(solidRed, solidRed);
				rwCtx2.drawRect(rect);
			};

			return rwCtx2;
		}]);

})();