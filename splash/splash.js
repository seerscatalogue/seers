/* eslint no-var:0 vars-on-top:0 */
/* eslint-env node:false es6:false */
/* global createjs vanillaModal */
var canvas, queue, stage, loaderBar, bgRect, fullLoaderBar, beginButton;
var bgs, bg1, bg2, fg;

var interactionEnabled = false;

var parallaxFactor = 0.7;

var barWidth = 500;
var barHeight = 40;

var toLoad = [
  'audio/Seers-Theme-Nick-new.ogg',
  'splash/flyover-edit.ogg',
  'splash/flicker.ogg',
  'splash/bg1.png',
  'splash/bg2.png',
  'splash/fg.png',
  'splash/title.png',
  'splash/credits.png',
  'splash/begin.png'
];

function init() {
  canvas = document.querySelector('#splash');

  stage = new createjs.Stage(canvas);
  stage.enableMouseOver(10);
  stage.mouseMoveOutside = true;
  createjs.Touch.enable(stage);
  stage.on('stagemousemove', handleMouseMove);

  bgRect = new createjs.Shape();
  bgRect.graphics.beginFill("#000");
  bgRect.graphics.drawRect(0, 0, canvas.width, canvas.height);
  stage.addChild(bgRect);

  loaderBar = new createjs.Shape();
  loaderBar.graphics.setStrokeStyle(1);
  loaderBar.graphics.beginStroke("#000");
  loaderBar.graphics.drawRect(0, 0, barWidth, barHeight);
  loaderBar.regX = barWidth / 2;
  loaderBar.regY = barHeight / 2;
  loaderBar.x = canvas.width / 2;
  loaderBar.y = canvas.height / 2;
  stage.addChild(loaderBar);

  createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
  createjs.Ticker.setFPS(60);
  createjs.Ticker.on("tick", tick);

  queue = new createjs.LoadQueue();
  queue.installPlugin(createjs.Sound);
  queue.on('complete', startSplash, this);
  queue.on('progress', updateBar, this);
  queue.loadManifest(toLoad);
}

function updateBar(e) {
  var g = loaderBar.graphics;

  g.clear();

  g
    .beginFill('#ff7373')
    .drawRect(0, 0, barWidth * e.loaded, 40)
    .endFill();

  g.
    setStrokeStyle(1)
    .beginStroke("#000")
    .drawRect(0, 0, barWidth, 40)
    .endStroke();
}

function handleMouseMove(e) {
  if(!interactionEnabled) {
    return;
  }
  var w = canvas.width;
  var h = canvas.height;

  bgs.x = w / 2 + (parallaxFactor * lerp(-50, 50, clamp01(e.rawX / w)));
  bgs.y = h / 2 + (parallaxFactor * lerp(-50, 50, clamp01(e.rawY / h)));

  fg.x = w / 2 + (lerp(-50, 50, clamp01(e.rawX / w)));
  fg.y = h / 2 + (lerp(-50, 50, clamp01(e.rawY / h)));
}

function beginFullLoad() {
  var man = window.manifest;

  var totalSize = 0;
  for(var k in man) {
    if(man.hasOwnProperty(k)) {
      totalSize += man[k];
    }
  }

  var fullQueue = new createjs.LoadQueue();
  fullQueue.on('progress', function(e) {
    var g = fullLoaderBar.graphics;

    g.clear();

    g
      .beginFill('#ff7373')
      .drawRect(0, 0, barWidth * e.loaded, 20)
      .endFill();

    g.
      setStrokeStyle(1)
      .beginStroke("#000")
      .drawRect(0, 0, barWidth, 20)
      .endStroke();
  });

  fullQueue.on('complete', function() {
    createjs.Tween
      .get(fullLoaderBar)
      .to({alpha:0, visible:false}, 1000)
      .call(function() {
        stage.removeChild(fullLoaderBar);

        createjs.Tween
          .get(beginButton)
          .to({alpha:1}, 2000);
      });
  });
  fullQueue.loadManifest(Object.keys(man));
}

function startSplash() {
  bg1 = new createjs.Bitmap(queue.getResult('splash/bg1.png'));
  bg1.regX = bg1.image.width / 2;
  bg1.regY = bg1.image.height / 2;

  bg2 = new createjs.Bitmap(queue.getResult('splash/bg2.png'));
  bg2.regX = bg2.image.width / 2;
  bg2.regY = bg2.image.height / 2;

  bgs = new createjs.Container();
  bgs.x = canvas.width / 2;
  bgs.y = canvas.height / 2;
  bgs.addChild(bg2);
  bgs.addChild(bg1);

  fg = new createjs.Bitmap(queue.getResult('splash/fg.png'));
  fg.regX = fg.image.width / 2;
  fg.regY = fg.image.height / 2;
  fg.x = canvas.width / 2;
  fg.y = canvas.height / 2;

  var title = new createjs.Bitmap(queue.getResult('splash/title.png'));
  title.regX = title.image.width / 2;
  title.regY = title.image.height / 2;
  title.x = canvas.width / 2;
  title.y = canvas.height / 2;
  title.alpha = 0;
  title.scaleX = 0.8;
  title.scaleY = 0.8;


  var modal = new vanillaModal.VanillaModal();
  window.modal = modal;

  var creditsButton = new createjs.Bitmap(queue.getResult('splash/credits.png'));
  creditsButton.regX = creditsButton.image.width;
  creditsButton.regY = 0;
  creditsButton.x = canvas.width - 12;
  creditsButton.y = 12;
  creditsButton.alpha = 0;
  creditsButton.cursor = 'pointer';
  creditsButton.on("mousedown", function() {
    modal.open('#creditsModal');
  });

  beginButton = new createjs.Bitmap(queue.getResult('splash/begin.png'));
  beginButton.regX = beginButton.image.width / 2;
  beginButton.regY = beginButton.image.height / 2;
  beginButton.x = canvas.width / 2;
  beginButton.y = canvas.height * 0.9;
  beginButton.alpha = 0;
  beginButton.cursor = 'pointer';
  beginButton.on("mousedown", function() {
    location.replace('story.html');
  });

  fullLoaderBar = new createjs.Shape();
  fullLoaderBar.graphics.setStrokeStyle(1);
  fullLoaderBar.graphics.beginStroke("#000");
  fullLoaderBar.graphics.drawRect(0, 0, barWidth, 20);
  fullLoaderBar.regX = barWidth / 2;
  fullLoaderBar.regY = 10;
  fullLoaderBar.x = canvas.width / 2;
  fullLoaderBar.y = canvas.height * 0.9;


  var loaderContainer = new createjs.Container();
  loaderContainer.alpha = 0;
  loaderContainer.addChild(fullLoaderBar);
  loaderContainer.addChild(beginButton);
  stage.addChild(loaderContainer);

  beginFullLoad();

  stage.addChildAt(creditsButton, 0);
  stage.addChildAt(title, 0);
  stage.addChildAt(fg, 0);
  stage.addChildAt(bgs, 0);

  createjs.Tween
    .get(loaderBar)
    .to({alpha:0, visible:false}, 1000)
    .call(function() {
      stage.removeChild(loaderBar);

      interactionEnabled = true;
      var ambientSound = createjs.Sound.play('splash/flyover-edit.ogg', { volume: 0, loop: -1 });
      createjs.Tween
        .get(ambientSound)
        .to({volume:1}, 1500);

      //Fade the full-screen rect.
      createjs.Tween
        .get(bgRect)
        .to({alpha:0, visible:false}, 2000)
        .call(function() { doFlicker(); });

      //Fade in title.
      createjs.Tween
        .get(title)
        .wait(6000)
        .to({alpha:1}, 2000);

      //Fade in credits button and full loader bar..
      createjs.Tween
        .get(creditsButton)
        .wait(9000)
        .to({alpha:1}, 2000);
      createjs.Tween
        .get(loaderContainer)
        .wait(9000)
        .to({alpha:1}, 2000);

      //Fade in music.
      var music = createjs.Sound.play('audio/Seers-Theme-Nick-new.ogg', { volume: 0, delay: 15000 });
      createjs.Tween
        .get(music)
        .to({volume:0})
        .wait(17000)
        .to({volume:0.5}, 3000);
    });

}

function tick(event) {
  stage.update(event);
}

function doFlicker() {
  var flickerSound = createjs.Sound.play('splash/flicker.ogg', { volume: 0 });

  createjs.Tween
    .get(flickerSound)
    .to({volume:1}, 500);

  createjs.Tween
    .get(bgs)
    .wait(1600)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(100)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(300)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(100)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(50)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(100)
    .call(function() { bgs.swapChildren(bg1, bg2); })
    .wait(100)
    .call(function() { bgs.swapChildren(bg1, bg2); });

  setTimeout(function() { bgs.swapChildren(bg1, bg2); }, 14300);
  setTimeout(doFlicker, flickerSound.duration + 8000);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(v) {
  if(v < 0) { return 0; }
  if(v > 1) { return 1; }
  return v;
}

document.addEventListener("DOMContentLoaded", init);

