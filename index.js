$(document).ready(function main() {

    //prepopulate booking form for convenience of testing/demonstration
    function PrepopulateFormSeattle() { //The Westin Seattle
        $("#StreetAddress").val("1900 5th Ave");
        $("#City").val("Seattle");
        $("#State").val("WA");
        $("#ZipCode").val("98121");
    }

    function PrepopulateFormEngland() { //Eccleston Square Hotel
        $("#StreetAddress").val("37 Eccleston Square");
        $("#City").val("London");
        $("#State").val("England");
        $("#ZipCode").val("SW1V 1PB");
    }

    function PrepopulateFormFrance() { //Hôtel La Mirande, Avignon 
        $("#StreetAddress").val("4 Place de l'Amirande");
        $("#City").val("Avignon");
        $("#State").val("France");
        $("#ZipCode").val("84000");
    }

    function PrepareForNewSubmission() {
        document.getElementById("SubmitBtn").disabled = false;
        document.getElementById("SubmitBtn").innerHTML = 'Submit';
    }

    // var url = window.location.href;
    PrepopulateFormFrance();

    // $(".DatePickerOptions").datepicker({
    //     autoclose: true,
    //     todayHighlight: true,
    //     clearBtn: true,
    //     startDate: new Date(),
    //     format: "yyyy-mm-dd"
    // });

    $("#HotelBookingForm").on("submit", function (event) {
        $("#EventContainer").empty(); //allows for multiple booking form submissions for different locations
        document.getElementById("SubmitBtn").innerHTML = 'Processing, please wait... ';
        document.getElementById("SubmitBtn").disabled = true;
        event.preventDefault(); //prevents page from refreshing so that Ajax requests work

            var inputs = $(this).serializeArray();
            var Street = inputs[0].value.trim(); //trim() removes trailing whitespace from front and back
            var City = inputs[1].value.trim();
            var State = inputs[2].value.trim();
            var ZipCode = inputs[3].value.trim();

            //error handling for inputs
            if (City == "") {
                console.log(`Error! Please enter a city.`);
                PrepareForNewSubmission();
                return;
            }
            if (State == "") {
                console.log(`Error! Please enter a U.S. State or country outside of the U.S.`);
                PrepareForNewSubmission();
                return;
            }

        // SendMapQuestGeocodingAjaxRequest();
        
        // var ShouldAjaxStop = false; //fixes the weird looping of .ajaxStop()
        // $(document).ajaxStop(function () {
        //     if (ShouldAjaxStop) return;
        //     ShouldAjaxStop = true;

            displayLeafletMap();

            PrepareForNewSubmission();
            window.scrollTo(0, 0);
        // });
    });

});

// FUNCTION DEFINITIONS ------------------------------------------------------------------------

function displayLeafletMap() {
    var HotelCoord = [108, 32];
    var EventCoord = [108.2, 32];

    var map = InitMap(HotelCoord, EventCoord);

    InitMarkersAndPopups(HotelCoord, EventCoord, map, dist);

    InitTiles(map);

    function InitMap(HotelCoord, EventCoord) {
        var InitialZoom = 17;
        var map = L.map('leafletMapId').setView(HotelCoord, InitialZoom);
        var EventInBounds = map.getBounds().contains(EventCoord);
        while (EventInBounds !== true) {
            if (EventInBounds !== true) { //zoom increments of 0.5 cause too many get requests for tiles b/c instances of calls are doubled & tiles don't load
                map.zoomOut(1); //zoomOut() Only works after setView(), and before setting markers and tileLayer()
                EventInBounds = map.getBounds().contains(EventCoord);
            }
        }
        return map;
    }

    function InitMarkersAndPopups(HotelCoord, EventCoord, map, dist) {
        var HotelMarker = L.marker(HotelCoord).addTo(map); //markers and popups need to be initialized after the automatic zooming, otherwise the map center shifts weirdly
        var EventMarker = L.marker(EventCoord).addTo(map);
        var HotelPopup = L.popup({
            closeOnClick: false,
            autoClose: false
        }).setContent("<b>This is your hotel.</b>").setLatLng(HotelCoord).addTo(map);
        var EventPopup = L.popup({
            closeOnClick: false,
            autoClose: false
        }).setContent(`${dist} mi from your hotel`).setLatLng(EventCoord).addTo(map);
    }

    function InitTiles(map) {
        var MapBoxAccessToken = "sk.eyJ1IjoibmluamFidW5ueTgiLCJhIjoiY2p4dzdybWgwMDEwaTNsbndjNTFscDg3eiJ9.AaZdhJ0HzSIWbVrlridrVQ";
        var attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>';
        L.tileLayer(`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${MapBoxAccessToken}`, {
            attribution: attribution,
            maxZoom: 20,
            minZoom: 1,
            id: 'mapbox.streets',
            accessToken: MapBoxAccessToken
        }).addTo(map);
    }
}

//for deployment, this function would be unnecessary if you can directly get the hotel lat lng coordinates from a database
function SendMapQuestGeocodingAjaxRequest(Street, City, State, ZipCode) {
    var MapQuestObj = {
        "key": "kmtHkT1S4hJHNSUcNoAeegMZtwfgCWfb",
        "location": [Street, City, State, ZipCode].join(", ")
    };
    $.ajax({
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        url: `https://www.mapquestapi.com/geocoding/v1/address?${$.param(MapQuestObj)}`,
        success: function GetLatLong(json) {
            coord = Object.values(json.results[0].locations[0].latLng);
            console.log(coord);
        },
        error: function (err) {
            console.log(`Mapquest Ajax request for coord not working:`, err);
        }
    });
}

//adds properties EventCoord and DistFromHotel to each activity
function AddActivitiesPropDistFromHotel(activities) {
    var EventCoord = ActivityObj.latLng.split(",");
    ActivityObj["EventCoord"] = EventCoord;
    ActivityObj["DistFromHotel"] = CalcDist(HotelCoord[0], HotelCoord[1], EventCoord[0], EventCoord[1]);

    //use Haversine Formula to calculate distance between 2 latitude and longitude coordinates
    function CalcDist(lat1, lng1, lat2, lng2) {
        lat1 = ConvertDegToRad(lat1);
        lat2 = ConvertDegToRad(lat2);
        lng1 = ConvertDegToRad(lng1);
        lng2 = ConvertDegToRad(lng2);
        var a = Haversine(lat2 - lat1) + Math.cos(lat1) * Math.cos(lat2) * Haversine(lng2 - lng1);
        var DistInKM = (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 6371; //approximate Earth radius is 6371 km
        DistInMiles = DistInKM * 0.62137;
        return DistInMiles;

        function ConvertDegToRad(deg) {
            return deg * (Math.PI / 180);
        }

        function Haversine(DeltaCoord) {
            var haversine = SquareNum(Math.sin(DeltaCoord / 2));
            return haversine;

            function SquareNum(num) {
                return num * num;
            }
        }
    }
}

// //alternate algorithm for sorting by increasing distance
// function CompareDist(activity1, activity2) {
//     const dist1 = activity1.DistFromHotel;
//     const dist2 = activity2.DistFromHotel;
//     let Activity1vs2Comparison = 0;
//     if (dist1 > dist2) {
//         Activity1vs2Comparison = 1;
//     } else if (dist1 < dist2) {
//         Activity1vs2Comparison = -1;
//     }
//     return Activity1vs2Comparison;
// }

// //create section for activity's description + read more button
// function CreateDescriptionBoxes() {
//     var CharLimit = 230;
//     var DescriptionBox = document.createElement("p");
//     $(DescriptionBox).attr('id', 'DescriptionBox');
//     if (description.length < CharLimit) {
//         $(DescriptionBox).append(description);
//     } else {
//         var LastSpaceIndex = description.substr(0, CharLimit).lastIndexOf(" "); //adjusts char limit to the nearest space within the limit so that html tags & words don't get split
//         $(DescriptionBox).append('<span class="shortText">' + description.substr(0, LastSpaceIndex) + '</span>' + //substr(start, length) NOT substr(start, end)
//             '<span class="longText">' + description.substr(LastSpaceIndex) + '</span>' +
//             '<span class="textDots">...</span>' +
//             `<div class="BtnSpace"><button class="ReadMoreBtn" dataMore="0">Read More <i class='fas fa-arrow-down'></i></button></p>`);
//     }
//     return DescriptionBox;
// }

// function SetUpReadMoreBtns() {
//     //setting up read more buttons
//     $(".shortText").css("display", "inline");
//     $(".longText").css("display", "none");
//     $(".ReadMoreBtn").on('click', function ReadMoreOrLess() {
//         // If text is shows less, then show more
//         if ($(this).attr('DataMore') == 0) {
//             $(this).attr('DataMore', 1);
//             $(this).html(`Read Less <i class='fas fa-arrow-up'></i>`)

//             $(this).parent().prev().css('display', 'none'); //text dots
//             $(this).parent().prev().prev().css('display', 'inline'); //.longText
//         }
//         //if text shows more, then show less
//         else if (this.getAttribute('DataMore') == 1) {
//             $(this).attr('DataMore', 0);
//             $(this).html(`Read More <i class='fas fa-arrow-down'></i>`)

//             $(this).parent().prev().css('display', 'inline'); //text dots
//             $(this).parent().prev().prev().css('display', 'none'); //.longText
//         }
//     });
// }