// describe test cases for researchWizard
describe('AppController', function () {
  describe('isCurrentUrl', function () {
    var AppCtrl, $location, $scope;

    beforeEach(module('researchWizard'));

    beforeEach(inject(function ($controller, _$location_, $rootScope) {
      $location = _$location_;
      $scope = $rootScope.$new();
      AppCtrl = $controller('AppController', { $location: $location, $scope: $scope });
    }));

    it('should pass a dummy test', inject(function () {
      expect(AppCtrl).toBeTruthy();         //expect AppCtrl to be true
    }));
  });
});

