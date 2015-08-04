(function(){
	'use strict';
	var slApp = angular.module('sourceLink');
	
	// Login to familySearch, get userID and then go to person
	slApp.config(function ($stateProvider) {
		$stateProvider.state('home', {
			url: '/',
			controller: 'HomeController',
			templateUrl: 'home/home.tpl.html',
			data: { pageTitle: 'Home' }
		});
	});

	slApp.controller('HomeController', function ($scope, $state, $rootScope, fsApi, fsCurrentUserCache) {
		var startPersonId /* = 'KZZ5-C12'*/;
		$scope.signIn = function () {
			fsApi.getAccessToken().then(function() {
				$rootScope.$emit('newSession');
				fsCurrentUserCache.getUser().then(function(user) {
				$state.go('person', { personId: startPersonId ? startPersonId : user.personId });	// activate person sending personID as parameter
				});
			});
		};
	});
})();
