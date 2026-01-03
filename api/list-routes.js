const fs = require("fs");
const path = require("path");

function findRoutes(dir) {
  const routes = [];
  
  function search(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        search(fullPath);
      } else if (stat.isFile() && item.includes('routes')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Extract route definitions
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('router.')) {
            routes.push({
              file: fullPath,
              line: index + 1,
              code: line.trim()
            });
          }
        });
      }
    }
  }
  
  search(dir);
  return routes;
}

console.log("Current API Routes:");
console.log("==================\n");

const apiDir = path.join(__dirname);
const routes = findRoutes(apiDir);

routes.forEach(route => {
  const fileName = path.relative(apiDir, route.file);
  console.log(`${fileName}:${route.line}`);
  console.log(`  ${route.code}`);
  console.log();
});
