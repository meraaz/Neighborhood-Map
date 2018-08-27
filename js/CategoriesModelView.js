const CLIENT_ID = "ETPT11XTR4JWC1ARIQHD5Z3D315BR4K5OMLHUPPJTNCW3LAH";
const CLIENT_SECRET = "MV0LW4XF2C35T01MFIDXKD3NPOEI50ZLS03G5O11CLKQFVTR";
/* I have used Foursquare Authentication process to get the Access token to like places */
const ACCESS_TOKEN = "H4KI5JOHWXUNLQNEITZG42TICMM0UMAQ5FVHNSNEAAAR51B3";

//google map custom marker icon - .png fallback for IE11
let is_internetExplorer11= navigator.userAgent.toLowerCase().indexOf('trident') > -1;
let marker_url = ( is_internetExplorer11 ) ? 'img/cd-icon-location.png' : 'img/cd-icon-location.svg';

function CategoriesViewModel() {

    let self = this;

    self.categoriesList = ko.observableArray();

    self.selectedChoice = ko.observable("");

    self.categoryPlacesArray = ko.observableArray();

    self.categoryPlacesMarkers = ko.observableArray();

    self.placesMarkers = [];

    /* The marker animation when clicked */
    self.toggleBounce = function toggleBounce() {

        /* Close all places Markers when one clicked */
        $.each(self.placesMarkers,function(m) {
            self.placesMarkers[m].infowindow.close(map, self.placesMarkers[m]);
        });

        let infoWindowVar = this.infowindow;

        /* Foursquare Venue Details API */
        /* I used search one cause the venue details API , only one per day for regular accounts */
        let venueDetailsApi = 'https://api.foursquare.com/v2/venues/search?ll=' + this.lat + ',' + this.lng +
            '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET +
            '&v=20180323';

        /* Get the Venue Details and change the infoWindow Content*/
        $.getJSON(venueDetailsApi).then(function (venue)
        {
            let venueDetailsResponse = venue.response.venues[0];

            let venueDataFormat = '<h5 class="place-title">' + venueDetailsResponse.name + '</h5>' +
                '<div>'+
                '<p class="place-data">Address : ' + venueDetailsResponse.location.address + '</p>' +
                '<p class="place-data">City : ' + venueDetailsResponse.location.city + '</p>' +
                '<p class="place-data">Country : ' + venueDetailsResponse.location.country + '</p>' +
                '</div>';
            infoWindowVar.setContent(venueDataFormat);
        }).fail(function (venue) {
            /* If fail , Alert User with the issue */
            alert('Ops, Something wrong happened .. Please try again later or Contact your Administrator')
        });

        /* Open the marker infoWindow */
        this.infowindow.open(map, this);

        /* Set Marker Animation */
        this.setAnimation(google.maps.Animation.BOUNCE);

        /* Set timeout to animation */
        setTimeout((function () {
            this.setAnimation(null);
        }).bind(this),300);
    };

    /* Like Venue API */
    self.likePlace = function(place){
            let likeUrl = 'https://api.foursquare.com/v2/venues/' + place.id + '/like?oauth_token=' + ACCESS_TOKEN + '&v=20180323';

            $.post(likeUrl, null,function(response) {
                alert("You Have Successfully Like this place");
            }, 'json').fail(function () {
                alert("Sorry , Something Wrong happened while trying to like this place , Please try again later !")
            });
    };

    /* Set the Map settings */
    self.initMap = function initMap() {
        let latitude = 30.0594838,
            longitude = 31.2234448,
            mapZoom = 10;

            /* Set init marker to appear before choosing a category */
            self.initMarker = new google.maps.Marker({
                map: map,
                draggable: false,
                animation: google.maps.Animation.DROP,
                position: new google.maps.LatLng(latitude, longitude),
                title: 'Cairo, Egypt',
                lat: latitude,
                lng: longitude,
                icon: marker_url,
                infowindow: new google.maps.InfoWindow({
                    content: '<h5>Cairo, Egypt</h5>' +
                        '<p>Choose Category to See places here</p>'
                })
            });

            /* Show the init Marker on the map */
            self.initMarker.setMap(map);
            self.initMarker.setVisible(true);
            /* Add Listener to pop up the infoWindow */
            self.initMarker.addListener('click', function() {
            self.initMarker.infowindow.open(map, self.initMarker);
        });

    };

    /* Subscriber on change value of dropDownList */
    /* Get the Places of the selected Category */
    self.selectedChoice.subscribe( function(categoryId) {

        /* Remove the initMarker from the map */
        self.initMarker.setMap(null);

        /* Remove all the previous marker from the map */
        $.each(self.placesMarkers,function (pm) {
           self.placesMarkers[pm].setMap(null);
        });

        /* Get venues of specific Category ID  */
        let categoryPlacesApi = 'https://api.foursquare.com/v2/venues/search' +
            '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET +
            '&near=Cairo,EG&categoryId=' + categoryId + '&v=20180323';

        /* Call to Category Places API */
        $.getJSON(categoryPlacesApi).done(function (catPlaces) {

            /* Remove all the previous values from the Observable arrays  */
            self.categoryPlacesArray.removeAll();

            self.categoryPlacesMarkers.removeAll();

            let categoryPlaces = catPlaces.response.venues;

            /* Get the Category Places Values and draw the markers */
            $.each(categoryPlaces, function (i) {

                self.categoryPlacesArray.push(new categoryPlace(categoryPlaces[i]));

                this.placeMarker = new google.maps.Marker({
                    map: map,
                    draggable: false,
                    animation: google.maps.Animation.DROP,
                    position: new google.maps.LatLng(categoryPlaces[i].location.lat, categoryPlaces[i].location.lng),
                    title: categoryPlaces[i].name,
                    lat: categoryPlaces[i].location.lat,
                    lng: categoryPlaces[i].location.lng,
                    id: categoryPlaces[i].id,
                    icon: marker_url,
                    infowindow:  new google.maps.InfoWindow({
                            content: ''
                        })
                });

                this.placeMarker.setMap(map);
                this.placeMarker.setVisible(true);
                self.categoryPlacesMarkers.push(this.placeMarker);
                self.placesMarkers.push(this.placeMarker);
                this.placeMarker.addListener('click', self.toggleBounce);
            });
        }).fail(function (catPlaces) {
            /* If fail , Alert User with the issue */
            alert('Ops, Something wrong happened .. Please try again later or Contact your Administrator')
        });
    });

    /* Get the Available Categories from Foursquare */
    let categoriesApi = 'https://api.foursquare.com/v2/venues/categories' +
        '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET +
        '&v=20180323';

    /* Call to Foursquare categories API */
    self.getCategories = function () {
        $.get(categoriesApi).done(function (cats) {
            let categories = cats.response.categories;
            self.categoriesList.removeAll();
            $.each(categories, function (i) {
                self.categoriesList.push(new category(categories[i]));
            });
        }).fail(function (cats) {
            /* If fail , Alert User with the issue */
            alert('Ops, Something wrong happened .. Please try again later or Contact your Administrator')
        });
    };

    self.initMap();

}

/* Category Place Object */
let categoryPlace = function (place) {
    return {
      id: ko.observable(place.id),
      name: ko.observable(place.name),
      lat: ko.observable(place.location.lat),
      lng: ko.observable(place.location.lng)
    };
};

/* Category Object */
let category = function (data) {
    return {
        id: ko.observable(data.id),
        name: ko.observable(data.name)
    };
};

function startApp() {
  ko.applyBindings(new CategoriesViewModel());
  
}
$(document).ready(function () {
});
