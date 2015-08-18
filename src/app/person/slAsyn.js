
var slApp = angular.module('sourceLink');

// factories which place ascynchronous wrappers around functions
slApp.factory('alert',
	function ($window, $timeout) {

		function alert(message) {
			$timeout(function () {
				sweetAlert('sourceLink',message);
			});
		}

		return (alert);
	});


// Use new, injected prompt.
slApp.factory('prompt',
	function ($window, $timeout) {

		function prompt(message, defaultValue) {
			$timeout(function () {
				var response = $window.prompt(message, defaultValue);
/* why doesn't this work:
				response = sweetAlert({
					text: message,
					inputValue: defaultValue,
					type: 'input',
					showCancelButton: true,
					confirmButtonColor: slCSS.confirmButtonColor

				}, function (inputValue) {
					if (inputValue === false || inputValue === '') {
						return defaultValue;
					}
					return inputValue;
				});
*/
				return response;
			});
		}

		return (prompt);
	});


slApp.factory('confirm',
	function ($window, $timeout) {

		function confirm(message) {
			$timeout(function () {
				var response = $window.confirm(message);
/*
				var response = sweetAlert({
					text: message,
					showCancelButton: true
				}, function (isConfirm) {
					return isConfirm;
				});
*/
				return response;
			});

		}

		return (confirm);
	});
