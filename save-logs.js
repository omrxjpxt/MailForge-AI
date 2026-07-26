const fs = require('fs');
fetch('http://localhost:3000/api/diagnose')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('raw_trace.txt', data.logs.join('\n'));
    console.log("Saved.");
  });
