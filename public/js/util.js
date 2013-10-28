var geocoder = new google.maps.Geocoder();

function currentLocation(callback) {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      callback(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    });
  } else {
    alert("Geolocation was not permitted!");
    callback();
  }
}

rad = function(x) {return x*Math.PI/180;};

// p1, p2 are Google LatLng Objects
// Returns in km
function distanceBetween(p1, p2) {
  var R = 6371; // earth's mean radius in km
  var dLat  = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d.toFixed(3);
}

// Calculate the distance from geolocation to the address passed in
// And return in km
function distanceBetweenGoogle(p1, p2) {
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
}

// Return a google LatLng object
function geocoding(address, callback) {
  geocoder.geocode({'address': address}, function(results, status) {
    if(status == google.maps.GeocoderStatus.OK) {
      callback(results[0].geometry.location);
    } else {
      alert('Geocoder was not successful for the following reason: ' + status);
      callback();
    }
  });
}

function reverseGeocoding(latlng, callback) {
  geocoder.geocode({'latLng': latlng}, function(results, status) {
    if(status == google.maps.GeocoderStatus.OK) {
      if(results[1]) {
        callback(results[1].formatted_address);
      } else {
        alert('No results found');
        callback();
      }
    } else {
      alert('Geocoder failed due to: ' + status);
      callback();
    }
  });
}
