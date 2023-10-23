function renderCanvas() { //clear & rerender whole canvas
    const canvas = document.querySelector("#glcanvas");
  
    //resize canvas
    canvas.width = window.screen.width
    canvas.height = window.screen.height
  
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it.",
      );
      return;
    }
  
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  
  //
  //Low level object rendering
  //
  
  //
  //High level object rendering
  //
  
  function renderPlane(x_coord, y_coord){
  
    var vertexShaderNode = createShaderFromScriptElement(gl, "node-vertex-shader");
    var fragmentShaderNode = createShaderFromScriptElement(gl, "node-fragment-shader");
    var programNode = createProgram(gl, [vertexShaderNode, fragmentShaderNode]);
    gl.useProgram(programNode);
  
    const canvas = document.querySelector("#glcanvas");
  
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
  
    let circle = {x: x_coord, y: y_coord, r: 20}
    let data = []
  
    data.push(circle.x - circle.r)
    data.push(circle.y - circle.r)
    data.push(circle.x)
    data.push(circle.y);
    data.push(circle.r);
  
    data.push(circle.x + (1 + Math.sqrt(2)) * circle.r);
    data.push(circle.y - circle.r);
    data.push(circle.x);
    data.push(circle.y);
    data.push(circle.r);
  
    data.push(circle.x - circle.r);
    data.push(circle.y + (1 + Math.sqrt(2)) * circle.r);
    data.push(circle.x);
    data.push(circle.y);
    data.push(circle.r);
  
    var dataBuffer = new Float32Array(data);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        dataBuffer,
        gl.STATIC_DRAW);
  
    var resolutionLocation = gl.getUniformLocation(programNode, "u_resolution");
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  
    var positionLocation = gl.getAttribLocation(programNode, "a_position");
    var centerLocation = gl.getAttribLocation(programNode, "a_center");
    var radiusLocation = gl.getAttribLocation(programNode, "a_radius");
  
    
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(centerLocation);
    gl.enableVertexAttribArray(radiusLocation);
  
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(centerLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 8);
    gl.vertexAttribPointer(radiusLocation, 1, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 16);
  
    gl.drawArrays(gl.TRIANGLES, 0, data.length/ATTRIBUTES);
  
  }
  
  function renderAirspace(){
  
  }
  
  window.addEventListener("load", renderCanvas)