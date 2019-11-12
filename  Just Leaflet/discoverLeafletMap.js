$(window).load(function main() {
    var {
        HotelCoord,
        EventCoord,
        dist,
        EventTitle
    } = ParseURLParams(); //obj automatically initializes individual variables in new scope

    var map = InitMap(HotelCoord, EventCoord);

    InitMarkersAndPopups(HotelCoord, EventCoord, map, dist, EventTitle);

    InitTiles(map);
});

function ParseURLParams() {
    var urlParams = new URLSearchParams(window.location.search);
    var HotelCoord = urlParams.get('HotelCoord').split(',');
    for (i = 0; i < HotelCoord.length; i++) {
        HotelCoord[i] = parseFloat(HotelCoord[i]);
    }
    var EventCoord = urlParams.get('EventCoord').split(',');
    for (i = 0; i < EventCoord.length; i++) {
        EventCoord[i] = parseFloat(EventCoord[i]);
    } //need to convert url strings to floats to avoid recursive function call error: Uncaught RangeError: Maximum call stack size exceeded
    var dist = urlParams.get('dist');
    var EventTitle = urlParams.get('title');
    return {
        HotelCoord,
        EventCoord,
        dist,
        EventTitle
    };
}

function InitMap(HotelCoord, EventCoord) {
    var InitialZoom = 17;
    var map = L.map('MapId').setView(HotelCoord, InitialZoom);
    var EventInBounds = map.getBounds().contains(EventCoord);
    while (EventInBounds !== true) {
        if (EventInBounds !== true) { //zoom increments of 0.5 cause too many get requests for tiles b/c instances of calls are doubled & tiles don't load
            map.zoomOut(1); //zoomOut() Only works after setView(), and before setting markers and tileLayer()
            EventInBounds = map.getBounds().contains(EventCoord);
        }
    }
    return map;
}

function InitMarkersAndPopups(HotelCoord, EventCoord, map, dist, EventTitle) {
    var HotelMarker = L.marker(HotelCoord).addTo(map); //markers and popups need to be initialized after the automatic zooming, otherwise the map center shifts weirdly
    var EventMarker = L.marker(EventCoord).addTo(map);
    var HotelPopup = L.popup({
        closeOnClick: false,
        autoClose: false
    }).setContent("<b>This is your hotel.</b>").setLatLng(HotelCoord).addTo(map);
    var EventPopup = L.popup({
        closeOnClick: false,
        autoClose: false
    }).setContent(`The <strong>${EventTitle}</strong> is here: ${dist} mi from your hotel`).setLatLng(EventCoord).addTo(map);
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