(function () {
	'use strict';
	var slApp = angular.module('sourceLink');

	slApp.factory('slUtl',  function ($q, $rootScope, fsApi) {
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

		slUtl.setProp = function(obj,prop,val) {
			if (obj[prop]) {
				if (obj[prop] !== val) {
					var opTyp = typeof obj[prop];
					var vTyp = typeof val;
					if (opTyp === vTyp) {
//						if (opTyp === 'string') {
//							console.log('set existing property: ' + prop + '=' + obj[prop] + ' to ' + val);
//						}
						return;
					}
					if (opTyp !== 'object' && vTyp === 'object') {
						obj[prop] = val;
					}
				}
			} else {
				obj[prop] = val;
			}
		};

		// merge all properties from fromObj to toObj
		// that do not exist in toObj
		slUtl.merge = function (toObj, fromObj) {
			for (var prop in fromObj) {
				if (fromObj.hasOwnProperty(prop)) {
					slUtl.setProp(toObj, prop, fromObj[prop]);
				}
			}
		};


		// perform a binary search on a sorted array a
		// return index of value if it exists else return -1
		// uses a compare function compareFunc(a,b) which returns 0
		// if (a === b) a negative number if (a < b) and a positive number
		// if (a > b)
		slUtl.binarySearchF = function (a, value, compareFunc) {
			var lo = 0;
			var hi = a.length - 1;
			var mid;
			while (lo <= hi) {
				mid = Math.floor((lo + hi) / 2);
				var diff = compareFunc(a[mid], value);
				if (diff > 0) {
					hi = mid - 1;
				} else if (diff < 0) {
					lo = mid + 1;
				} else {
					return mid;
				}
			}
			return -1;
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

		slUtl.refresh = function (target, source) {
			for (var propName in target) {
				if (target.hasOwnProperty(propName) && propName.charAt(0) !== '_') {
					delete target[propName];
				}
			}
			_.extend(target, source);
		};

		slUtl.getChildrenWithParentsId = function (children, childRelationships) {
			return _.map(children, function (child) {
				return {
					person: child,
					parentsId: _.find(childRelationships, function (rel) { return rel.$getChildId() === child.id; }).id
				};
			});
		};

		var currentUser = null;

		$rootScope.$on('newSession', function () {
			currentUser = null;
		});

		slUtl.getUser = function () {
			if (!!currentUser) {
				return $q.when(currentUser);
			}
			else {
				return fsApi.getCurrentUser().then(function (response) {
					currentUser = response.getUser();
					return currentUser;
				});
			}
		};

		return slUtl;
	});

})();
