var app = angular.module('hackdate', ['ngRoute', 'ui.router', 'firebase']);

app.value('hackDateURL', 'https://hackdate.firebaseio.com/');

app.factory('Profiles', function(angularFireCollection, hackDateURL) {
  var ref = new Firebase(hackDateURL + 'profiles');
  return angularFireCollection(ref);
});

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('hackdate', {
      views: {
        '': {
          templateUrl: 'partials/hackdate.html'
        },
        'profiles': {
          templateUrl: 'partials/profiles.html',
          controller: function($scope, angularFire, hackDateURL) {
            var ref = new Firebase(hackDateURL + 'profiles');
            $scope.profiles = [];
            angularFire(ref, $scope, "profiles");
          }
        }
      }
    })
    .state('hackdate.register', {
      url: "/register",
      templateUrl: "partials/register.html",
      controller: function($scope, angularFireAuth) {
        $scope.user = {};

        $scope.register = function(registration) {
          $scope.user = angular.copy(registration);
          angularFireAuth.createUser($scope.user.email, $scope.user.password, function(error, user) {
            if (!error) {
              console.log('User Id: ' + user.id + ', Email: ' + user.email);
              angularFireAuth.login('password', {
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
    .state('hackdate.login', {
      url: "/login",
      templateUrl: "partials/login.html",
      controller: function($scope, angularFireAuth) {
        $scope.user = {};

        $scope.login = function(loginuser) {
          $scope.user = angular.copy(loginuser);
          angularFireAuth.login('password', {
            email: $scope.user.email,
            password: $scope.user.password
          });
        };

        $scope.reset = function() {
          $scope.loginuser = angular.copy($scope.user);
        };

        $scope.reset();
      }
    })
    .state('hackdate.logout', {
      url: "/logout",
      controller: function($scope, $state, angularFireAuth) {
        angularFireAuth.logout();
      }
    })
    .state('hackdate.profile', {
      url: "/profile",
      templateUrl: "partials/profile.html",
      controller: function($scope, angularFire, hackDateURL, Profiles) {
        console.log('accessing profile');
        console.log($scope.user);
        var profileUrl = hackDateURL + 'profiles/' + $scope.user.id;
        var ref = new Firebase(profileUrl);

        $scope.remote = {};
        angularFire(ref, $scope, 'remote').
        then(function() {
          console.log('setting remote');
          console.log($scope.remote);
          $scope.profile = angular.copy($scope.remote);

          $scope.update = function(profile) {
            console.log('update');
            $scope.remote = angular.copy(profile);
            console.log($scope.remote);
          };

          $scope.reset = function() {
            $scope.profile = {};
          };
        }, function(reason) {
          console.log('error setting remote');
          console.log(reason);

          Profiles.add($scope.remote, function() {
            console.log('going to profile after creating a profile');
            $state.go('hackdate.profile');
          });

        }, function(notification) {
          console.log(notification);
        });
      }
    });
  });

function MainCtrl($scope, $rootScope, $state, hackDateURL, angularFireAuth) {
  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  var hackDateRef = new Firebase(hackDateURL);
  angularFireAuth.initialize(hackDateRef, {scope: $scope, name: "user"});

  $scope.$on('angularFireAuth:login', function(evt, user) {
    $scope.user = user;
    $state.go('hackdate.profile');
  });

  $scope.$on('angularFireAuth:logout', function(evt) {
    $scope.user = null;
    $state.go('hackdate.login');
  });

  $scope.$on('angularFireAuth:error', function(evt, err) {
  });

  $rootScope.$on('$stateChangeStart', 
  function(event, toState, toParams, fromState, fromParams){ 
    console.log('changing to state: ');
    console.log(toState);
    if(toState.name != 'hackdate.login' && toState.name != 'hackdate.register') {
      if(!$scope.user) {
        event.preventDefault();
        // transitionTo() promise will be rejected with 
        // a 'transition prevented' error
        $state.go('hackdate.login');
      }
    }
  });
}

