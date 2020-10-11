/////////////////////////////////////////////
// Express/server part;
/////////////////////////////////////////////

// Generic GET handler;
function GET(url, handler) {
  app.get(url, async (req, res) => {
      try {
          const data = await handler(req);
          res.json({
              success: true,
              data
          });
      } catch (error) {
          res.json({
              success: false,
              error: error.message || error
          });
      }
  });
}

// Generic POST handler;
function POST(url, handler) {
  app.post(url, async (req, res) => {
      try {
          const data = await handler(req);
          res.json({
              success: true,
              data
          });
      } catch (error) {
          res.json({
              success: false,
              error: error.message || error
          });
      }
  });
}

// Generic DELETE handler;
function DELETE(url, handler) {
  app.delete(url, async (req, res) => {
      try {
          const data = await handler(req);
          res.json({
              success: true,
              data
          });
      } catch (error) {
          res.json({
              success: false,
              error: error.message || error
          });
      }
  });
}

export { GET, POST, DELETE }