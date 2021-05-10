/*
    * Helper functions
    */
const getCursorPosition = (canvas, event) => {
  // get x and y position inside the current canvas

  // events might be touch or mouse - touch events have an array of touches...
  // ref: https://stackoverflow.com/questions/9585487/cant-get-coordinates-of-touchevents-in-javascript-on-android-devices
  // ref: https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent
  let x;
  let y;
  const rect = canvas.getBoundingClientRect();

  if (event.touches) {
    const firstTouch = event.touches[0];
    x = firstTouch.clientX - rect.left;
    y = firstTouch.clientY - rect.top;
  } else {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }

  return {
    x,
    y,
  };
}

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// colours chosen via UI, state stored in data attr
const getCurrentColour = () => {
  const colourSelector = document.querySelector('.js--control--colour');
  let colourAttr = 'rainbow';
  if (colourSelector) {
    colourAttr = colourSelector.getAttribute('data-colour');
  }

  if (colourAttr !== 'rainbow') {
    return colourAttr;
  }

  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// adding random strokes and random widths around recorded points
const addPointsAround = (point, fresh) => {
  points.push([
    // true point
    {
      x: point.x,
      y: point.y,
      width: getRandomInt(0, 3),
      colour: getCurrentColour(),
      fresh,
    },
    {
      x: point.x + getRandomInt(0, 2),
      y: point.y + getRandomInt(0, 2),
      width: getRandomInt(0, 2),
    },
    {
      x: point.x - getRandomInt(0, 2),
      y: point.y - getRandomInt(0, 3),
      width: getRandomInt(0, 2),
    },
  ]);
};


/*
* Event Listeners
*/
const down = (e, canvas) => {
  isDrawing = true;

  const relativePos = getCursorPosition(canvas, e);

  addPointsAround(relativePos, true);
};

const move = (e, canvas, ctx) => {
  if (!isDrawing) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.beginPath();
  ctx.arc(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, ctx.canvas.width * 0.25, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#acc6e8';
  ctx.fill();

  if (loadedImage) {
    ctx.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  const relativePos = getCursorPosition(canvas, e);

  addPointsAround(relativePos, false);

  points.forEach((point, i, a) => {
    ctx.beginPath();

    // move to previous point/s unless this point came after a break in drawing
    let prevIndexIfRelevant = point[0].fresh ? i : i-1;


    // central point
    ctx.moveTo(a[prevIndexIfRelevant][0].x, a[prevIndexIfRelevant][0].y);
    ctx.lineWidth = point[0].width;
    ctx.lineTo(point[0].x, point[0].y);
    ctx.strokeStyle = point[0].colour;
    ctx.stroke();

    // randomised positive
    ctx.moveTo(a[prevIndexIfRelevant][1].x, a[prevIndexIfRelevant][1].y);
    ctx.lineWidth = point[1].width;
    ctx.lineTo(point[1].x, point[1].y);
    ctx.strokeStyle = point[0].colour;
    ctx.stroke();

    //randomised negative
    ctx.moveTo(a[prevIndexIfRelevant][2].x, a[prevIndexIfRelevant][2].y);
    ctx.lineWidth = point[2].width;
    ctx.lineTo(point[2].x, point[2].y);
    ctx.strokeStyle = point[0].colour;
    ctx.stroke();
  })
};

const done = (canvas) => {
  isDrawing = false;
  // points.length = 0;

  const destinationCanvas = document.getElementById('c-target');
  const destCtx = destinationCanvas.getContext('2d');

  destCtx.clearRect(0, 0, destCtx.canvas.width, destCtx.canvas.height);
  destCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, destCtx.canvas.width, destCtx.canvas.height);
}

const clear = (canvas, ctx) => {
  // clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // delete points
  points.length = 0;

  // delete image
  loadedImage = false;

  // also clear second canvas
  done(canvas);
}

const colourCycle = () => {
  const colourSelector = document.querySelector('.js--control--colour');
  if (colourSelector) {
    const colourAttr = colourSelector.getAttribute('data-colour');

    switch  (colourAttr) {
      case '#14233a':
        colourSelector.setAttribute('data-colour', '#ea9494');
        colourSelector.innerHTML = '🔴';
        break;
      case '#ea9494':
        colourSelector.setAttribute('data-colour', '#acc6e8');
        colourSelector.innerHTML = '🔵';
        break;
      // case '#acc6e8':
      //   colourSelector.setAttribute('data-colour', 'rainbow');
      //   colourSelector.innerHTML = '🌈';
      //   break;
      default:
        colourSelector.setAttribute('data-colour', '#14233a');
        colourSelector.innerHTML = '⚫';
        break;
    }
  }
}

const uploadImage = (e) => {
  const URL = window.URL;
  const url = URL.createObjectURL(e.target.files[0]);
  const img = document.createElement('img');
  img.src = url;

  img.onload = () => {
      var canvas = document.getElementById('c-source');
      var ctx = canvas.getContext('2d');

      loadedImage = img;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height, 0, 0, ctx.canvas.width, ctx.canvas.height);

      done(canvas);
  }
};

const downloadCanvasAsImage = () => {
  // to actually download:
  let downloadLink = document.createElement('a');
  downloadLink.setAttribute('download', 'GRAAG-face.png');
  let canvas = document.getElementById('c-source');
  canvas.toBlob((blob) => {
    let url = URL.createObjectURL(blob);
    downloadLink.setAttribute('href', url);
    downloadLink.click();
  });
}

/*
* Sizing the canvas
*/
const sizeCanvas = () => {
  console.log('sizing');
  const canvasOne = document.getElementById('c-source');
  const canvasTwo = document.getElementById('c-target');

  const draw = document.querySelector('.draw .content');
  console.log(draw);

  const targetWidth = draw.offsetWidth;
  const targetHeight = draw.offsetHeight;
  console.log(targetWidth, targetHeight);

  canvasOne.height = targetHeight;
  canvasOne.width = targetWidth;

  canvasTwo.height = targetHeight * 0.3691;
  canvasTwo.width = targetWidth * 0.3691;
}

/*
* Init
*/
let isDrawing;
let loadedImage;
const points = [ ];
let resizedTimeout;

const init = () => {
  const canvas = document.getElementById('c-source');
  const ctx = canvas.getContext('2d');
  ctx.lineJoin = ctx.lineCap = 'round';

  // add listeners
  canvas.addEventListener('mousedown', (e) => { down(e, canvas); }, false);
  canvas.addEventListener('mousemove', (e) => { move(e, canvas, ctx); }, false);
  canvas.addEventListener('mouseup', () => { done(canvas); }, false);
  canvas.addEventListener('mouseout', () => { done(canvas); }, false);

  // touch
  canvas.addEventListener('touchstart', (e) => { down(e, canvas); }, false);
  canvas.addEventListener('touchmove', (e) => { move(e, canvas, ctx); }, false);
  canvas.addEventListener('touchend', () => { done(canvas); }, false);
  canvas.addEventListener('touchout', () => { done(canvas); }, false);

  const clearControl = document.querySelector('.js--control--clear');
  clearControl.addEventListener('click', () => { clear(canvas, ctx); }, false);

  const colourControl = document.querySelector('.js--control--colour');
  colourControl.addEventListener('click', () => { colourCycle(); }, false);

  // no scrolling whilst drawing
  document.addEventListener('touchmove', (e) => { if (isDrawing){ e.preventDefault(); } }, { passive:false });

  // resize needs work - everything would need scaling...
  // window.addEventListener('resize', (event) => {
  //   // If there's a timer, cancel it
  //   if (resizedTimeout) {
  //     window.cancelAnimationFrame(resizedTimeout);
  //   }

  //   // Setup the new requestAnimationFrame()
  //   resizedTimeout = window.requestAnimationFrame(() => {
  //     sizeCanvas();
  //   });

  // }, false);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyS') {
      downloadCanvasAsImage();
    }
  });

  // upload
  const uploadControl = document.querySelector('.js--control--upload');
  uploadControl.addEventListener('change', (e) => { uploadImage(e); }, false);

  // download
  // const downloadControl = document.querySelector('.js--control--download');
  // downloadControl.addEventListener('click', () => { downloadCanvasAsImage(); }, false);
}

sizeCanvas();
init();
