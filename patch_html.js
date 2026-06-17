const fs=require('fs');
const html=fs.readFileSync('C:/Users/LENOVO/Desktop/项目/ziwei-doushu-main/ziwei-doushu-main/ziwei-app.html','utf8');
const newCode=fs.readFileSync('C:/Users/LENOVO/Desktop/项目/ziwei-doushu-main/ziwei-doushu-main/_tmp_analysis.js','utf8');

// Find the boundary markers
const startMarker='\nfunction renderMingGongAnalysis(p){';
const endMarker='// auto-load on page open';

const startIdx=html.indexOf(startMarker);
const endIdx=html.indexOf(endMarker);

if(startIdx===-1||endIdx===-1){
  console.log('ERROR: markers not found',{startIdx,endIdx});
  process.exit(1);
}

const before=html.substring(0,startIdx);
const after=html.substring(endIdx);
const result=before+'\n'+newCode+'\n'+after;

fs.writeFileSync('C:/Users/LENOVO/Desktop/项目/ziwei-doushu-main/ziwei-doushu-main/ziwei-app.html',result);
console.log('OK - replaced',startIdx,'to',endIdx,'inserted',newCode.length,'bytes, total',result.length);
