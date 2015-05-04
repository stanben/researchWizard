(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');

	rwApp.factory('rwTxt', function () {
		var rwTxt = {};
		console.log('start rwTxt factory');
		//========================================================
		// return true if string is defined and is not empty
		rwTxt.isValid = function (string) {
			if (string !== undefined && string !== '') {
				return true;
			}
			return false;
		};

		rwTxt.trimEndSpace = function (text) {
			if (text.charAt(text.length - 1) === ' ') {
				return text.substring(0, text.length - 1);
			}
			return text;
		};

		rwTxt.createLine = function (list) {
			var line = '';
			for (var i = 0; i < list.length; i++) {
				if (rwTxt.isValid(list[i])) {
					if (rwTxt.isValid(line)) {
						line += ' ' + list[i];
					} else {
						line += list[i];
					}
				}
			}
			return line;
		};

		return rwTxt;
	});
})();