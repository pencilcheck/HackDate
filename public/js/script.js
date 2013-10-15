var app = angular.module('hackdate', ['ngRoute', 'ui.bootstrap', 'ui.router', 'firebase', '$strap.directives', 'ngGrid']);

app.value('hackDateURL', 'https://hackdate.firebaseio.com/');

app.directive('selectize', function($timeout) {
  return {
    restrict: 'A',
    link: function(Scope, element, attrs) {
      $timeout(function() {
        $(element).selectize(eval(attrs.selectize));
      });
    }
  };
});

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
        }//,
        //'profiles': {
          //templateUrl: 'partials/profiles.html',
          //controller: function($scope, angularFire, hackDateURL) {
            //var ref = new Firebase(hackDateURL + 'profiles');
            //$scope.profiles = [];
            //angularFire(ref, $scope, "profiles");
          //}
        //}
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
      controller: function($scope, $http, $timeout, angularFire, hackDateURL, Profiles) {
        console.log('accessing profile');
        console.log($scope.user);
        var profileUrl = hackDateURL + 'profiles/' + $scope.user.id;
        var ref = new Firebase(profileUrl);
        
        app.value('$strapConfig', {
          datepicker: {
            format: 'M d, yyyy'
          }
        });

        $scope.sexes = ['M', 'F'];
        $scope.relationship_status = ['Single', 'Married', 'Other'];
        $scope.intentions = ['Relationship', 'Friendship', 'Business Partner'];

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

          $scope.geolocate = function() {
            if(navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(function(position) {
                var latlng = position.coords.latitude+","+position.coords.longitude;
                var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng='+latlng+'&sensor=true';

                console.log(url);

                $http.get(url).success(function(result) {
                  console.log(result);
                  // Could discuss on which components we need or let users to filter and to store
                  // https://developers.google.com/maps/documentation/geocoding/#ReverseGeocoding
                  $scope.profile.location = result.results[0].formatted_address;
                });
              });
            } else {
              console.log("Browser doesn't supports it, use other ways");
            }
          };

          $scope.addQuestion = function() {
            if(!$scope.profile.qas) {
              $scope.profile.qas = [];
            }

            if(_.map($scope.profile.qas, function(qa) { return qa.question; }).indexOf($scope.new_question) > -1) {
              alert('Question already exist!');
            } else {
              $scope.profile.qas.push({
                type: 'user',
                question: $scope.new_question,
                answer: ''
              });
            }
          };

          $scope.removeQuestion = function(qa) {
            var index = $scope.profile.qas.indexOf(qa);
            if(index > -1) {
              $scope.profile.qas.splice(index, 1);
            }
          };

          $scope.setupQuestions = function() {
            var defaultQAs = [
              {
                type: 'default',
                question: 'Favorite food and why?',
                answer: ''
              },
              {
                type: 'default',
                question: 'Most embarrassing story',
                answer: ''
              },
              {
                type: 'default',
                question: 'Favorite memory',
                answer: ''
              },
              {
                type: 'default',
                question: 'What do you inspire to do in life?',
                answer: ''
              },
              {
                type: 'default',
                question: 'What are your biggest pet-peeves?',
                answer: ''
              },
              {
                type: 'default',
                question: 'Who is the most important person in your life & why?',
                answer: ''
              },
              {
                type: 'default',
                question: 'Thoughts about marriage/having a family?',
                answer: ''
              },
              {
                type: 'default',
                question: 'One startup idea that you had (e.g. failed idea or just in general)',
                answer: ''
              },
              {
                type: 'default',
                question: 'What is your most proudest moment?',
                answer: ''
              },
              {
                type: 'default',
                question: 'What do you do for fun?',
                answer: ''
              }
            ];

            if(!$scope.profile.qas || $scope.profile.qas && $scope.profile.qas.length == 0) {
              $scope.profile.qas = defaultQAs;
            }
          };

          $scope.setupQuestions();

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
    })
    .state('hackdate.interests', {
      url: "/interests",
      templateUrl: "partials/interests.html",
      controller: function($scope, angularFire, angularFireCollection, hackDateURL, Profiles) {
        // Shows all profiles that has the user can express interests to
        var user_id = $scope.user.id;
        var interestsUrl = hackDateURL+'profiles/'+user_id+'/interests';
        var interestsRef = new Firebase(interestsUrl);

        $scope.interests = [];
        angularFire(interestsRef, $scope, 'interests');

        $scope.profiles = Profiles;
        $scope.selected = [];
        $scope.gridOptions = {
          data: 'profiles',
          selectedItems: $scope.selected,
          columnDefs: [
            {
              field: '$id',
              displayName: 'ID'
            },
            {
              field: 'first_name',
              displayName: 'First Name'
            },
            {
              field: 'last_name',
              displayName: 'Last Name'
            },
            {
              field: 'birthday',
              displayName: 'Birthday'
            },
            {
              field: 'qas[0].question',
              displayName: 'Question'
            },
            {
              field: 'qas[0].answer',
              displayName: 'Answer'
            }
          ]
        };

        $scope.$on('ngGridEventData', function(){
          _.each($scope.profiles, function(el, ind) {
            var target_id = el.$id;

            if($scope.interests.indexOf(target_id) > -1) {
              $scope.gridOptions.selectRow(ind, true);
            }
          });
        });

        $scope.apply = function() {
          var unselected = _.difference($scope.profiles, $scope.selected); 

          _.each($scope.selected, function(el) {
            var target_id = el.$id;

            // Push target_id into interested list of current user
            if($scope.interests.indexOf(target_id) < 0) {
              $scope.interests.push(target_id);
            }
          });

          _.each(unselected, function(el) {
            var target_id = el.$id;

            // Remove target_id from interested list of current user
            var ind = $scope.interests.indexOf(target_id)
            if(ind > -1) {
              $scope.interests.splice(ind, 1);
            }
          });
        };
      }
    })
    .state('hackdate.interested', {
      url: "/interested",
      templateUrl: "partials/interested.html",
      controller: function($scope, angularFire, angularFireCollection, hackDateURL, Profiles) {
        // Similar to interests, so users can express interests to, but only shows profiles that has expressed interests in the user
        var user_id = $scope.user.id;
        var interestsUrl = hackDateURL+'profiles/'+user_id+'/interests';
        var interestsRef = new Firebase(interestsUrl);

        $scope.interests = [];
        angularFire(interestsRef, $scope, 'interests');

        $scope.profiles = [];
        $scope.remote = Profiles;
        $scope.$watch('remote', function(newVal) {
          var ref = new Firebase(hackDateURL + 'profiles/' + user_id);
          ref.once('value', function(snapshot) {
            var profile = snapshot.val();

            $scope.profiles = _.filter(newVal, function(el) {
              return el.interests.indexOf(user_id) > -1 && profile.interests.indexOf(el.$id) < 0;
            });
          });
        });

        $scope.selected = [];
        $scope.gridOptions = {
          data: 'profiles',
          selectedItems: $scope.selected,
          columnDefs: [
            {
              field: '$id',
              displayName: 'ID'
            },
            {
              field: 'first_name',
              displayName: 'First Name'
            },
            {
              field: 'last_name',
              displayName: 'Last Name'
            },
            {
              field: 'birthday',
              displayName: 'Birthday'
            },
            {
              field: 'qas[0].question',
              displayName: 'Question'
            },
            {
              field: 'qas[0].answer',
              displayName: 'Answer'
            }
          ]
        };

        $scope.$on('ngGridEventData', function(){
          _.each($scope.profiles, function(el, ind) {
            var target_id = el.$id;

            if($scope.interests.indexOf(target_id) > -1) {
              $scope.gridOptions.selectRow(ind, true);
            }
          });
        });

        $scope.apply = function() {
          var unselected = _.difference($scope.profiles, $scope.selected); 

          _.each($scope.selected, function(el) {
            var target_id = el.$id;

            // Push target_id into interested list of current user
            if($scope.interests.indexOf(target_id) < 0) {
              $scope.interests.push(target_id);
            }
          });

          _.each(unselected, function(el) {
            var target_id = el.$id;

            // Remove target_id from interested list of current user
            var ind = $scope.interests.indexOf(target_id)
            if(ind > -1) {
              $scope.interests.splice(ind, 1);
            }
          });
        };
      }
    })
    .state('hackdate.hook_ups', {
      url: "/hook_ups",
      templateUrl: "partials/hook_ups.html",
      controller: function($scope, angularFire, angularFireCollection, hackDateURL, Profiles) {

        var user_id = $scope.user.id;

        var url = hackDateURL+'profiles/'+user_id+'/hook_ups';
        var ref = new Firebase(url);
        $scope.hookUps = [];
        angularFire(ref, $scope, 'hookUps');

        $scope.profiles = [];
        var iRef = new Firebase(hackDateURL+'profiles/'+$scope.user.id+'/interests');
        iRef.once('value', function(snapshot) {
          var interests = snapshot.val();

          _.each(interests, function(el) {
            var ref = new Firebase(hackDateURL+'profiles/'+el);
            angularFireCollection(ref, function(snapshot) {
              var remote = snapshot.val();
              console.log(remote);
              _.extend(remote, {$id: parseInt(el)});
              if(remote.interests.indexOf($scope.user.id) > -1) {
                $scope.profiles.push(remote);
              }
            });
          });
        });

        $scope.selected = [];
        $scope.gridOptions = {
          data: 'profiles',
          selectedItems: $scope.selected,
          columnDefs: [
            {
              field: '$id',
              displayName: 'ID'
            },
            {
              field: 'first_name',
              displayName: 'First Name'
            },
            {
              field: 'last_name',
              displayName: 'Last Name'
            }
          ]
        };

        $scope.$on('ngGridEventData', function(){
          _.each($scope.profiles, function(el, ind) {
            var target_id = el.$id;

            if($scope.hookUps.indexOf(target_id) > -1) {
              $scope.gridOptions.selectRow(ind, true);
            }
          });
        });

        $scope.hook = function() {
          var unselected = _.difference($scope.profiles, $scope.selected); 

          _.each(unselected, function(el) {
            var target_id = el.$id;

            var ind = $scope.hookUps.indexOf(target_id)
            if(ind > -1) {
              $scope.hookUps.splice(ind, 1);
            }
          });

          _.each($scope.selected, function(el) {
            var target_id = el.$id;

            console.log($scope.hookUps);
            if($scope.hookUps.indexOf(target_id) < 0) {
              $scope.hookUps.push(target_id);
            }
          });
        };
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
    $state.go($scope.toState);
  });

  $scope.$on('angularFireAuth:logout', function(evt) {
    $scope.user = null;
    $state.go('hackdate.login');
  });

  $scope.$on('angularFireAuth:error', function(evt, err) {
    $scope.user = null;
    $state.go('hackdate.login');
  });

  $scope.toState = 'hackdate.login';

  $rootScope.$on('$stateChangeStart', 
  function(event, toState, toParams, fromState, fromParams){ 
    if(toState.name != 'hackdate.login' && toState.name != 'hackdate.register') {
      if(!$scope.user) {
        event.preventDefault();
        $scope.toState = toState.name;
      }
    }
  });
}

