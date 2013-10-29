var userId = -1;
var app = angular.module('hackdate', ['ngRoute', 'ui.bootstrap', 'ui.router', 'firebase', '$strap.directives', 'ngGrid']);

app.value('hackDateURL', 'https://hackdateyuri.firebaseio.com/');
//app.value('hackDateURL', 'hackdate.firebaseio.com/'); 

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
      templateUrl: 'partials/hackdate.html'
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
      controller: function($scope, $rootScope, $http, $timeout, angularFire, hackDateURL, Profiles) {
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
            $scope.geolocate(profile.location); // update latlng
            $scope.remote = angular.copy(profile);
            console.log($scope.remote);
          };

          $scope.reset = function() {
            $scope.profile = {};
          };

          $scope.geolocate = function(address) {
            if(typeof address !== 'undefined') {
              geocoding(address, function(latlng) {
                $scope.profile.location = address;
                $scope.profile.lat = latlng.lat();
                $scope.profile.lng = latlng.lng();
              });
            } else {
              reverseGeocoding($rootScope.latlng, function(location) {
                $scope.profile.location = location;
                $scope.profile.lat = $rootScope.latlng.lat();
                $scope.profile.lng = $rootScope.latlng.lng();
              });
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
    .state('hackdate.filters', {
      templateUrl: 'partials/filters.html',
      controller: function($rootScope, $scope, $filter) {
        $scope.show = {intention: true};
        $scope.setIntention = function(value) {
          $scope.show.intention = value;
        };

        $scope.filters = $rootScope.filters;
        $scope.$watch('filters', function() {
          $rootScope.filters = $scope.filters;
        });

        $scope.hackDateFilter = function(profile) {
          console.log('hackDateFilter');
          console.log(profile);
          return profile.intention && profile.intention.indexOf($scope.filters.intention) > -1 && 
            (($scope.filters.sex.male && profile.sex == 'M') || ($scope.filters.sex.female && profile.sex == 'F')) &&
            (
              ($scope.filters.location.me && $rootScope.latlng && distanceBetween(new google.maps.LatLng(profile.lat, profile.lng), $rootScope.latlng) < parseInt($scope.filters.location.medistance)) ||
              ($scope.filters.location.place && $scope.profile.lat && $scope.profile.lng && distanceBetween(new google.maps.LatLng(profile.lat, profile.lng), new google.maps.LatLng($scope.profile.lat, $scope.profile.lng)) < parseInt($scope.filters.location.placedistance))
            ) &&
            ($scope.filters.myage && (moment().year() - moment($scope.profile.birthday).year()) <= $scope.filters.myageoffset)
        };
      }
    })
    .state('hackdate.filters.interests', {
      url: "/interests",
      resolve: {
        helpText: function() {
          return 'Listing all profiles';
        },

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
        },

        showIntention: function() {
          return true;
        }
      },
      templateUrl: "partials/grid.html",
      controller: 'MatchingCtrl'
    })
    .state('hackdate.filters.interested', {
      // Similar to interests, so users can express interests to, but only shows profiles that has expressed interests in the user
      url: "/interested",
      resolve: {
        helpText: function() {
          return 'Listing all profiles that are interested in you';
        },

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
              var parsedInterests = el.interests;
              // Update: Better to do it via hackDateFilter
              // Filter by filters.intention
              //var parsedInterests = _.filter(el.interests, function(item) {
                //return item.intention && item.intention.indexOf($rootScope.filters.intention) > -1;
              //});
              parsedInterests = _.map(parsedInterests, function(item) {
                return item.value;
              });
              return parsedInterests.indexOf(userId) > -1;
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
        },

        showIntention: function() {
          return true;
        }
      },
      templateUrl: "partials/grid.html",
      controller: 'MatchingCtrl'
    })
    .state('hackdate.filters.hook_ups', {
      url: "/hook_ups",
      resolve: {
        helpText: function() {
          return 'Listing all interested profiles that are interested in you';
        },

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
            // Update: Better to do it via hackDateFilter
            // Filter by filters.intention
            //var interests = _.filter(snapshot.val(), function(el) {
              //return el.intention && el.intention.indexOf($rootScope.filters.intention) > -1;
            //});
            var done = 0;
            var profiles = [];

            _.each(interests, function(el) {
              var target_id = parseInt(el.value);
              var iRef = new Firebase(hackDateURL+'profiles/'+target_id);
              iRef.once('value', function(snapshot) {
                var remote = snapshot.val();

                _.extend(remote, {$id: target_id}); // just in case
                var parsedRemoteInterests = _.map(remote.interests, function(el) {
                  return el.value;
                });
                if(parsedRemoteInterests.indexOf(userId) > -1) {
                  profiles.push(remote);
                }
                console.log('resolve profiles');
                console.log(profiles);
                // Don't need to resolve that quickly
                //deferred.resolve(profiles);
              });
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
            }
          ];
        },

        showIntention: function() {
          return true;
        }
      },
      templateUrl: "partials/grid.html",
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

        // A separate filters
        $scope.filters = {};
  
        $scope.$watchCollection('[hookUpsReady, channelsReady, globalChannelsReady, filters]', function(newVal) {
          // Making sure channels matches hook_ups
          // And selected intention
          // Create channel if not and delete if removed
          if(newVal) {
            var filteredHookUps = _.filter($scope.hookUps, function(el) {
              return el.intention == $scope.filters.intention;
            });
            filteredHookUps = _.map(filteredHookUps, function(el) {
              return el.value;
            });
            _.each(filteredHookUps, function(hookUp) {
              hookUp = parseInt(hookUp);
              var remote = new Firebase(hackDateURL+'/profiles/'+hookUp+'/hook_ups');
              remote.once('value', function(snapshot) {
                var remoteHookUps = snapshot.val();
                if(remoteHookUps.indexOf(userId) > -1) {
                  var key = _.sortBy([hookUp, userId], function(el) { return el; }).toString();
                  if(!_.has($scope.globalChannels, key)) {
                    console.log('constructing channels');
                    $scope.globalChannels[key] = {
                      intention: $scope.filters.intention,
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
                      intention: $scope.filters.intention,
                      key: key,
                      title: 'Custom title'
                    });
                    angularFireCollection(new Firebase(hackDateURL+'/profiles/'+hookUp+'/channels')).add({
                      intention: $scope.filters.intention,
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
  currentLocation(function(latlng) {
    console.log('getting current location');
    console.log(latlng);
    if(typeof latlng !== 'undefined') {
      $rootScope.latlng = latlng;    
      $scope.latlng = latlng;    
    }
  });

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

  // Default values for the filter
  $rootScope.filters = {
    intention: 'Relationship',
    sex: {
      male: true,
      female: true
    },
    myageoffset: 5,
    location: {
      me: true,
      medistance: 5,
      place: false,
      placedistance: 5
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

  $scope.toState = 'hackdate.profile';

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
.controller('MatchingCtrl', function($rootScope, $scope, $filter, angularFire, angularFireCollection, interestsRef, profiles, columnDefs, helpText, showIntention) {

  $scope.setIntention(showIntention);

  $scope.helpText = helpText;

  $scope.interests = [];
  angularFire(interestsRef, $scope, 'interests').
  then(function() {
    console.log('interests');
    console.log($scope.interests);
  });

  $scope.selection = [];
  $scope.$watch('selection', function(newVal) {
    console.log('selection changed');
    console.log($scope.selection);
  }, true);

  // To update selection
  $scope.$watchCollection('[filters, interests, profiles]', function(newVal) {
    if(newVal) {
      console.log('interests watch');
      $scope.selection.splice(0, $scope.selection.length);
      _.each($scope.profiles, function(el, ind) {
        $scope.gridOptions.selectItem(ind, false);

        var target_id = parseInt(el.$id);

        // Filtering interests to include only those with the same intention
        var parsedInterests = _.filter($scope.interests, function(el) {
          return el.intention == $rootScope.filters.intention;
        });
        // Then map it
        var parsedInterests = _.map(parsedInterests, function(el) {
          return el.value;
        });
        if(parsedInterests.indexOf(target_id) > -1) {
          $scope.gridOptions.selectItem(ind, true);
        }
      });
      console.log($scope.selection);
    }
  }, true);

  $scope.remote = profiles;
  //$scope.profiles = angular.copy($scope.remote);
  // Filter by currently selected intention
  $scope.profiles = _.filter($scope.remote, function(el) {
    console.log('filtering profiles by intention');
    console.log(el);
    console.log($rootScope.filters);
    return el.intention && el.intention.indexOf($rootScope.filters.intention) > -1;
  });

  $scope.gridOptions = {
    data: 'profiles',
    selectedItems: $scope.selection,
    columnDefs: columnDefs
  };

  $scope.$watch('filters', function(newVal) {
    console.log('filter has changed');
    $scope.profiles = $filter('filter')($scope.remote, $scope.hackDateFilter);
    console.log($scope.profiles);
  }, true);

  //$scope.$on('ngGridEventData', function(){
  //});

  $scope.apply = function() {
    $scope.interests = _.map($scope.gridOptions.selectedItems, function(el) {
      return {
        intention: $rootScope.filters.intention,
        value: parseInt(el.$id)
      };
    });
  };
});

