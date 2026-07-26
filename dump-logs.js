const fs = require('fs');
fetch('http://localhost:3000/api/diagnose')
  .then(res => res.json())
  .then(data => {
    data.logs.forEach(l => {
      if (l.includes('1. Campaign ID') || l.includes('12. Exact') || l.includes('========================') || l.includes('Google') || l.includes('MessageId')) {
         console.log(l);
      } else {
         console.log(l);
      }
    });
  });
