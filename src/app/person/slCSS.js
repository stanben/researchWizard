(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Store the Style control for sourceLink javasript here
	slApp.factory('slCSS', function () {
		var slCSS = {};

		slCSS.icons = {};


		slCSS.init = function () {
			var male = new Image();
			male.src = 'assets/Male.png';
			male.onload = function () {
				slCSS.icons.M = male;
			};
			var female = new Image();
			female.src = 'assets/Female.png';
			female.onload = function () {
				slCSS.icons.F = female;
			};
			var unknown = new Image();
			unknown.src = 'assets/Unknown.png';
			unknown.onload = function () {
				slCSS.icons.U = unknown;
				slCSS.icons.u = unknown;
			};
			var recordHint = new Image();
			recordHint.src = 'assets/RecordHint.png';
			recordHint.onload = function () {
				slCSS.icons.RecordHint = recordHint;
			};
		};

		slCSS.personColors =  {
			U: {
				fill: '#FFFFFF',
				edge1: '#656565',
				edge2: '#C5C5C5'
			},
			M: {
				fill: '#C0EFFF',
				edge1: '#546376',
				edge2: '#AACBDA'
			},
			F: {
				fill: '#FFE0EB',
				edge1: '#74536D',
				edge2: '#EFBFBF'
			}
		};

		slCSS.unattachedSrcsColors = {
			fill: '#F3CCA2',
			edge1: '#7F7155',
			edge2: '#C5A56F'
		};

		slCSS.attachedSrcsColors = {
			fill: '#A0FDC4',
			edge1: '#2B7420',
			edge2: '#35AD70'

		};

		slCSS.matchBoxColors = {
			exact: {
				fill: 'rgba(128, 255, 128, 0.3)',
				stroke: '#00FF00'
			},
			near: {
				fill: 'rgba(255, 180, 128, 0.3)',
				stroke: '#FFFF00'
			},
			no: {
				fill: 'rgba(255, 180, 180, 0.3)',
				stroke: '#FF0000'
			}
		};

		slCSS.confirmButtonColor = '#ec6c62';

		slCSS.highliteSelection = slCSS.matchBoxColors.exact;
		slCSS.highliteLocation = {
			fill: 'rgba(0, 0, 0, 0.0)',
			stroke: '#A00000'
		};

		slCSS.font = 'Tahoma';

		slCSS.genderWidth = 12;
		slCSS.actvPersonFontSize = 16;
		slCSS.actvPersonInfoFontSize = 12;
		slCSS.famFontSize = 13;
		slCSS.attSrcTitleFontSize = 14;
		slCSS.attSrcFontSize = 11;

		slCSS.boxIndent = 20;

		slCSS.familyIndent = 20;

		return slCSS;
	});

})();