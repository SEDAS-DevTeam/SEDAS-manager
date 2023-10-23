function renderCanvas(){
  var canvas = document.querySelector("#glcanvas");
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "black"

  //canvas resize
  canvas.width = window.screen.width
  canvas.height = window.screen.height

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderPlane(x, y){
  let radius = 5;

  var canvas = document.querySelector("#glcanvas");
  var context = canvas.getContext('2d');

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();
}

function renderAirspace(){

}

window.addEventListener("load", renderCanvas)