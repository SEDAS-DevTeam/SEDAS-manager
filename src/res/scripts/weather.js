import { send_message } from '../scripts/utils/ipc_wrapper.js';

var apiData = {};
var mapFrames = [];
var lastPastFramePosition = -1;
var radarLayers = [];

var optionKind = 'radar'; // can be 'radar' or 'satellite'

var optionTileSize = 256; // can be 256 or 512.
const OPTION_COLOR_SCHEME = 7; // from 0 to 8. Check the https://rainviewer.com/api/color-schemes.html for additional information
var optionSmoothData = 1; // 0 - not smooth, 1 - smooth
var optionSnowColors = 1; // 0 - do not show snow colors, 1 - show snow colors

var animationPosition = 0;
var is_playing = true

var loadingTilesCount = 0;
var loadedTilesCount = 0;

var map;

function initialize_map(){
    document.getElementById("warn-popup").style.visibility = "hidden"

    map = L.map('mapid') 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    /**
     * Load all the available maps frames from RainViewer API
     */
    var apiRequest = new XMLHttpRequest();
    apiRequest.open("GET", "https://api.rainviewer.com/public/weather-maps.json", true);
    apiRequest.onload = function(e) {
        // store the API response for re-use purposes in memory
        apiData = JSON.parse(apiRequest.response);
        initialize(apiData, optionKind);
    };
    apiRequest.send();

    //start playing
    play()
}

window.onload = () => {
    //ask for location where to focus
    ask_for_loc()
}

function startLoadingTile() {
    loadingTilesCount++;    
}
function finishLoadingTile() {
    // Delayed increase loaded count to prevent changing the layer before 
    // it will be replaced by next
    setTimeout(function() { loadedTilesCount++; }, 250);
}
function isTilesLoading() {
    return loadingTilesCount > loadedTilesCount;
}

/**
 * Initialize internal data from the API response and options
 */
function initialize(api, kind) {
    // remove all already added tiled layers
    for (var i in radarLayers) {
        map.removeLayer(radarLayers[i]);
    }
    mapFrames = [];
    radarLayers = [];
    animationPosition = 0;

    if (!api) {
        return;
    }
    if (kind == 'satellite' && api.satellite && api.satellite.infrared) {
        mapFrames = api.satellite.infrared;

        lastPastFramePosition = api.satellite.infrared.length - 1;
        showFrame(lastPastFramePosition, true);
    }
    else if (api.radar && api.radar.past) {
        mapFrames = api.radar.past;
        if (api.radar.nowcast) {
            mapFrames = mapFrames.concat(api.radar.nowcast);
        }

        // show the last "past" frame
        lastPastFramePosition = api.radar.past.length - 1;
        showFrame(lastPastFramePosition, true);
    }
}

/**
 * Animation functions
 * @param path - Path to the XYZ tile
 */
function addLayer(frame) {
    if (!radarLayers[frame.path]) {
        var colorScheme = optionKind == 'satellite' ? 0 : OPTION_COLOR_SCHEME;
        var smooth = optionKind == 'satellite' ? 0 : optionSmoothData;
        var snow = optionKind == 'satellite' ? 0 : optionSnowColors;

        var source = new L.TileLayer(apiData.host + frame.path + '/' + optionTileSize + '/{z}/{x}/{y}/' + colorScheme + '/' + smooth + '_' + snow + '.png', {
            tileSize: 256,
            opacity: 0.01,
            zIndex: frame.time
        });

        // Track layer loading state to not display the overlay 
        // before it will completelly loads
        source.on('loading', startLoadingTile);
        source.on('load', finishLoadingTile); 
        source.on('remove', finishLoadingTile);

        radarLayers[frame.path] = source;
    }
    if (!map.hasLayer(radarLayers[frame.path])) {
        map.addLayer(radarLayers[frame.path]);
    }
}

/**
 * Display particular frame of animation for the @position
 * If preloadOnly parameter is set to true, the frame layer only adds for the tiles preloading purpose
 * @param position
 * @param preloadOnly
 * @param force - display layer immediatelly
 */
function changeRadarPosition(position, preloadOnly, force) {
    while (position >= mapFrames.length) {
        position -= mapFrames.length;
    }
    while (position < 0) {
        position += mapFrames.length;
    }

    var currentFrame = mapFrames[animationPosition];
    var nextFrame = mapFrames[position];

    addLayer(nextFrame);

    // Quit if this call is for preloading only by design
    // or some times still loading in background
    if (preloadOnly || (isTilesLoading() && !force)) {
        return;
    }

    animationPosition = position;

    if (radarLayers[currentFrame.path]) {
        radarLayers[currentFrame.path].setOpacity(0);
    }
    radarLayers[nextFrame.path].setOpacity(100);


    var pastOrForecast = nextFrame.time > Date.now() / 1000 ? 'FORECAST' : 'PAST';
    document.getElementById("timestamp").innerHTML = pastOrForecast + ': ' + (new Date(nextFrame.time * 1000)).toString();
}

/**
 * Check avialability and show particular frame position from the timestamps list
 */
function showFrame(nextPosition, force) {
    var preloadingDirection = nextPosition - animationPosition > 0 ? 1 : -1;

    changeRadarPosition(nextPosition, false, force);

    // preload next next frame (typically, +1 frame)
    // if don't do that, the animation will be blinking at the first loop
    changeRadarPosition(nextPosition + preloadingDirection, true);
}

/**
 * Stop the animation
 * Check if the animation timeout is set and clear it.
 */
function stop() {
    is_playing = false
}

function play() {
    is_playing = true
}

function play_loop(){
    console.log(map)
    if (is_playing && map != undefined){
        showFrame(animationPosition + 1);
    }
}

/*
Electron functions to communicate through IPC
*/
function ask_for_loc(){
    send_message("weather", "send-location-data")
}

function create_warn_header(message){

    //removing all remaining warning popup children
    let warn_popup = document.getElementById("warn-popup")
    warn_popup.style.visibility = "visible"
    warn_popup.innerHTML = ""

    let info_text = document.createElement("h1")
    info_text.id = "warn-text"
    info_text.innerHTML = message

    document.getElementById("warn-popup").appendChild(info_text)
}

function remove_map(){
    if (map != undefined){
        map.remove()
        map = undefined
    }
}

window.onload = () => {
    document.getElementsByClassName("weather-but-run")[0].addEventListener("click", () => play())
    document.getElementsByClassName("weather-but-stop")[0].addEventListener("click", () => stop())
}

//play loop to render frames
setInterval(play_loop, 500)

window.electronAPI.on_message("geo-data", (data) => {
    console.log(data)
    if (data[0] == "none" && data[1] == "none"){
        remove_map()

        //map doesn't have location data
        create_warn_header("Current map does not support location data for weather services")
    }
    else if (data[0] == undefined && data[1] == undefined){
        remove_map()

        //map is not even selected
        create_warn_header("Nothing to render because no map was selected")
    }
    else{
        initialize_map()

        //map has location data
        map.setView([data[0], data[1]], data[2]);
    }
})