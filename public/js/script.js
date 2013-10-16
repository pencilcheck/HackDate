var userId = -1;
var app = angular.module('hackdate', ['ngRoute', 'ui.bootstrap', 'ui.router', 'firebase', '$strap.directives', 'ngGrid']);

app.value('hackDateURL', 'https://hackdate.firebaseio.com/');
//app.value('profilesRef', new Firebase(hackDateURL + 'profiles'));

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
        var profileUrl = hackDateURL + 'profiles/' + parseInt($scope.user.id);
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
      resolve: {
        interestsRef: function($rootScope, hackDateURL) {
          var userId = $rootScope.userId; // $scope will trigger error
          var url = hackDateURL+'profiles/'+userId+'/interests'
          return new Firebase(url);
        },

        profiles: function($q, angularFireCollection, hackDateURL) {
          var deferred = $q.defer();
          angularFireCollection(new Firebase(hackDateURL + 'profiles'), function(snapshot) {
            var profiles = snapshot.val();
            profiles = _.map(profiles, function(el, ind) {
              el.$id = parseInt(ind);
              return el;
            });

            deferred.resolve(profiles);
          });
          return deferred.promise;
        },

        columnDefs: function() {
          return [
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
          ];
        }
      },
      url: "/interests",
      templateUrl: "partials/interests.html",
      controller: 'MatchingCtrl'
    })
    .state('hackdate.interested', {
      // Similar to interests, so users can express interests to, but only shows profiles that has expressed interests in the user
      resolve: {
        interestsRef: function($rootScope, hackDateURL) {
          var userId = $rootScope.userId; // $scope will trigger error
          var url = hackDateURL+'profiles/'+userId+'/interests'
          return new Firebase(url);
        },

        profiles: function($rootScope, $q, angularFireCollection, hackDateURL) {
          var deferred = $q.defer();
          var userId = $rootScope.userId; // $scope will trigger error
          var ref = new Firebase(hackDateURL + 'profiles');
          ref.once('value', function(snapshot) {
            var profiles = snapshot.val();
            profiles = _.map(profiles, function(el, ind) {
              return _.extend(el, {$id: ind});
            });
            var resolved = _.filter(profiles, function(el) {
              return el.interests.indexOf(userId) > -1;
            });
            deferred.resolve(resolved);
          });
          return deferred.promise;
        },

        columnDefs: function() {
          return [
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
          ];
        }
      },
      url: "/interested",
      templateUrl: "partials/interested.html",
      controller: 'MatchingCtrl'
    })
    .state('hackdate.hook_ups', {
      resolve: {
        interestsRef: function($rootScope, hackDateURL) {
          var userId = $rootScope.userId; // $scope will trigger error
          var url = hackDateURL+'profiles/'+userId+'/hook_ups'
          return new Firebase(url);
        },

        profiles: function($rootScope, $q, angularFireCollection, hackDateURL) {
          var deferred = $q.defer();
          var userId = $rootScope.userId; // $scope will trigger error
          var url = hackDateURL+'profiles/'+userId+'/interests';
          var ref = new Firebase(url);

          ref.once('value', function(snapshot) {
            var interests = snapshot.val();
            var done = 0;
            var profiles = [];

            _.each(interests, function(el) {
              var iRef = new Firebase(hackDateURL+'profiles/'+el);
              iRef.once('value', function(snapshot) {
                var remote = snapshot.val();

                _.extend(remote, {$id: parseInt(el)}); // just in case
                if(remote.interests.indexOf(userId) > -1) {
                  profiles.push(remote);
                }
                deferred.resolve(profiles);
                console.log(profiles);
              });
            });
            
          });

          return deferred.promise;
        },

        columnDefs: function() {
          return [
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
          ];
        }
      },
      url: "/hook_ups",
      templateUrl: "partials/hook_ups.html",
      controller: 'MatchingCtrl'
    })
    .state('hackdate.messages', {
      url: "/messages",
      templateUrl: "partials/messages.html",
      controller: function($scope, $rootScope, angularFire, angularFireCollection, hackDateURL) {
        var userId = $rootScope.userId;
        var userRef = new Firebase(hackDateURL+'/profiles/'+userId+'/first_name');
        userRef.once('value', function(snapshot) {
          $scope.username = snapshot.val();
        });

        $scope.globalChannels = {};
        angularFire(new Firebase(hackDateURL+'/channels'), $scope, 'globalChannels').
        then(function() {
          $scope.globalChannelsReady = true;
        });

        $scope.channels = {};
        angularFire(new Firebase(hackDateURL+'/profiles/'+userId+'/channels'), $scope, 'channels').
        then(function() {
          $scope.channelsReady = true;
        });

        $scope.hookUps = [];
        angularFire(new Firebase(hackDateURL+'/profiles/'+userId+'/hook_ups'), $scope, 'hookUps').
        then(function() {
          $scope.hookUpsReady = true;
        });

        $scope.$watch('hookUpsReady && channelsReady && globalChannelsReady', function(newVal) {
          // Making sure channels matches hook_ups
          // Create channel if not and delete if removed
          if(newVal) {
            _.each($scope.hookUps, function(hookUp) {
              hookUp = parseInt(hookUp);
              var remote = new Firebase(hackDateURL+'/profiles/'+hookUp+'/hook_ups');
              remote.once('value', function(snapshot) {
                var remoteHookUps = snapshot.val();
                if(remoteHookUps.indexOf(userId) > -1) {
                  var key = _.sortBy([hookUp, userId], function(el) { return el; }).toString();
                  if(!_.has($scope.globalChannels, key)) {
                    console.log('constructing channels');
                    $scope.globalChannels[key] = {
                      members: [hookUp, userId],
                      messages: [
                        {
                          from: 'HackDate Admin',
                          content: 'Thanks for using HackDate! <3',
                          admin: true
                        }
                      ]
                    };

                    angularFireCollection(new Firebase(hackDateURL+'/profiles/'+userId+'/channels')).add({
                      key: key,
                      title: 'Custom title'
                    });
                    angularFireCollection(new Firebase(hackDateURL+'/profiles/'+hookUp+'/channels')).add({
                      key: key,
                      title: 'Custom title'
                    });
                  }
                }
              });
            });
          }
        });

        $scope.messageRef = null;
        $scope.selected = null;
        $scope.channelSelect = {};
        $scope.select = function(channel) {
          $scope.channelSelect = {};
          $scope.channelSelect[channel.key] = true;
          $scope.selected = channel;
        }

        $scope.$watch('selected', function(newVal) {
          if(newVal) {
            var key = newVal.key;
            $scope.messageRef = new Firebase(hackDateURL+'/channels/'+key+'/messages');

            $scope.messages = [];
            angularFire($scope.messageRef, $scope, 'messages');
            //angularFire(ref.limit(15), $scope, 'messages');

            $scope.addMessage = function() {
              $scope.messages.push({
                from: $scope.username,
                content: $scope.message,
                admin: false
              });
              $scope.message = "";
            }
          } else {
          }
        });
      }
    });
});

app.controller('MainCtrl', function($scope, $rootScope, $state, hackDateURL, angularFireAuth) {
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
    $rootScope.userId = parseInt($scope.user.id);
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

  $rootScope.$on('$stateChangeError', 
  function(event, toState, toParams, fromState, fromParams, error){ 
    console.log('$stateChangeError');
    console.log(error);
  });
})
.controller('MatchingCtrl', function($scope, angularFire, angularFireCollection, interestsRef, profiles, columnDefs) {

  $scope.interests = [];
  angularFire(interestsRef, $scope, 'interests').
  then(function() {
    // Setup highlights for rows with interests
    for(var ind=0; ind<$scope.profiles.length; ind++) {
      var el = $scope.profiles[ind];
      var target_id = parseInt(el.$id);
      if($scope.interests.indexOf(target_id) > -1) {
        console.log('selecting');
        $scope.gridOptions.selectItem(ind, true);
      }
    //});
    }
  });

  $scope.profiles = profiles;
  $scope.gridOptions = {
    data: 'profiles',
    selectedItems: $scope.interests,
    columnDefs: columnDefs
  };

  //$scope.$on('ngGridEventData', function(){
  //});

  $scope.apply = function() {
    $scope.interests = _.map($scope.gridOptions.selectedItems, function(el) { return parseInt(el.$id); });
  };
});

