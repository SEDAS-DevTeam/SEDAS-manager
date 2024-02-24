//constants

//BACKROUND
const BACKROUND_COLOR = "black"

//PLANE DEFS
const MARKER_COLOR = "white"
const PLANE_HEADING_MARKER = 25
const STD_LINE_WIDTH = 3
const PLANE_MARKER_RADIUS = 5
const PLANE_POINTER_WIDTH = 2
const BBOX_PAD = 5
const POINTER_INDENT = 15
const MAX_RECT_WIDTH = 100
const LINE_INDENT = 15
const INFO_TEXT_SIZE = 12
const MARKER_SCALE_CONST = 3

//PLANE PATH DEFS
const PLANE_PATH_RADIUS = 2

//AIRSPACE DEFS
const SECTOR_COLOR = "#171414"
const SECTOR_BORDER_COLOR = "#9B5151"
const SECTOR_BORDER_WIDTH = 4

//No-fly ZONE DEFS
const NO_FLY_ZONE_COLOR = "#404040"
const NO_FLY_ZONE_BORDER_COLOR = "#FAFF00"
const NO_FLY_ZONE_BORDER_WIDTH = 1

//TERRAIN DEFS
const TERRAIN_COLOR = "#171414"
const TERRAIN_BORDER_COLOR = "#9B5151"
const TERRAIN_BORDER_WIDTH = 2

//RUNWAY DEFS
const RUNWAY_COLOR = "#9D9D9D"
const RUNWAY_WIDTH = 3

//POINT DEFS
const POINT_TRIAG_LENGTH = 6
const POINT_COLOR = "#9D9D9D"

//AIRPORT DEFS (ARP)
const ARP_TRIAG_LENGTH = 6
const ARP_COLOR = "#EDEDED"

//SID DEFS
const SID_TRIAG_LENGTH = 12
const SID_COLOR = "#7B85DA"

//STAR DEFS
const STAR_TRIAG_LENGTH = 12
const STAR_COLOR = "#C38B8B"

//SCALE DEFS
const SCALE_DIST_FROM_SCREEN_X = 150
const SCALE_DIST_FROM_SCREEN_Y = 200
const SCALE_LEN = 100
const SCALE_WIDTH = 3
const SCALE_CORNER = 5

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
      ctx.fillStyle = BACKROUND_COLOR

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

function renderPlane(x, y, angle, plane_speed, max_speed, min_speed){ //0 - 360 degrees
  /*
  plane_info example:
  plane_info = {
    "callsign": "LX123",
    "level": 120, [in ft]
    "speed": 150 [in kts],
    "code": undefined/7500/7600/7700 [squawks reserved by international law]
  }
  */

  //get scale
  var scale = (parseInt(plane_speed) - parseInt(min_speed)) / (parseInt(max_speed) - parseInt(min_speed))
  var scale_to_len = PLANE_HEADING_MARKER + PLANE_HEADING_MARKER * scale * MARKER_SCALE_CONST

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

  let dy = Math.sin(deg_to_rad(rel_angle)) * scale_to_len
  let dx = Math.cos(deg_to_rad(rel_angle)) * scale_to_len

  let x1, y1 = 0
  console.log(angle_head)

  switch(angle_head){
    case 0:
      x1 = x + dy
      y1 = y - dx
      break
    case 1:
      x1 = x + dx
      y1 = y + dy
      break
    case 2:
      x1 = x - dy
      y1 = y + dx
      break
    case 3:
      x1 = x - dx
      y1 = y - dy
      break
    case 4:
      //just for deg = 360
      x1 = x
      y1 = y - scale_to_len
  }

  if(angle == 90){
    x1 = x + scale_to_len
    y1 = y
  }
  else if(angle == 180){
      x1 = x
      y1 = y + scale_to_len
  }
  else if(angle == 270){
      x1 = x - scale_to_len
      y1 = y
  }
  else if(angle == 360){
      x1 = x
      y1 = y - scale_to_len
  }

  context.lineTo(x1, y1);
  context.strokeStyle = MARKER_COLOR
  context.lineWidth = STD_LINE_WIDTH
  context.stroke()
}

function renderPlaneInfo(x_plane, y_plane, x, y, plane_info){
  //plane info rendering
  var canvas1 = document.querySelector("#canvas3")
  var context1 = canvas1.getContext("2d")

  let proc_x = x;
  let proc_y = y;

  let init_y = proc_y

  let width = MAX_RECT_WIDTH;
  let height = 0;

  for (const [key, value] of Object.entries(plane_info)) {
    if (value == undefined){
      continue
    }

    renderText(proc_x, proc_y, `${key}: ${value}`, "white", INFO_TEXT_SIZE + "px", "canvas3")
    proc_y -= LINE_INDENT
    height += (INFO_TEXT_SIZE + LINE_INDENT / 2) //This feels illegal
  }

  let x1_text = proc_x + width
  let y1_text = proc_y


  context1.strokeStyle = "white"
  context1.lineWidth = PLANE_POINTER_WIDTH

  //plane pointer rendering
  context1.beginPath()

  //info bounding box rendering
  //context1.rect(x1_text - BBOX_PAD, y1_text - BBOX_PAD, width + BBOX_PAD, height + BBOX_PAD)

  context1.moveTo(x_plane, y_plane)

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

  return [x1_text, init_y + height, x2 - width, init_y]
}

function renderPlanePath(coordinates){
  var canvas = document.querySelector("#canvas3");
  var context = canvas.getContext('2d');

  context.beginPath();
  for (let i = 0; i < coordinates.length; i++){
    context.moveTo(coordinates[i][0], coordinates[i][1])
    context.arc(coordinates[i][0], coordinates[i][1], PLANE_PATH_RADIUS, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
  }
}

function renderAirspace(fill_style, stroke_style, line_width, ...coordinates){
  //coordinates are in [x, y] format

  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  let startX = coordinates[0][0]
  let startY = coordinates[0][1]

  let coordinates_mod = coordinates.shift()

  context.beginPath();
  context.fillStyle = fill_style
  context.strokeStyle = stroke_style
  context.lineWidth = line_width;
  context.moveTo(startX, startY)

  for (let i = 0; i < coordinates_mod.length; i++){
    context.lineTo(coordinates_mod[i][0], coordinates_mod[i][1])
  }
  context.lineTo(coordinates_mod[0][0], coordinates_mod[0][1])
  context.stroke()
  context.fill()
}

function renderRunway(x1, y1, x2, y2){
  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  context.beginPath()
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)

  context.strokeStyle = RUNWAY_COLOR
  context.lineWidth = RUNWAY_WIDTH
  context.stroke()
}

function renderPoint(x, y, name, color, triag_len){
  var canvas3 = document.querySelector("#canvas1");
  var context3 = canvas3.getContext('2d');

  context3.beginPath();
  context3.moveTo(x, y)
  context3.lineTo(x + triag_len, y)
  context3.lineTo(x, y - triag_len)
  context3.lineTo(x - triag_len, y)
  
  context3.fillStyle = color;
  context3.fill();

  renderText(x + 15, y - 15, name, color, "12px", "canvas1")
}

function renderAirport(x, y, name){
  var canvas3 = document.querySelector("#canvas1");
  var context3 = canvas3.getContext('2d');

  var canvas = document.querySelector("#canvas1");
  var context = canvas.getContext('2d');

  context.beginPath()
  context.moveTo(x, y)
  context3.moveTo(x, y)
  context3.lineTo(x + ARP_TRIAG_LENGTH, y)
  context3.lineTo(x, y - ARP_TRIAG_LENGTH)
  context3.lineTo(x - ARP_TRIAG_LENGTH, y)
  context.fillStyle = ARP_COLOR;
  context.fill();

  renderText(x + 15, y - 15, name, ARP_COLOR, "12px", "canvas1")
}

function renderText(x, y, text, color, weight, canvas_layer){
  var canvas = document.querySelector("#" + canvas_layer);
  var context = canvas.getContext('2d');

  context.font = weight + " Arial"
  context.fillStyle = color
  context.fillText(text, x, y)
}

function renderScale(scale){
  var canvas = document.querySelector("#canvas3")
  var context = canvas.getContext('2d');

  //always set to 100 pixels
  let x1 = window.screen.width - SCALE_DIST_FROM_SCREEN_X - SCALE_LEN
  let x2 = window.screen.width - SCALE_DIST_FROM_SCREEN_X
  let y = window.screen.height - SCALE_DIST_FROM_SCREEN_Y

  renderText(window.screen.width - SCALE_DIST_FROM_SCREEN_X - SCALE_LEN, window.screen.height - SCALE_DIST_FROM_SCREEN_Y - 15, `scale: ${parseFloat(scale) * SCALE_LEN} nm`, "white", "24px", "canvas3")
  
  context.beginPath()
  context.moveTo(x1, y)
  context.lineTo(x1, y - SCALE_CORNER)
  context.lineTo(x1, y + SCALE_CORNER)
  context.moveTo(x1, y)

  context.lineTo(x2, y)
  context.lineTo(x2, y - SCALE_CORNER)
  context.lineTo(x2, y + SCALE_CORNER)
  
  context.strokeStyle = "white"
  context.lineWidth = SCALE_WIDTH
  context.stroke()
}