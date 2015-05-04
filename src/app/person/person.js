(function () {
	'use strict';
	var rwApp = angular.module('researchWizard');


	// Initialization for person state
	// $stateParams come from all program ancestors see: $state.go('person', toParams
	rwApp.config(function ($stateProvider) {
		$stateProvider.state('person', {
			url: '/person/:personId',
			controller: 'PersonController',
			templateUrl: 'person/person.tpl.html',
			data: { pageTitle: 'Person' },
			resolve: {
				person: ['$stateParams', 'fsApi', function ($stateParams, fsApi) {
					return fsApi.getPerson($stateParams.personId).then(function (response) {
						return response.getPerson();
					});
				}],
				sources: ['_', '$q', '$stateParams', 'fsApi', function (_, $q, $stateParams, fsApi) {
					return fsApi.getPersonSourcesQuery($stateParams.personId).then(function (response) {
						return _.map(response.getSourceRefs(), function (sourceRef) {
							return {
								ref: sourceRef,
								description: response.getSourceDescription(sourceRef.$sourceDescriptionId),
								id: sourceRef.id
							};
						});
					});
				}]
			}
		});
	});


	rwApp.controller('PersonController', function ($scope, $state, $rootScope, person, sources, fsApi, fsUtils, fsCurrentUserCache, rwCtx, rwDrw) {

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
		var canvas = angular.element.find('canvas')[0];
		var ctx = canvas.getContext('2d');
		rwCtx.setCanvas(canvas);
		rwCtx.setContext(ctx);
		$scope.person = person;
		$scope.sources = sources;

		rwDrw.background(person);
		rwDrw.actPerson(person);

		sources.forEach(function (source) {
			fsUtils.mixinStateFunctions($scope, source);
		});

		var unbindRestored = $rootScope.$on('restored', function () {
			fsApi.getPerson($scope.person.id).then(function (response) {
				fsUtils.refresh($scope.person, response.getPerson());
			});
		});
		$scope.$on('$destroy', unbindRestored);

		$scope.$on('delete', function (event, person, changeMessage) {
			event.stopPropagation();
			person._busy = true;
			person.$delete(changeMessage).then(function () {
				person._busy = false;
				// should we display deleted person here like FS does instead of returning home?
				fsCurrentUserCache.getUser().then(function (user) {
					$state.go('person', { personId: user.personId });
					$rootScope.$emit('alert', { level: 'success', text: person.$getDisplayName() + ' deleted' });
				});
			});
		});
	});
})();
