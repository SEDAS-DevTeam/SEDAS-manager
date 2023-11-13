//constants

//PLANE DEFS
const PLANE_HEADING_MARKER = 25
const MARKER_COLOR = "white"
const STD_LINE_WIDTH = 3
const PLANE_MARKER_RADIUS = 5
const PLANE_POINTER_WIDTH = 2
const BBOX_PAD = 5
const POINTER_INDENT = 15
const MAX_RECT_WIDTH = 100
const LINE_INDENT = 15
const INFO_TEXT_SIZE = 12

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

  var canvas1 = document.querySelector("#canvas1")
  var context1 = canvas1.getContext("2d")

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

  //plane info rendering
  let proc_x = x + 50;
  let proc_y = y - 50;

  let width = MAX_RECT_WIDTH;
  let height = 0;

  for (const [key, value] of Object.entries(plane_info)) {
    if (value == undefined){
      continue
    }

    renderText(proc_x, proc_y, `${key}: ${value}`, "white", INFO_TEXT_SIZE + "px")
    proc_y -= LINE_INDENT
    height += (INFO_TEXT_SIZE + LINE_INDENT / 2) //This feels illegal
  }

  let x1_text = proc_x
  let y1_text = proc_y


  context1.strokeStyle = "white"
  context1.lineWidth = PLANE_POINTER_WIDTH

  //plane pointer rendering
  context1.beginPath()

  //info bounding box rendering
  context1.rect(x1_text - BBOX_PAD, y1_text - BBOX_PAD, width + BBOX_PAD, height + BBOX_PAD)

  context1.moveTo(x, y)

  let x2 = 0;
  let y2 = 0;
  if (proc_x < x){
    //label is on the left
    x2 = x1_text + width
  }
  else{
    //label is on the right
    x2 = x1_text
  }
  if (proc_y < y){
    //label is on the top
    y2 = y1_text + height
  }
  else{
    //label is ont the bot
    y2 = y1_text
  }

  context1.lineTo(x2, y2)
  context1.stroke()
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
  var canvas3 = document.querySelector("#canvas1");
  var context3 = canvas3.getContext('2d');

  context3.beginPath();
  context3.moveTo(x, y)
  context3.lineTo(x + POINT_TRIAG_LENGTH, y)
  context3.lineTo(x, y - POINT_TRIAG_LENGTH)
  context3.lineTo(x - POINT_TRIAG_LENGTH, y)
  
  context3.fillStyle = color;
  context3.fill();

  renderText(x + 15, y - 15, name, "white", "12px")
}

function renderAirport(x, y, name){
  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  context.beginPath()
  context.moveTo(x, y)
  context.arc(x, y, ARP_POINT_DIAM, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();
}

function renderText(x, y, text, color, weight){
  var canvas = document.querySelector("#canvas3");
  var context = canvas.getContext('2d');

  context.font = weight + " Arial"
  context.fillStyle = color
  context.fillText(text, x, y)
}