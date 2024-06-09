var options = ["Vandal", "Phantom", "Operator", "Marshal", "Sheriff", "Ghost", "Bucky", "Judge", "Ares", "Odin", "Guardian", "Bulldog", "Spectre", "Classic", "Stinger", "Frenzy", "Shorty", "Knife"];

var startAngle = 0;
var arc = Math.PI / (options.length / 2);
var spinTimeout = null;

var spinArcStart = 10;
var spinTime = 0;
var spinTimeTotal = 0;

var ctx;

document.getElementById("spin").addEventListener("click", spin);

function byte2Hex(n) {
  var nybHexString = "0123456789ABCDEF";
  return String(nybHexString.substr((n >> 4) & 0x0F, 1)) + nybHexString.substr(n & 0x0F, 1);
}

function RGB2Color(r, g, b) {
  return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function getColor(item) {
  var orange = "rgb(255, 100, 66)";
  var purple = "rgb(178, 69, 46)";
  
  return item % 2 === 0 ? orange : purple;
}

function drawRouletteWheel() {
  var canvas = document.getElementById("canvas");
  if (canvas.getContext) {
    var outsideRadius = canvas.width / 2 * 0.9;
    var textRadius = canvas.width / 2 * 0.75;
    var insideRadius = canvas.width / 2 * 0.55;

    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.font = `${Math.max(canvas.width / 40, 8)}px Helvetica, Arial`;

    for (var i = 0; i < options.length; i++) {
      var angle = startAngle + i * arc;
      ctx.fillStyle = getColor(i);

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, outsideRadius, angle, angle + arc, false);
      ctx.arc(canvas.width / 2, canvas.height / 2, insideRadius, angle + arc, angle, true);
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.shadowOffsetX = -1;
      ctx.shadowOffsetY = -1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.translate(canvas.width / 2 + Math.cos(angle + arc / 2) * textRadius,
        canvas.height / 2 + Math.sin(angle + arc / 2) * textRadius);
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      var text = options[i];
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      ctx.restore();
    }

    // Arrow
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 4, canvas.height / 2 - (outsideRadius + 5));
    ctx.lineTo(canvas.width / 2 + 4, canvas.height / 2 - (outsideRadius + 5));
    ctx.lineTo(canvas.width / 2 + 4, canvas.height / 2 - (outsideRadius - 5));
    ctx.lineTo(canvas.width / 2 + 9, canvas.height / 2 - (outsideRadius - 5));
    ctx.lineTo(canvas.width / 2, canvas.height / 2 - (outsideRadius - 13));
    ctx.lineTo(canvas.width / 2 - 9, canvas.height / 2 - (outsideRadius - 5));
    ctx.lineTo(canvas.width / 2 - 4, canvas.height / 2 - (outsideRadius - 5));
    ctx.lineTo(canvas.width / 2 - 4, canvas.height / 2 - (outsideRadius + 5));
    ctx.fill();
  }
}

function spin() {
  spinAngleStart = Math.random() * 10 + 10;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3 + 4 * 1000;
  rotateWheel();
}

function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }
  var spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawRouletteWheel();
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  var degrees = startAngle * 180 / Math.PI + 90;
  var arcd = arc * 180 / Math.PI;
  var index = Math.floor((360 - degrees % 360) / arcd);
  ctx.save();
  ctx.font = 'bold 30px Helvetica, Arial';
  ctx.fillStyle = 'rgb(255, 100, 66)';
  var text = options[index];
  ctx.fillText(text, canvas.width / 2 - ctx.measureText(text).width / 2, canvas.height / 2 + 10);
  ctx.restore();
}

function easeOut(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

drawRouletteWheel();
