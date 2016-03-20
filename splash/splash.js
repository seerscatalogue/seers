/* eslint no-var:0 vars-on-top:0 */
/* eslint-env node:false es6:false */
/* global createjs vanillaModal UAParser */

var canvas, queue, stage, loaderBar, bgRect, fullLoaderBar, fullLoaderText, beginButton, fullQueue;
var bgs, bg1, bg2, fg;
var ambientSound, music, flickerSound;
var bgSwapTimeout, flickerLoopTimeout;

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
  'splash/seers_loading_text.png',
  'splash/credits.png',
  'splash/begin.png'
];

function initLoader() {
  var container = document.querySelector('#splashcontainer');

  canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;

  var wordmark = document.createElement('img');
  wordmark.src = 'images/commissioned_wordmark.png';

  document.querySelector('.parent').style.minHeight = '604px';

  container.appendChild(canvas);
  container.appendChild(wordmark);

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

  fullQueue = new createjs.LoadQueue();
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
      .get(fullLoaderText)
      .to({alpha:0, visible:false}, 1000);
    createjs.Tween
      .get(fullLoaderBar)
      .to({alpha:0, visible:false}, 1000)
      .call(function() {
        stage.removeChild(fullLoaderBar);
        stage.removeChild(fullLoaderText);

        createjs.Tween
          .get(beginButton)
          .to({alpha:1}, 2000);
      });
  });
  fullQueue.loadManifest(man);
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
  title.y = canvas.height / 2 - 60;
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
    // location.replace('story.html');
    var storyXml = fullQueue.getResult('story.html', true);

    stage.removeAllChildren();
    stage.removeAllEventListeners();
    createjs.Ticker.removeAllEventListeners();
    createjs.Sound.removeAllSounds();

    canvas = queue = stage = loaderBar = bgRect = fullLoaderBar = fullLoaderText = beginButton = fullQueue = null;
    bgs = bg1 = bg2 = fg = null;
    ambientSound = music = flickerSound = null;
    clearTimeout(bgSwapTimeout);
    clearTimeout(flickerLoopTimeout);

    var doc = document.open("text/html");
    doc.write(storyXml);
    doc.close();
  });

  fullLoaderBar = new createjs.Shape();
  fullLoaderBar.graphics.setStrokeStyle(1);
  fullLoaderBar.graphics.beginStroke("#000");
  fullLoaderBar.graphics.drawRect(0, 0, barWidth, 20);
  fullLoaderBar.regX = barWidth / 2;
  fullLoaderBar.regY = 10;
  fullLoaderBar.x = canvas.width / 2;
  fullLoaderBar.y = canvas.height * 0.9;

  fullLoaderText = new createjs.Bitmap(queue.getResult('splash/seers_loading_text.png'));
  fullLoaderText.regX = fullLoaderText.image.width / 2;
  fullLoaderText.regY = fullLoaderText.image.height;
  fullLoaderText.x = canvas.width / 2;
  fullLoaderText.y = canvas.height * 0.9 - 10;

  var loaderContainer = new createjs.Container();
  loaderContainer.alpha = 0;
  loaderContainer.addChild(fullLoaderBar);
  loaderContainer.addChild(fullLoaderText);
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
      ambientSound = createjs.Sound.play('splash/flyover-edit.ogg', { volume: 0, loop: -1 });
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
      music = createjs.Sound.play('audio/Seers-Theme-Nick-new.ogg', { volume: 0, delay: 15000 });
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
  flickerSound = createjs.Sound.play('splash/flicker.ogg', { volume: 0 });

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

  bgSwapTimeout = setTimeout(function() { bgs.swapChildren(bg1, bg2); }, 14300);
  flickerLoopTimeout = setTimeout(doFlicker, flickerSound.duration + 8000);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(v) {
  if(v < 0) { return 0; }
  if(v > 1) { return 1; }
  return v;
}

function testSupportedDeviceType(deviceType) {
  var blacklistedDeviceTypes = ['console', 'mobile', 'tablet', 'smarttv', 'wearable', 'embedded'];

  var blacklisted = false;
  blacklistedDeviceTypes.forEach(function(dt) {
    if(deviceType.substr(0, dt.length) === dt) {
      blacklisted = true;
    }
  });
  return !blacklisted;
}

function testSupportedBrowser(browserName) {
  var chromelikes = ['Chrome', 'Chromium', 'Opera', 'Vivaldi'];
  var fflikes = ['Firefox', 'IceCat', 'Iceweasel'];

  var supported = false;

  chromelikes.concat(fflikes).forEach(function(b) {
    if(browserName.substr(0, b.length) === b) {
      supported = true;
    }
  });
  return supported;
}

var infobox;
function clearWarning() { //eslint-disable-line
  infobox.remove();
  initLoader();
}

var result = UAParser();

var isSupportedDeviceType = testSupportedDeviceType(result.device.type || '');
var isSupportedBrowser = !(result.os.name === 'iOS') && testSupportedBrowser(result.browser.name || '');

if(isSupportedBrowser && isSupportedDeviceType) {
  document.addEventListener("DOMContentLoaded", initLoader);
}
else {
  document.addEventListener("DOMContentLoaded", function() {
    var container = document.querySelector('#splashcontainer');
    infobox = document.createElement('div');
    infobox.style.maxWidth = '400px';

    var info;
    if(!isSupportedBrowser) {
      var lines = [
        "<div style='text-align: center;'><img src='images/pats_illustrations/seers_key.png' style='width: 200px;'/></div>",
        "<p>Unfortunately, <i>The Seers Catalogue</i> won't work in your browser.</p>",
        "<p>The software can't understand all its mysteries.</p>"
      ];

      if(!isSupportedDeviceType) {
        lines = lines.concat([
          "<p>The Editors invite you to roll up to a computer, put on your headphones, and",
          "return again to seerscatalogue.com.</p>"
        ]);
      }
      lines = lines.concat([
        "<p>Try <a href='https://www.google.com/chrome/browser/index.html'>Chrome</a> or",
        "<a href='https://www.mozilla.org/firefox/'>Firefox</a> on desktop. (It's worth",
        "the journey.)</p>"
      ]);

      info = lines.join(' ');
    }
    else if(!isSupportedDeviceType) {
      info = [
        "<div style='text-align: center;'><img src='images/full_seers_circle_logo_cropped.png' style='width: 200px;'/></div>",
        "<p>From where we're standing, it looks like your device might not be the best",
        "way to experience The Seers Catalogue.</p>",
        "<p>The Editors invite you to roll up to a computer, put on your headphones, and",
        "return again to seerscatalogue.com.</p>",
        "<p>(Secrets await.)</p>",
        "<p><br /><small>If you're sure you'd like to proceed anyway, <a href='#' onclick='clearWarning()'>click here</a>.</small></p>"
      ].join(' ');
    }

    infobox.innerHTML = info;
    container.appendChild(infobox);
  });
}
