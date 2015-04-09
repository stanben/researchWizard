(function(){
  'use strict';
  angular.module('researchWizard')
    .config(function ($stateProvider) {
      $stateProvider.state('tree', {
        url: '/tree/:personId?spouseId',
        controller: 'TreeController',
        templateUrl: 'tree/tree.tpl.html',
        data: { pageTitle: 'Tree' }
      });
    })
    .controller('TreeController', function ($scope, $stateParams) {
      $scope.personId = $stateParams.personId;
      $scope.spouseId = $stateParams.spouseId;

    });
})();
