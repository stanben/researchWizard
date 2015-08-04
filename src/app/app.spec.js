// describe test cases for sourceLink
describe('AppController', function () {
  describe('isCurrentUrl', function () {
    var AppCtrl, $location, $scope;

    beforeEach(module('sourceLink'));

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
