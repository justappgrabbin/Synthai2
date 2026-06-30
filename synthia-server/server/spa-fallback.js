const fs = require('fs');
const path = require('path');

function attachSpaFallback(app, frontendDist) {
  const frontendIndex = path.join(frontendDist, 'index.html');

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/mrnn/') || req.path.startsWith('/socket.io/')) {
      return next();
    }

    if (!fs.existsSync(frontendIndex)) {
      return next();
    }

    return res.sendFile(frontendIndex);
  });
}

module.exports = attachSpaFallback;
