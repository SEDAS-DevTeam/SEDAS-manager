//constants
const PLANE_HEADING_MARKER = 50
const MARKER_COLOR = "white"
const STD_LINE_WIDTH = 5

//low level functions
function deg_to_rad(deg){
  return deg * (Math.PI / 180)
}

function rad_to_deg(rad){
  return Math.round(rad * (180 / Math.PI))
}

function renderCanvas(){
  var canvas = document.querySelector("#glcanvas");
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "black"

  //canvas resize
  canvas.width = window.screen.width
  canvas.height = window.screen.height

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderPlane(x, y, angle){ //0 - 360 degrees
  let radius = 5;

  var canvas = document.querySelector("#glcanvas");
  var context = canvas.getContext('2d');

  //plane rendering

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
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

function renderPlanePath(){

}

function renderAirspace(...coordinates){
  //coordinates are in [x, y] format

  var canvas = document.querySelector("#glcanvas");
  var context = canvas.getContext('2d');

  let startX = coordinates[0][0]
  let startY = coordinates[0][1]

  context.beginPath();

  for (let i = 0; i < coordinates.length; i++){
    
  }

}

function renderRunway(x1, y1, x2, y2){

}

window.addEventListener("load", renderCanvas)