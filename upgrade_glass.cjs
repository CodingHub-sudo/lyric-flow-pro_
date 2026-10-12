const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Modals generic replace
  content = content.replace(/bg-slate-900 border border-slate-800 rounded-2xl/g, 'bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl');
  content = content.replace(/bg-slate-900 border border-slate-800 rounded-xl/g, 'bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-xl');
  
  // Navbar specific
  content = content.replace(/bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30/g, 'bg-slate-950/70 backdrop-blur-xl text-slate-100 border-b border-white/5 sticky top-0 z-30');
  
  // Sidebars
  content = content.replace(/bg-slate-950 border-r border-slate-800/g, 'bg-slate-950 border-r border-white/5');
  
  // Chrome accents for buttons (e.g. border-sky-500/30 -> border-white/20, text-sky-400 -> text-slate-200, but user said "vibrant metallic highlights" which implies we keep sky-400 for primary actions, but maybe some secondary buttons can be chrome).
  // Actually, replacing bg-slate-950/90 headers in modals to bg-white/5
  content = content.replace(/bg-slate-950\/90/g, 'bg-white/5');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
console.log('Glass upgraded.');
