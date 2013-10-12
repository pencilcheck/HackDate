var app = angular.module('hackdate', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('register', {
      url: "/register",
      templateUrl: "partials/login.html",
      controller: function($scope) {
        $scope.user = {};

        $scope.register = function(registration) {
          $scope.user = angular.copy(registration);
          console.log($scope.user);
          $scope.auth.createUser($scope.user.email, $scope.user.password, function(error, user) {
            if (!error) {
              console.log('User Id: ' + user.id + ', Email: ' + user.email);
              $scope.auth.login('password', {
                email: $scope.user.email,
                password: $scope.user.password
              });
            } else {
              console.log(error);
            }
          });
        };

        $scope.reset = function() {
          $scope.registration = angular.copy($scope.user);
        };

        $scope.reset();
      }
    })
    .state('login', {
      url: "/login",
      templateUrl: "partials/login.html",
      controller: function($scope) {
        $scope.user = {};

        $scope.registration = function(registration) {
          $scope.user = angular.copy(registration);
          $scope.auth.login('password', {
            email: $scope.user.email,
            password: $scope.user.password
          });
        };

        $scope.reset = function() {
          $scope.registration = angular.copy($scope.user);
        };

        $scope.reset();
      }
    })
    .state('profile', {
      url: "/profile",
      templateUrl: "partials/profile.html",
      controller: function($scope) {
        // Not done
        $scope.reset = function() {
          $scope.profile = angular.copy($scope.user);
        };

        $scope.reset();
      }
    });
  });

function MainCtrl($scope, $state) {
  var chatRef = new Firebase('https://hackdate.firebaseio.com/');
  $scope.auth = new FirebaseSimpleLogin(chatRef, function(error, user) {
    if (error) {
      // an error occurred while attempting login
      console.log(error);
    } else if (user) {
      $scope.$apply(function() {
        $scope.user = user;
      });
      // user authenticated with Firebase
      console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
      console.log($scope.user);
    } else {
      // user is logged out
      $scope.$apply(function() {
        $scope.user = {};
      });
    }
  });

  $scope.$watch('user', function(newVal) {
    if(newVal && newVal.length != 0) {
      $state.go('profile');
    }
  });
}

