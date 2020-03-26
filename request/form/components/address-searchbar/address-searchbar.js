
import { getAddressComponent, getStaticGoogleMapForAddress } from '/modules/address.js';

function setRequestAddress(address, template) {

    if (!address) { return }

    const zip = getAddressComponent(address, "postal_code");

    address.static_img = getStaticGoogleMapForAddress(address);
    address.zipCode = zip;
    
    Meteor.call("zipCodeIsServiceable", zip, (e,r) => {
        const isServiceable = r;

        address.serviceable = isServiceable;
        template.address.set(address);
    });
}

var initializeGoogleMaps = (template) => {

    var autocomplete = new google.maps.places.Autocomplete(
        (document.getElementById("autocomplete")), {types: ['geocode'] }
    );

    // When the user selects an address from the dropdown,
    google.maps.event.addListener(autocomplete, 'place_changed', function () {

        // Get the place details from the autocomplete object.
        var place = autocomplete.getPlace();

        place.geometry.location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

        //console.log(place);

        if (place.address_components) {
            setRequestAddress(place, template);
        } else {
            $(".need-help").show();
        }

    });

    // reset search bar text placeholder
    $("#autocomplete").attr("placeholder", "+ Search for Property Address");
};


Template.addressSearchBar.onCreated(function () {

    this.state = new ReactiveDict();
    this.state.setDefault({
      notFound: false,
      unit: null,
    });

    this.address = new ReactiveVar(null);
});


Template.addressSearchBar.onRendered(function() {
    const template = this;

    Meteor.setTimeout(() => {initializeGoogleMaps(template)}, 2000);
})

Template.addressSearchBar.helpers({

    notFound() {
        const instance = Template.instance();
        return instance.state.get('notFound');
    },

    unit() {
        const instance = Template.instance();
        var unit = instance.state.get('unit');

        if (unit) {
         return "#" + unit;
        }
    },

    address() {
        const instance = Template.instance();
        return instance.address.get();
    }

})

Template.addressSearchBar.events({

    "click .js-not-found": function(event, template){
        event.preventDefault();

        template.state.set('notFound', true);
    },

    "click .js-search": function(event, template){
        event.preventDefault();

        var address = template.address.get();

        if (!address) {
            $(".need-help").show();
        }

    },

    "click .js-select-not-found-address": function(event, template){
        event.preventDefault();

        var address = $("#address").val(),
            unit = $("#unit").val(),
            zip = $("#zip").val(),
            city = $("#city").val(),
            state = $("#state").val();

        var addressObject = {};
        var formatted = address + ", " + city + ", " + state + " " + zip + " USA";

        addressObject = {
            "address_components" : [
                {
                    "long_name" : zip,
                    "short_name" : zip,
                    "types" : [
                        "postal_code"
                    ]
                },
                {
                    "long_name" : city,
                    "short_name" : city,
                    "types" : [
                        "locality",
                        "political"
                    ]
                },
                {
                    "long_name" : $( "#state option:selected" ).text(),
                    "short_name" : state,
                    "types" : [
                        "administrative_area_level_1",
                        "political"
                    ]
                },

            ],
                "formatted_address" : formatted,
                "name" : address,
                "url" : "https://maps.google.com/?q=" + formatted + "&ftid=0x88c2928166ca2871:0x16c2d00a1a3f83af",
                "utc_offset" : -240,
                "vicinity" : city,
                "html_attributions" : [ ],
                "suite" : ""
        };

        setRequestAddress(addressObject, template);
    },

    "click .js-unselect-address": function(event, template){

        $("#autocomplete").val("");
        template.address.set(null);
    },

    "keyup #suite": function(event, template){

        var unit = $("#suite").val();
        template.state.set('unit', unit);
    },

    'click .js-select-address' ( event, template ) {
        event.preventDefault();

        const address = template.address.get();

        // set suite # for address if one exists
        if (address) {
            address.suite = $("#suite").val();

            template.data.onAddressChange(address);
        }

    },
})