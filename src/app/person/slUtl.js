(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	slApp.factory('slUtl',  function () {
		var slUtl = {};

		// return true if the object is empty
		slUtl.isEmpty = function (obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					return false;
				}
			}
			return true;
		};

		// perform a binary search on a sorted array a
		// return index of value if it exists else return -1
		slUtl.binarySearch = function (a, value) {
			var lo = 0;
			var hi = a.length - 1;
			var mid;
			while (lo <= hi) {
				mid = Math.floor((lo + hi) / 2);
				if (a[mid] > value) {
					hi = mid - 1;
				} else if (a[mid] < value) {
					lo = mid + 1;
				} else {
					return mid;
				}
			}
			return -1;
		};

		return slUtl;
	});

})();
