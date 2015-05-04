(function(){
  'use strict';
  var rwApp = angular.module('researchWizard');
  
  // Login to familySearch, get userID and then go to person
  rwApp.config(function ($stateProvider) {
      $stateProvider.state('home', {
          url: '/',
          controller: 'HomeController',
          templateUrl: 'home/home.tpl.html',
          data: { pageTitle: 'Home' }
      });
  });

  rwApp.controller('HomeController', function ($scope, $state, $rootScope, fsApi, fsCurrentUserCache) {
      $scope.signIn = function() {
        fsApi.getAccessToken().then(function() {
          $rootScope.$emit('newSession');
          fsCurrentUserCache.getUser().then(function(user) {
            $state.go('person', { personId: user.personId });   // activate person sending personID as parameter
          });
        });
      };

    });
})();
