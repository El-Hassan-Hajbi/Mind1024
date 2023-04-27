document.addEventListener('DOMContentLoaded', function() {
(function() {
  function f(vector) {
    var res = [];
    for (var element of vector) {
      if (element == 0) {
          res[res.length] = -1;
      }
      else {
        res[res.length] = 1;
      }
    }
    return res;
  }

  function prepare_data(dataset){
    var res= [];
    for (var i = 0; i< dataset.length; i++) {
      res[i] = [];
      var ith = dataset[i].input;
      for (var j = 0; j< ith.length; j++) {
        if (ith[j] == 0) {res[i][j] = -1;}
        else {res[i][j] = 1;}
      }
    }
    return res;
  }
  
  const jsonFiles = [
    '../digits/0.json',
    '../digits/1.json',
    '../digits/2.json',
    '../digits/3.json',
    '../digits/4.json',
    '../digits/5.json',
    '../digits/6.json',
    '../digits/7.json',
    '../digits/8.json',
    '../digits/9.json',
  ];
  
  // MNIST digits
  var MNIST = [];
  var raw = [];
  // size of the sample images (28 x 28)
  var size = 28;
  
  async function loadJsonFiles() {
    for (const file of jsonFiles) {
      const response = await fetch(file);
      const json = await response.json();
      raw.push(json.data);
    }
  }
  
  loadJsonFiles().then(() => {
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (id) {
      // mnist digit
      var digit = {
        id: id
      };
    
      // raw data
      digit.raw = raw[digit.id];
    
      // number of samples
      digit.length = digit.raw.length / (size * size) | 0;
    
      // get one sample
      digit.get = function (_which) {
        var which = _which;
        // if not specified, or if invalid, pick a random sample
        if ('undefined' == typeof which || which > digit.length || which < 0) {
          which = Math.random() * digit.length | 0;
        }
    
        // generate sample
        var sample = [];
        for (
          var length = size * size,
          start = which * length,
          i = 0;
          i < length;
          sample.push(digit.raw[start + i++])
        );
        return sample;
      }
    
      // get a range of samples
      digit.range = function (start, end) {
        if (start < 0)
          start = 0;
        if (end >= digit.length)
          end = digit.length - 1;
        if (start > end) {
          var tmp = start;
          start = end;
          end = tmp;
        }
        var range = [];
        for (
          var i = start;
          i <= end;
          range.push(digit.get(i++))
        );
        return range;
      }
    
      // get set of digits, ready to be used for training or testing
      digit.set = function (start, end) {
        var set = [];
        var output = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        output[digit.id] = 1;
        var range = digit.range(start, end);
        for (
          var i = 0;
          i < range.length;
          set.push({
            input: range[i++],
            output: output
          })
        );
        return set;
      }
    
      // add mnist digit
      MNIST.push(digit);
    });
    
    // Generates non-overlaping training and a test sets, with the desired ammount of samples
    MNIST.get = function (count) {
      var range = [];
      for (var i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        range = range.concat(this[i].set(0, this[i].length));
      }
      range = shuffle(range);
      if (Number(count)) {
        range = range.slice(0, Number(count));
      }
      return range;
    }
    
    
    // Generates non-overlaping training and a test sets, with the desired ammount of samples
    MNIST.set = function (_training, _test) {
      var training = _training / 10 | 0;
      var test = _test / 10 | 0;
    
      if (training < 1)
        training = 1;
      if (test < 1)
        test = 1;
    
      // check that there are enough samples to make the sets, and change the ammounts if they are too big
      if (training + test + 1 > MNIST.__MINLENGTH) {
        console.warn('There are not enough samples to make a training set of ' + training + ' elements and a test set of ' + test + ' elements.');
        if (training > test) {
          test = MNIST.__MINLENGTH * (test / training);
          training = MNIST.__MINLENGTH - training;
        }
        else {
          training = MNIST.__MINLENGTH * (training / test);
          test = MNIST.__MINLENGTH - test;
        }
      }
    
      // make both sets
      var trainingSet = [];
      var testSet = [];
    
      for (var i = 0; i < 10; i++) {
        trainingSet = trainingSet.concat(MNIST[i].set(0, training - 1));
        testSet = testSet.concat(MNIST[i].set(training, training + test - 1));
      }
    
      // return the sets, shuffled
      return {
        training: shuffle(trainingSet),
        test: shuffle(testSet)
      }
    }
    
    // draws a given digit in a canvas context
    MNIST.draw = function (digit, context, offsetX, offsetY) {
      var imageData = context.getImageData(offsetX || 0, offsetY || 0, size, size);
      for (var i = 0; i < digit.length; i++) {
        imageData.data[i * 4] = digit[i] * 255;
        imageData.data[i * 4 + 1] = digit[i] * 255;
        imageData.data[i * 4 + 2] = digit[i] * 255;
        imageData.data[i * 4 + 3] = 255;
      }
      context.putImageData(imageData, offsetX || 0, offsetY || 0);
    }
    
    // takes an array of 10 digits representing a number from 0 to 9 (ie. any output in a dataset) and returns the actual number
    MNIST.toNumber = function (array) {
      return array.indexOf(Math.max.apply(Math, array));
    }
    
    // CommonJS & AMD
    if (typeof define !== 'undefined' && define.amd) {
      define([], function () { return MNIST });
    }
    
    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = MNIST;
    }
    
    // Browser
    if (typeof window == 'object') {
      (function () {
        var old = window['mnist'];
        MNIST.ninja = function () {
          window['mnist'] = old;
          return MNIST;
        };
      })();
    
      window['mnist'] = MNIST;
    }
    
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    
    function shuffle(v) {
      for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
      return v;
    };
  
    
    var set = MNIST.set(8000, 2000);
  
    var trainingSet = set.training;
    var digit = MNIST[9].get();
    
    //var mnist = require('mnist');
    var DRAWING_COUNT = 1;
    var PICTURE_SIZE = 28;
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
    //pattern = image and a onehotencoded value 
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
            ctx.fillStyle = 'white';
          } else {
            ctx.fillStyle = 'black';
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
      var set = MNIST.set(1, 1);
  
      var trainingSet = set.training;
      var testSet = set.test;
      
      //console.log(prepare_data(trainingSet));
      var training_data = prepare_data(trainingSet);
      var test_data = prepare_data(testSet);
      //console.log(test_data);
      var digit = MNIST[5].get();
      this._drawingsElement = document.getElementById('drawings');
      var drawing = new Canvas();
      drawing.setVector(f(digit));
      this.drawing = drawing;
      this._drawingsElement.appendChild(drawing.element());
      var boutonPrintCell = document.getElementById('print-cells');
      var boutonClassification = document.getElementById('run-classification');
      var output_text = document.getElementById('output-classification');
      boutonPrintCell.addEventListener('click', function(){
        console.log(f(drawing.print_cells()));
      });
      boutonClassification.addEventListener('click', function(){
        console.log(network.classify(f(drawing.print_cells())));
      });
      var network = new Hopfield(1024);
      network.train(training_data);
      //console.log(network.patterns);
      //console.log(network.classify(drawing.print_cells()));
      //console.log(network.classify(test_data[0]));
      }    
    
  
      new App();
  
    
    //console.log(f(digit));
  });
  



  
  })();});