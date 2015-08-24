

// this is the entry point of the sourceLink program
(function () {
	'use strict';			// Run in strict mode
	var slApp = angular.module('sourceLink', [
	'fsReferenceClientShared',	// depends on these modules
	'templates-app',
	'templates-common',
	'ui.bootstrap',
	'ui.router.state',
	'ui.router'
	]);

	slApp.config(function ($stateProvider, $urlRouterProvider) {	// configure $state Provider using $urlRouter Provider
		$urlRouterProvider.otherwise('/');	// Startup Route State is home
	});

	slApp.config(function (fsApiProvider) {	// configure fsApi Provider
		/*
		var url = window.location.href;
		var loc = url.indexOf('/#');
		var redirectUri;
		if (loc > 0) {
			redirectUri = url.slice(0, loc);
		} else {
			redirectUri = url;
		}
		*/
		fsApiProvider
		.setClientId('a02j0000006na3iAAA')
		//.setEnvironmentName('sandbox')
		//.setEnvironmentName('beta')
		//.setEnvironmentName('staging')
		.setEnvironmentName('production')
		.setRedirectUri('http://localhost:61848');
		//.setRedirectUri('http://sourcelinkfs.azurewebsites.net');
		//.setRedirectUri(redirectUri);
	});


	slApp.config(function (fsLocationProvider) {	// configure fsLocation Provider
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

	slApp.run(function () {
		sweetAlert.setDefaults({
			title: 'sourceLink:',
			closeOnConfirm: true,
			confirmButtonColor: '#AEDEF4',
			imageUrl: 'assets/favicon-32x32.png'
		});
	});

	// $scope is the application object
	slApp.controller('AppController', function ($scope, fsApi, slInpt, slCSS) {
		//$scope.environment = 'Sandbox';
		//$scope.environment = 'Beta';
		//$scope.environment = 'Staging';
		slCSS.init();
		$scope.environment = 'Production';
		$scope.changeID = slInpt.changeID;
		$scope.viewInFS = slInpt.viewInFS;
		$scope.logout = slInpt.logout;
		$scope.returnToCanvas = slInpt.returnToCanvas;

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
