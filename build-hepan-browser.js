// build-hepan-browser.js - Generate browser-compatible hepan engine
const fs = require('fs');
const path = require('path');

const root = __dirname;
const skillRoot = 'C:\\Users\\LENOVO\\Desktop\\项目\\紫薇skills\\合盘\\hepan-cli\\src';

// Read source files
const branchRelation = fs.readFileSync(path.join(root, 'hepan-branchRelation.js'), 'utf8');
const chartUtils = fs.readFileSync(path.join(root, 'hepan-chartUtils.js'), 'utf8');
const computeCompat = fs.readFileSync(path.join(root, 'hepan-computeCompat.js'), 'utf8');

// Read embedded data
const v1 = fs.readFileSync(path.join(skillRoot, 'rules', 'compat', 'v1.json'), 'utf8');
const sg = fs.readFileSync(path.join(skillRoot, 'tables', 'star_groupings.json'), 'utf8');
const sp = fs.readFileSync(path.join(skillRoot, 'tables', 'star_pair_scores.json'), 'utf8');

// Strip "use strict"
let br = branchRelation.replace(/"use strict";\s*/g, '');
let cu = chartUtils.replace(/"use strict";\s*/g, '');
let cc = computeCompat.replace(/"use strict";\s*/g, '');

// Remove CJS exports from sub-modules
br = br.replace(/module\.exports\s*=\s*\{[\s\S]*?\};/, '');
cu = cu.replace(/module\.exports\s*=\s*\{[\s\S]*?\};/, '');

// Remove Node.js deps from computeCompat
cc = cc.replace(/const fs = require\("fs"\);\s*/g, '');
cc = cc.replace(/const path = require\("path"\);\s*/g, '');
cc = cc.replace(/const \{ branchRelation \} = require\("\.\.\/branchRelation"\);\s*/g, '');
cc = cc.replace(/const \{ palaceByName, getMajorStarNames, getPalaceStarNamesFallback, validateChart \} = require\("\.\.\/chartUtils"\);\s*/g, '');
cc = cc.replace(/const RULES_ROOT = path\.join\(__dirname, "\.\.", "rules"\);\s*/g, '');
cc = cc.replace(/const TABLES_DIR = path\.join\(__dirname, "\.\.", "tables"\);\s*/g, '');

// Remove old loadJson and loadRulePack
cc = cc.replace(/function loadJson\(rel\) \{[\s\S]*?\n\}/g, '');
cc = cc.replace(/function loadRulePack\(ruleVersion\) \{[\s\S]*?\n\}/g, '');

// Replace CJS export with ES export
cc = cc.replace(/module\.exports\s*=\s*\{/, 'export {');

const embedded = `
// === EMBEDDED DATA (browser-compatible) ===
const EMBEDDED_RULE_PACK = ${v1};
const EMBEDDED_GROUPINGS = ${sg};
const EMBEDDED_PAIR_SCORES = ${sp};
const EMBEDDED_RULES = { 'compat/v1': EMBEDDED_RULE_PACK };
function loadRulePack(ruleVersion) {
  const pack = EMBEDDED_RULES[ruleVersion];
  if (!pack) throw new Error('unknown rule_version: ' + ruleVersion);
  return pack;
}
function loadJson(rel) {
  if (rel === 'star_groupings.json') return EMBEDDED_GROUPINGS;
  if (rel === 'star_pair_scores.json') return EMBEDDED_PAIR_SCORES;
  throw new Error('unknown table: ' + rel);
}

`;

const combined = embedded + br + '\n' + cu + '\n' + cc;

fs.writeFileSync(path.join(root, 'hepan-browser.mjs'), combined, 'utf8');
console.log('Built hepan-browser.mjs:', combined.length, 'chars');
