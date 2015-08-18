// Defined Geometric Objects within sourceLink
(function () {
	'use strict';
	var slApp = angular.module('sourceLink');
	slApp.factory('slGeom', function () {
		var slGeom = {};

		//========================================================
		// create an x,y point
		slGeom.xy = function (x, y) {
			this.x = x;
			this.y = y;
		};

		//========================================================
		// return bounding rectangle for a text segment using
		// left X postion of text.  Y placement, width of text and
		// height of text.
		slGeom.rect = function (leftX, locY, width, height) {
			var growTxtR = 0.1 * height;
			return new slGeom.rectangle(leftX - growTxtR, locY + 0.2 * height - growTxtR, width + 2 * growTxtR, height + 2 * growTxtR);
		};

		//========================================================
		// create rectangle object which consists of an x,y location (loc)
		// and a delta x,y width and length (d).
		slGeom.rectangle = function (x, y, width, height) {

			this.loc = new slGeom.xy(x, y);
			this.d = new slGeom.xy(width, height);
			
			// methods seperated for better viewing
			this.m = {
				// returns a new rectangle that has shrunk horizontally
				// and vertically by dimension - dim.
				shrink: function (dim) {
					var double = 2 * dim;
					return new slGeom.rectangle(this.loc.x + dim,
						this.loc.y + dim,
						this.d.x - double,
						this.d.y - double);
				}.bind(this),

				centerX: function () {
					return this.loc.x + this.d.x / 2;
				}.bind(this),

				centerY: function () {
					return this.loc.y + this.d.y / 2;
				}.bind(this),

				left: function () {
					return this.loc.x;
				}.bind(this),

				right: function () {
					return this.loc.x + this.d.x;
				}.bind(this),

				top: function () {
					return this.loc.y;
				}.bind(this),

				bottom: function () {
					return this.loc.y + this.d.y;
				}.bind(this),

				clone: function () {
					return new slGeom.rectangle(this.loc.x, this.loc.y, this.d.x, this.d.y);
				}.bind(this),

				setLeft: function (v) {
					this.loc.x = v;
				}.bind(this),

				setRight: function (v) {
					this.d.x = v - this.loc.x;
				}.bind(this),

				setTop: function (v) {
					this.loc.y = v;
				}.bind(this),

				setBottom: function (v) {
					this.d.y = v - this.loc.y;
				}.bind(this)
			};
		};

		return slGeom;

	});
})();
