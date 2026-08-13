const fs = require('fs');
const buf = fs.readFileSync('public/assets/easl/bg.jpg');
if (buf[0] === 0xFF && buf[1] === 0xD8) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] === 0xFF) {
      const m = buf[i + 1];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        console.log(w + 'x' + h);
        break;
      }
      i += 2 + buf.readUInt16BE(i + 2);
    } else {
      i++;
    }
  }
}
