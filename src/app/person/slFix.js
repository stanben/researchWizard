(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	// Manage a list of things that should be fixed in familySearch
	slApp.factory('slFix', function () {
		var slFix = {};
		var fixes = [];	// fixes maintained in order found

		
		// return if fix was added.
		// return false if fix already exists
		slFix.add = function (fix) {
			for (var i = 0, len = fixes.length; i < len; i++) {
				if (fix === fixes[i]) {
					return false;
				}
			}
			fixes.push(fix);
			return true;
		};

		return slFix;
	});

})();
