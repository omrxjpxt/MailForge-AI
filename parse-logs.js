const fs = require('fs');
fetch('http://localhost:3000/api/diagnose')
  .then(res => res.json())
  .then(data => {
    const raw = data.logs.join('\n');
    console.log(raw.substring(raw.indexOf('========================')));
  });
