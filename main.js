document.addEventListener('DOMContentLoaded', function() {
(function() {
    var mnist = require('mnist');
    var DRAWING_COUNT = 1;
    var PICTURE_SIZE = 26;
    var CANVAS_SIZE = 300;
    var INTERVAL = 20;
    var ACTIVATION_THRESHOLD = 0;
    var CONVERGE_NODES = 5;

  function Hopfield(nodeCount) {
    this._weights = [];
    this._values = [];
    this.numNeurons = nodeCount;
    this.patterns = [];
    for (var i = 0; i < nodeCount; ++i) {
      this._weights[i] = [];
      this._values[i] = -1;
      for (var j = 0; j < nodeCount; ++j) {
        this._weights[i][j] = 1;
      }
    }
  }

  Hopfield.prototype.train = function(samples) {
    this._resetWeights();
    this.patterns[this.patterns.length] = samples;
    var nodeCount = this._values.length;
    for (var i = 0; i < nodeCount; ++i) {
      for (var j = 0; j < nodeCount; ++j) {
        for (var k = 0, len = samples.length; k < len; ++k) {
          if (samples[k][i] === samples[k][j]) {
            this._weights[i][j] += 1 / len;
          } else {
            this._weights[i][j] -= 1 / len;
          }
        }
      }
    }
  }
  Hopfield.prototype.recall = function(inputPattern) {
    let outputPattern = new Array(this.numNeurons).fill(0);

    for (let i = 0; i < this.numNeurons; i++) {
      let activation = 0;
      for (let j = 0; j < this.numNeurons; j++) {
        activation += this._weights[i][j] * inputPattern[j];
      }
      outputPattern[i] = activation >= 0 ? 1 : -1;
    }

    return outputPattern;
  }
  Hopfield.prototype._resetWeights = function() {
    var nodeCount = this._values.length;
    for (var i = 0; i < nodeCount; ++i) {
      for (var j = 0; j < nodeCount; ++j) {
        this._weights[i][j] = 0;
      }
    }
  };

  Hopfield.prototype.classify = function(pattern) {
    // Apply the pattern to the Hopfield network to retrieve a stable state
    const stableState = this.recall(pattern);

    // Check which pattern the stable state matches
    for (let i = 0; i < this.patterns.length; i++) {
      const currentPattern = this.patterns[i];
      if (arraysEqual(stableState, currentPattern)) {
        return `The input pattern matches pattern ${i + 1}`;
      }
    }

    // If no pattern matches, return an error message
    return "Error: the input pattern does not match any of the trained patterns";
  }

// Helper function to compare two arrays element by element
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

    function Canvas() {
      this._cells = [];
      for (var i = 0; i < PICTURE_SIZE*PICTURE_SIZE; ++i) {
        this._cells[i] = false;
      }
      this._element = document.createElement('canvas');
      this._element.width = CANVAS_SIZE;
      this._element.height = CANVAS_SIZE;
      this._element.className = 'drawing';
      this._registerMouseEvents();
      //this.setVector(Array.from({length: this._cells.length}, () => true));
    }
  
    Canvas.prototype.element = function() {
      return this._element;
    };

    Canvas.prototype.print_cells = function() {
        return this._cells;      
    }

    Canvas.prototype.vector = function() {
      var res = [];
      for (var i = 0, len = this._cells.length; i < len; ++i) {
        if (this._cells[i]) {
          res[i] = 1;
        } else {
          res[i] = -1;
        }
      }
      return res;
    };
  
    Canvas.prototype.setVector = function(v) {
      for (var i = 0, len = this._cells.length; i < len; ++i) {
        if (v[i] < 0) {
          this._cells[i] = false;
        } else {
          this._cells[i] = true;
        }
      }
      this._draw();
    };
  
    Canvas.prototype.dimension = function() {
      return PICTURE_SIZE;
    };
  
    Canvas.prototype._draw = function() {
      var ctx = this._element.getContext('2d');
      ctx.clearRect(0, 0, this._element.width, this._element.height);
      var tileSize = CANVAS_SIZE / PICTURE_SIZE;
      for (var x = 0; x < PICTURE_SIZE; ++x) {
        for (var y = 0; y < PICTURE_SIZE; ++y) {
          var rectLeft = x*tileSize;
          var rectTop = y*tileSize;
          if (this._cells[x+y*PICTURE_SIZE]) {
            ctx.fillStyle = 'black';
          } else {
            ctx.fillStyle = 'white';
          }
          ctx.fillRect(rectLeft, rectTop, tileSize, tileSize);
        }
      }
    };
  
    Canvas.prototype._registerMouseEvents = function() {
      var tileSize = CANVAS_SIZE / PICTURE_SIZE;
  
      var mouseMoved = false;
  
      this._element.addEventListener('click', function(e) {
        if (mouseMoved) {
          return;
        }
        var clientRect = this._element.getBoundingClientRect();
        var x = Math.floor((e.clientX - clientRect.left) / tileSize);
        var y = Math.floor((e.clientY - clientRect.top) / tileSize);
        x = Math.max(0, Math.min(PICTURE_SIZE-1, x));
        y = Math.max(0, Math.min(PICTURE_SIZE-1, y));
        var idx = x + y*PICTURE_SIZE;
        this._cells[idx] = !this._cells[idx];
        this._draw();
      }.bind(this));
  
      this._element.addEventListener('mousedown', function(e) {
        mouseMoved = false;
        var boundMovement = function(e) {
          var clientRect = this._element.getBoundingClientRect();
          var x = Math.floor((e.clientX - clientRect.left) / tileSize);
          var y = Math.floor((e.clientY - clientRect.top) / tileSize);
          x = Math.max(0, Math.min(PICTURE_SIZE-1, x));
          y = Math.max(0, Math.min(PICTURE_SIZE-1, y));
          var idx = x + y*PICTURE_SIZE;
          this._cells[idx] = true;
          this._draw();
          mouseMoved = true;
        }.bind(this);
        window.addEventListener('mousemove', boundMovement);
        var boundMouseUp;
        boundMouseUp = function() {
          window.removeEventListener('mousemove', boundMovement);
          window.removeEventListener('mouseup', boundMouseUp);
        }.bind(this);
        window.addEventListener('mouseup', boundMouseUp);
      }.bind(this));
    };
    function App() {
        this._drawingsElement = document.getElementById('drawings');
        var drawing = new Canvas();
        this.drawing = drawing;
        this._drawingsElement.appendChild(drawing.element());
        var boutonPrintCell = document.getElementById('print-cells');
        var output_text = document.getElementById('output-classification');
        boutonPrintCell.addEventListener('click', function(){
          console.log(drawing.print_cells());
      });
      var network = new Hopfield(1024);
      network.train([false, false, false, false, false, false, true, true, false, false, false, true, true, false, false, false, false, true, false, false, false, false, true, false, false]);
      console.log(network.patterns);
      //console.log(network.classify(drawing.print_cells()));
      console.log(network.classify([false, false, false, false, false, false, true, true, false, false, false, true, true, false, false, false, false, true, false, false, false, false, true, false, false]));
      }    
    
  
    window.addEventListener('load', function() {
        new App();

    });
  
  })();});