

// this is the entry point of the researchWizard program
(function () {
	'use strict';						// Run in strict mode
	var rwApp = angular.module('researchWizard', [
	'fsReferenceClientShared',		// depends on these modules
	'templates-app',
	'templates-common',
	'ui.bootstrap',
	'ui.router.state',
	'ui.router'
	]);

	rwApp.config(function ($stateProvider, $urlRouterProvider) {	// configure $state Provider using $urlRouter Provider
		$urlRouterProvider.otherwise('/');		// Startup Route State is home
	});

	rwApp.config(function (fsApiProvider) {	// configure fsApi Provider
		fsApiProvider
			.setClientId('WCQY-7J1Q-GKVV-7DNM-SQ5M-9Q5H-JX3H-CMJK')
			//.setClientId('a0T3000000BPxjQEAT')
			.setEnvironmentName('sandbox')
			.setRedirectUri('http://localhost:9000/#!/auth');
		//.setEnvironmentName('beta')
		//.setRedirectUri('http://demo.werelate.org/#/auth');
	});


	rwApp.config(function (fsLocationProvider) {	// configure fsLocation Provider
		var prefix = '/#';
		fsLocationProvider.configure({
			getPersonLocation: function (personId) {
				return {
					prefix: prefix,
					path: '/person/' + personId
				};
			},
			getCoupleLocation: function (coupleId) {
				return {
					prefix: prefix,
					path: '/couple/' + coupleId
				};
			},
			getParentsLocation: function (parentsId) {
				return {
					prefix: prefix,
					path: '/parents/' + parentsId
				};
			},
			getTreeLocation: function (personId, opts) {
				return {
					prefix: prefix,
					path: '/tree/' + personId,
					search: opts
				};
			},
			getFindAddLocation: function (opts) {
				return {
					prefix: prefix,
					path: '/find-add',
					search: opts
				};
			},
			getSourceBoxLocation: function (opts) {
				return {
					prefix: prefix,
					path: '/source-box',
					search: opts
				};
			}
		});
	});

	rwApp.run( function () {
	});

	// $scope is the application object
	rwApp.controller('AppController', function ($scope) {
		$scope.environment = 'Sandbox';
		//$scope.environment = 'Beta';

		// don't forget to edit index.html to add {Track:js} script on demo

		$scope.$on('$stateChangeStart', function (event, toState) {	// listen for $stateChangeStart event
			if (toState.resolve) {
				$scope.busy = true;
			}
		});
		$scope.$on('$stateChangeSuccess', function () {	// listen for $stateChangeSuccess event
			$scope.busy = false;
		});
		$scope.$on('$stateChangeError', function () {	// listen for $stateChangeError event
			$scope.busy = false;
		});

	});

})();



