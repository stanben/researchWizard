(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	var opacityOnWhite = function (color, opacity) {
		return Math.round(210 * (1.0 - opacity) + color * opacity);
	};

	var rgbatoRGB = function (rgba) {
		if (rgba.indexOf('rgba') !== 0) {
			return rgba;
		}
		var colors = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/);
		var opacity = Number(colors[3]);
		if (isNaN(opacity)) {
			return rgba;
		}
		var rgb = 'rgb(' + opacityOnWhite(Number(colors[0]),opacity) + ',' +
			opacityOnWhite(Number(colors[1]),opacity) + ',' +
			opacityOnWhite(Number(colors[2]), opacity) + ')';
		return rgb;
	};

	// Store the Style control for sourceLink javasript here
	slApp.factory('slCSS', function () {
		var slCSS = {};

		slCSS.icons = {};

		// use slCSS values to alter style of description
		// information in the html file
		slCSS.description = function () {
			var actPersarea = document.getElementsByClassName('actpersarea');
			var element;
			var aelem;
			var len = actPersarea.length;
			var i;
			for (i = 0; i < len; i++) {
				element = actPersarea[i];
				aelem = angular.element(element);
				aelem.css('border','2px solid' + slCSS.personColors.M.edge1);
				aelem.css('background-color', slCSS.personColors.M.fill);
			}
			var attsourcesarea = document.getElementsByClassName('attsourcesarea');
			len = attsourcesarea.length;
			for (i = 0; i < len; i++) {
				element = attsourcesarea[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.attachedSrcsColors.edge1);
				aelem.css('background-color', slCSS.attachedSrcsColors.fill);
			}
			var posssourcesarea = document.getElementsByClassName('posssourcesarea');
			len = posssourcesarea.length;
			for (i = 0; i < len; i++) {
				element = posssourcesarea[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.unattachedSrcsColors.edge1);
				aelem.css('background-color', slCSS.unattachedSrcsColors.fill);
			}
			var maleperson = document.getElementsByClassName('maleperson');
			len = maleperson.length;
			for (i = 0; i < len; i++) {
				element = maleperson[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.personColors.M.edge1);
				aelem.css('background-color', slCSS.personColors.M.fill);
			}
			var femaleperson = document.getElementsByClassName('femaleperson');
			len = femaleperson.length;
			for (i = 0; i < len; i++) {
				element = femaleperson[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.personColors.F.edge1);
				aelem.css('background-color', slCSS.personColors.F.fill);
			}
			var unknownperson = document.getElementsByClassName('unknownperson');
			len = unknownperson.length;
			for (i = 0; i < len; i++) {
				element = unknownperson[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.personColors.U.edge1);
				aelem.css('background-color', slCSS.personColors.U.fill);
			}
			var vitallocation = document.getElementsByClassName('vitallocation');
			len = vitallocation.length;
			for (i = 0; i < len; i++) {
				element = vitallocation[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.highliteSelection.stroke);
			}
			var vitalselect = document.getElementsByClassName('vitalselect');
			len = vitalselect.length;
			var rgb = rgbatoRGB(slCSS.highliteSelection.fill);
			for (i = 0; i < len; i++) {
				element = vitalselect[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.highliteSelection.stroke);
				aelem.css('background-color', rgb);
			}
			var vitalconfirm = document.getElementsByClassName('vitalconfirm');
			len = vitalconfirm.length;
			rgb = rgbatoRGB(slCSS.matchBoxColors.exact.fill);
			for (i = 0; i < len; i++) {
				element = vitalconfirm[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.matchBoxColors.exact.stroke);
				aelem.css('background-color', rgb);
			}
			var vitalnear = document.getElementsByClassName('vitalnear');
			len = vitalnear.length;
			rgb = rgbatoRGB(slCSS.matchBoxColors.near.fill);
			for (i = 0; i < len; i++) {
				element = vitalnear[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.matchBoxColors.near.stroke);
				aelem.css('background-color', rgb);
			}
			var vitalno = document.getElementsByClassName('vitalno');
			len = vitalno.length;
			rgb = rgbatoRGB(slCSS.matchBoxColors.no.fill);
			for (i = 0; i < len; i++) {
				element = vitalno[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.matchBoxColors.no.stroke);
				aelem.css('background-color', rgb);
			}
			var sourcelocation = document.getElementsByClassName('sourcelocation');
			len = sourcelocation.length;
			for (i = 0; i < len; i++) {
				element = sourcelocation[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.highliteLocation.stroke);
			}
			var sourceselect = document.getElementsByClassName('sourceselect');
			len = sourceselect.length;
			rgb = rgbatoRGB(slCSS.highliteLocation.fill);
			for (i = 0; i < len; i++) {
				element = sourceselect[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.highliteLocation.stroke);
				aelem.css('background-color', rgb);
			}
			var tablereturn = document.getElementsByClassName('tablereturn');
			len = tablereturn.length;
			for (i = 0; i < len; i++) {
				element = tablereturn[i];
				aelem = angular.element(element);
				aelem.css('border', '2px solid' + slCSS.tableReturn.stroke);
				aelem.css('background-color', slCSS.tableReturn.fill);
				aelem.css('color', slCSS.tableReturn.stroke);
			}

		};


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
			slCSS.description();
		};

		slCSS.personColors =  {
			U: {
				fill: '#C8C8C8',
				edge1: '#656565',
				edge2: '#C5C5C5'
			},
			M: {
				fill: '#B8D8FF',
				edge1: '#546376',
				edge2: '#AACBDA'
			},
			F: {
				fill: '#FFCACA',
				edge1: '#74536D',
				edge2: '#EFBFBF'
			}
		};

		slCSS.unattachedSrcsColors = {
			fill: '#C3BDB1',
			edge1: '#7F7155',
			edge2: '#C5A56F'
		};

		slCSS.attachedSrcsColors = {
			fill: '#A6FFCA',
			edge1: '#2B7420',
			edge2: '#35AD70'

		};

		slCSS.matchBoxColors = {
			exact: {
				fill: 'rgba(128, 255, 128, 0.3)',
				stroke: '#00A000'
			},
			near: {
				fill: 'rgba(255, 255, 100, 0.3)',
				stroke: '#A0A000'
			},
			no: {
				fill: 'rgba(255, 180, 180, 0.3)',
				stroke: '#FF0000'
			}
		};

		slCSS.confirmButtonColor = '#ec6c62';

		slCSS.highliteSelection = slCSS.matchBoxColors.exact;
		slCSS.highliteLocation = {
			fill: 'rgba(255, 0, 0, 0.3)',
			stroke: '#A00000'
		};

		slCSS.tableReturn = {
			fill: '#FFEE66',
			stroke: '#A04444'
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