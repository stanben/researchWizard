(function () {
var rwApp = angular.module('researchWizard');
rwApp.directive('rwDrawChild', ['child', 'rwDrw',
	function (child, rwDrw) {
		rwDrw.child(child);
	}]);
})();