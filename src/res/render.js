//constants

//PLANE DEFS
const PLANE_HEADING_MARKER = 25
const MARKER_COLOR = "white"
const STD_LINE_WIDTH = 3
const PLANE_MARKER_RADIUS = 5

//PLANE PATH DEFS
const PLANE_PATH_RADIUS = 3

//AIRSPACE DEFS
const AIRSPACE_SECTOR_COLOR = "#3a367e"

//No-fly ZONE DEFS
const NO_FLY_ZONE_LINE_WIDTH = 2
const NO_FLY_ZONE_COLOR = "#e0433c"

//RUNWAY DEFS
const STD_RUNWAY_WIDTH = 2
const RUNWAY_COLOR = "#17213a"

//POINT DEFS
const POINT_TRIAG_LENGTH = 5

//AIRPORT DEFS
const ARP_POINT_DIAM = 4

//low level functions
function deg_to_rad(deg){
  return deg * (Math.PI / 180)
}

function rad_to_deg(rad){
  return Math.round(rad * (180 / Math.PI))
}

function renderCanvas(canvas_id){
  var canvas = document.querySelector("#canvas" + canvas_id.toString());
  var ctx = canvas.getContext("2d");

  switch(canvas_id){
    case 1:
      //low-level canvas (airspace, no-fly zone, background, terrain)
      ctx.fillStyle = "black"

      //canvas resize
      canvas.width = window.screen.width
      canvas.height = window.screen.height
    
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      break
    case 2:
      //mid-level canvas (airplanes, airplane paths)
      //canvas resize
      canvas.width = window.screen.width
      canvas.height = window.screen.height
      break
    case 3:
      //top-level canvas (airplane info, selected labels, selected paths)
      //canvas resize
      canvas.width = window.screen.width
      canvas.height = window.screen.height
      break
  }
}

function renderPlane(x, y, angle, plane_info){ //0 - 360 degrees
  /*
  plane_info example:
  plane_info = {
    "callsign": "LX123",
    "level": 120, [in ft]
    "speed": 150 [in kts],
    "code": undefined/7500/7600/7700 [squawks reserved by international law]
  }
  */

  var canvas = document.querySelector("#canvas2");
  var context = canvas.getContext('2d');

  //plane rendering

  context.beginPath();
  context.arc(x, y, PLANE_MARKER_RADIUS, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  //plane heading rendering
  context.beginPath()
  context.moveTo(x, y)

  let angle_head = Math.floor(angle / 90)
  let rel_angle = angle % 90
  if(angle % 90 == 0 && angle != 0){
    rel_angle = angle - (angle_head - 1) * angle
  }

  let dy = Math.sin(deg_to_rad(rel_angle)) * PLANE_HEADING_MARKER
  let dx = Math.cos(deg_to_rad(rel_angle)) * PLANE_HEADING_MARKER

  let x1, y1 = 0

  switch(angle_head){
    case 0:
      x1 = x - dx
      y1 = y - dy
      break
    case 1:
      x1 = x + dx
      y1 = y - dy
      break
    case 2:
      x1 = x + dx
      y1 = y + dy
      break
    case 3:
      x1 = x - dx
      y1 = y + dy
      break
    case 4:
      //just for deg = 360
      x1 = x - PLANE_HEADING_MARKER
      y1 = y
  }

  context.lineTo(x1, y1);
  context.strokeStyle = MARKER_COLOR
  context.lineWidth = STD_LINE_WIDTH
  context.stroke()
}

function renderPlanePath(...coordinates){
  var canvas = document.querySelector("#canvas2");
  var context = canvas.getContext('2d');

  context.beginPath();

  for (let i = 0; i < coordinates.length; i++){
    context.moveTo(coordinates[i][0], coordinates[i][1])
    context.arc(coordinates[i][0], coordinates[i][1], PLANE_PATH_RADIUS, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
  }
}

function renderAirspace(color, ...coordinates){
  //coordinates are in [x, y] format

  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  let startX = coordinates[0][0]
  let startY = coordinates[0][1]

  let coordinates_mod = coordinates.shift()

  context.beginPath();
  context.moveTo(startX, startY)

  for (let i = 0; i < coordinates_mod.length; i++){
    context.lineTo(coordinates_mod[i][0], coordinates_mod[i][1])
    context.stroke()
  }

  context.fillStyle = AIRSPACE_SECTOR_COLOR
  context.fill()

}

function renderNoFlyZone(...coordinates){
  //coordinates are in [x, y] format

  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  let startX = coordinates[0][0]
  let startY = coordinates[0][1]

  let coordinates_mod = coordinates.shift()

  context.beginPath();
  context.moveTo(startX, startY)

  context.lineWidth = NO_FLY_ZONE_LINE_WIDTH
  context.strokeStyle = NO_FLY_ZONE_COLOR

  for (let i = 0; i < coordinates_mod.length; i++){
    context.lineTo(coordinates_mod[i][0], coordinates_mod[i][1])
    context.stroke()
  }
}

function renderRunway(x1, y1, x2, y2){
  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  context.beginPath()
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)

  context.strokeStyle = RUNWAY_COLOR
  context.lineWidth = STD_RUNWAY_WIDTH
  context.stroke()
}

function renderPoint(x, y, name, color){
  var canvas = document.querySelector("#canvas3");
  var context = canvas.getContext('2d');

  context.beginPath();
  context.moveTo(x, y)
  context.lineTo(x + POINT_TRIAG_LENGTH, y)
  context.lineTo(x, y - POINT_TRIAG_LENGTH)
  context.lineTo(x - POINT_TRIAG_LENGTH, y)
  
  context.fillStyle = color;
  context.fill();
}

function renderAirport(x, y, name){
  var canvas = document.querySelector("#canvas3");
  var context = canvas.getContext('2d');

  context.beginPath()
  context.moveTo(x, y)
  context.arc(x, y, ARP_POINT_DIAM, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();
}

function renderText(x, y, text, color){
  var canvas = document.querySelector("#canvas3");
  var context = canvas.getContext('2d');

  context.font = "48px serif"
  context.fillStyle = color
  context.fillText(text, x, y)
}