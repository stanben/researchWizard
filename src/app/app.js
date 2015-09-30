

// this is the entry point of the sourceLink program
(function () {
	'use strict';			// Run in strict mode
	var slApp = angular.module('sourceLink', [
	// depends on these modules
//	'loDash',
//	'angularMoment',
//	'panzoom',
//	'ui.bootstrap',
//	'infinite-scroll',
//	'angular-growl',
	'templates-app',
	'templates-common',
	'ui.bootstrap',
	'ui.router.state',
	'ui.router'
	]);

	slApp.provider('fsApi', function () {
		/* jshint camelcase:false */
		var client;
		var client_id = '';
		var environment = '';
		var redirect_uri = '';

		this.setClientId = function (appKey) {
			client_id = appKey;
			return this;
		};

		this.setEnvironmentName = function (environmentName) {
			environment = environmentName;
			return this;
		};

		this.setRedirectUri = function (authCallback) {
			redirect_uri = authCallback;
			return this;
		};

		this.$get = function ($window, $http, $q) {
			if (client_id && environment && redirect_uri) {
				client = new $window.FamilySearch({
					app_key: client_id,
					environment: environment,
					auth_callback: redirect_uri,
					http_function: $http,				// $.ajax,
					deferred_function: $q.defer,		// $.Deferred
					/*
					timeout_function: $timeout,
					save_access_token: true,
					auto_expire: true,
					auto_signin: false,
					expire_callback: function () {
						$rootScope.$emit('sessionExpired');
					}
					*/
				});
			}

			return client;
		};

	});

	slApp.provider('fsLocation', function () {
		var locationFunctions;

		// locationFns = { // each function returns {prefix, path, search}
		//  getPersonLocation(personId)
		//  getCoupleLocation(coupleId)
		//  getParentsLocation(parentsId)
		//  getTreeLocation(personId)
		//  getFindAddLocation({husbandId,wifeId,fatherId,motherId,childIds,coupleId,parentsId,returnToPersonId,returnToCoupleId,returnToParentsId})
		//  getSourceBoxLocation({personId,coupleId,parentsId})
		// }
		this.configure = function (locationFns) {
			locationFunctions = locationFns;
		};

		this.$get = function ($location) {
			function join(opts) {
				var keyValuePairs = [];
				for (var prop in opts) {
					if (opts.hasOwnProperty(prop)) {
						keyValuePairs.push(encodeURIComponent(prop) + '=' + encodeURIComponent(opts[prop]));
					}
				}
				return keyValuePairs.join('&');
			}

			function getUrl(location) {
				var search = join(location.search);
				return encodeURI(location.prefix) + encodeURI(location.path) + (!!search ? '?' + search : '');
			}

			function setLocation(location) {
				$location.path(location.path);
				if (!!location.search) {
					$location.search(location.search);
				}
			}

			return {
				getPersonUrl: function (personId) {
					return getUrl(locationFunctions.getPersonLocation(personId));
				},
				setPersonLocation: function (personId) {
					setLocation(locationFunctions.getPersonLocation(personId));
				},
				getCoupleUrl: function (coupleId) {
					return getUrl(locationFunctions.getCoupleLocation(coupleId));
				},
				setCoupleLocation: function (coupleId) {
					setLocation(locationFunctions.getCoupleLocation(coupleId));
				},
				getParentsUrl: function (parentsId) {
					return getUrl(locationFunctions.getParentsLocation(parentsId));
				},
				setParentsLocation: function (parentsId) {
					setLocation(locationFunctions.getParentsLocation(parentsId));
				},
				getTreeUrl: function (personId, spouseId) {
					return getUrl(locationFunctions.getTreeLocation(personId, spouseId));
				},
				setTreeLocation: function (personId) {
					setLocation(locationFunctions.getTreeLocation(personId));
				},
				getFindAddUrl: function (opts) {
					return getUrl(locationFunctions.getFindAddLocation(opts));
				},
				setFindAddLocation: function (opts) {
					setLocation(locationFunctions.getFindAddLocation(opts));
				},
				getSourceBoxUrl: function (opts) {
					return getUrl(locationFunctions.getSourceBoxLocation(opts));
				},
				setSourceBoxLocation: function (opts) {
					setLocation(locationFunctions.getSourceBoxLocation(opts));
				}
			};
		};

	});

	slApp.config(function ($stateProvider, $urlRouterProvider) {	// configure $state Provider using $urlRouter Provider
		$urlRouterProvider.otherwise('/');	// Startup Route State is home
	});

	var getUri = function (url) {
		var loc = url.indexOf('/#');
		if (loc > 0) {
			return url.slice(0, loc);
		} else {
			var endchar = url.slice(-1);
			if (endchar === '/') {
				return url.slice(0, url.length - 1);
			}
		}
		return url;
	};

	slApp.config(function (fsApiProvider) {	// configure fsApi Provider
		// 'http://localhost:61848' 'http://sourcelinkfs.azurewebsites.net'
		var redirectUri = getUri(window.location.href);
		var env = 'production';		// 'beta' 'staging' 'sandbox'
		fsApiProvider
			.setClientId('a02j0000006na3iAAA')
			.setRedirectUri(redirectUri)
			.setEnvironmentName(env);
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
	slApp.controller('AppController', function ($scope, slInpt, slActv, slCSS) {
		slCSS.init();
		//$scope.environment = 'Sandbox';
		//$scope.environment = 'Beta';
		//$scope.environment = 'Staging';
		$scope.environment = 'Production';
		$scope.changeID = slInpt.changeID;
		$scope.viewInFS = slInpt.viewInFS;
		$scope.logout = slInpt.logout;
		$scope.returnToCanvas = slInpt.returnToCanvas;

		$scope.$on('$stateChangeStart', function (event, toState) {	// listen for $stateChangeStart event
			if (toState.resolve) {
				slActv.isBusy(); // $scope.busy = true;
			}
		});
		$scope.$on('$stateChangeSuccess', function () {	// listen for $stateChangeSuccess event
			slActv.notBusy(); // $scope.busy = false;
		});
		$scope.$on('$stateChangeError', function () {	// listen for $stateChangeError event
			slActv.notBusy(); // $scope.busy = false;
		});

	});

})();
