(function () {
	'use strict';
	var slApp = angular.module('sourceLink');
	
	// Initialization for person state
	// $stateParams come from all program ancestors see: $state.go('person', toParams
	slApp.config(function ($stateProvider) {
		
		$stateProvider.state('person', {
			url: '/person/:personId',
			controller: 'PersonController',
			templateUrl: 'person/person.tpl.html',
			data: { pageTitle: 'Person' },
			resolve: {
				personId: ['$stateParams', function ($stateParams) {
					return $stateParams.personId;
				}],
				person: ['$stateParams', 'fsApi', function ($stateParams, fsApi) {
					return fsApi.getPerson($stateParams.personId).then(function (response) {
						return response.getPerson();
					});
				} ]
			}
		});
	});


	slApp.controller('PersonController',
		function ($scope, $state, $rootScope, person, personId, fsApi,
			slUtl, slCtx1, slCtx2, slDrw, slPpl,
			slInpt, slActv, slTxt) {

		/*
		var sections = [
		'familyMembers',
		'sources'
		];

		$scope.states = {};
		sections.forEach(function (section) {
		$scope.states[section] = { value: section === 'lifeSketch' ? 'closed' : 'open' };
		});
		*/
		var canvas2 = angular.element.find('#canvas2')[0];
		var ctx2 = canvas2.getContext('2d');
		slCtx2.setCanvas(canvas2);
		slCtx2.setContext(ctx2);
		var canvas1 = angular.element.find('#canvas1')[0];
		var ctx1 = canvas1.getContext('2d');
		slCtx1.setCanvas(canvas1);
		slCtx1.setContext(ctx1);

		slTxt.pushMsg('<strong>click</strong> a field to confirm sources.   ' +
				'<strong>ctrl-click</strong> to select active person');

		angular.element(document.getElementById('description')).remove();
		angular.element(document.getElementById('buttons')).removeAttr('hidden');
		angular.element(document.getElementById('canvas1')).removeAttr('hidden');
		angular.element(document.getElementById('canvas2')).removeAttr('hidden');

		$scope.person = person;
		$scope.slInpt = slInpt;
		slActv.setPerson(person,personId);

		var unbindRestored = $rootScope.$on('restored', function () {
			fsApi.getPerson($scope.person.id).then(function (response) {
				slUtl.refresh($scope.person, response.getPerson());
			});
		});
		$scope.$on('$destroy', unbindRestored);

		$scope.$on('delete', function (event, person, changeMessage) {
			event.stopPropagation();
			person._busy = true;
			person.$delete(changeMessage).then(function () {
				person._busy = false;
				// should we display deleted person here like FS does instead of returning home?
				slUtl.getUser().then(function (user) {
					$state.go('person', { personId: user.personId });
					$rootScope.$emit('alert', { level: 'success', text: person.$getDisplayName() + ' deleted' });
				});
			});
		});
	});
})();

