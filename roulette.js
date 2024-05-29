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
  // Define colors for orange and purple
  var orange = "rgb(255, 100, 66)"; // You can replace this with any other shade of orange
  var purple = "rgb(154, 94, 216)"; // You can replace this with any other shade of purple

  // Assign orange to even-indexed options and purple to odd-indexed options
  return item % 2 === 0 ? orange : purple;
}

function drawRouletteWheel() {
  var canvas = document.getElementById("canvas");
  if (canvas.getContext) {
    var outsideRadius = 140; // updated from 200
    var textRadius = 110; // updated from 160
    var insideRadius = 85; // updated from 125

    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 380, 380); // updated from 500, 500

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.font = 'bold 8px Helvetica, Arial';

    for (var i = 0; i < options.length; i++) {
      var angle = startAngle + i * arc;
      ctx.fillStyle = getColor(i);

      ctx.beginPath();
      ctx.arc(190, 190, outsideRadius, angle, angle + arc, false); // updated from 250, 250
      ctx.arc(190, 190, insideRadius, angle + arc, angle, true); // updated from 250, 250
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.shadowOffsetX = -1;
      ctx.shadowOffsetY = -1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.translate(190 + Math.cos(angle + arc / 2) * textRadius,
        190 + Math.sin(angle + arc / 2) * textRadius); // updated from 250, 250
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      var text = options[i];
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      ctx.restore();
    }

    // Arrow
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(190 - 4, 190 - (outsideRadius + 5)); // updated from 250
    ctx.lineTo(190 + 4, 190 - (outsideRadius + 5)); // updated from 250
    ctx.lineTo(190 + 4, 190 - (outsideRadius - 5)); // updated from 250
    ctx.lineTo(190 + 9, 190 - (outsideRadius - 5)); // updated from 250
    ctx.lineTo(190 + 0, 190 - (outsideRadius - 13)); // updated from 250
    ctx.lineTo(190 - 9, 190 - (outsideRadius - 5)); // updated from 250
    ctx.lineTo(190 - 4, 190 - (outsideRadius - 5)); // updated from 250
    ctx.lineTo(190 - 4, 190 - (outsideRadius + 5)); // updated from 250
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
  var text = options[index];
  ctx.fillText(text, 190 - ctx.measureText(text).width / 2, 190 + 10); // updated from 250
  ctx.restore();
}

function easeOut(t, b, c, d) {
  var ts = (t /= d) * t;
  var tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

drawRouletteWheel();