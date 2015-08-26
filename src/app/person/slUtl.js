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
