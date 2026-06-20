"use strict";

// 三合: 申子辰, 亥卯未, 寅午戌, 巳酉丑
const SANHE_GROUPS = [
  ["申", "子", "辰"],
  ["亥", "卯", "未"],
  ["寅", "午", "戌"],
  ["巳", "酉", "丑"],
];

// 六合: 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未
const LIUHE_PAIRS = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];

// 冲: 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥
const CHONG_PAIRS = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

// 刑 (无礼之刑: 子卯; 恃势之刑: 寅巳申; 无恩之刑: 丑戌未; 自刑: 辰午酉亥)
const XING_PAIRS = [
  ["子", "卯"],
  ["卯", "子"],
  ["寅", "巳"],
  ["巳", "申"],
  ["申", "寅"],
  ["丑", "戌"],
  ["戌", "未"],
  ["未", "丑"],
];
const ZI_XING = ["辰", "午", "酉", "亥"]; // 自刑

// 害 (六害): 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌
const HAI_PAIRS = [
  ["子", "未"],
  ["未", "子"],
  ["丑", "午"],
  ["午", "丑"],
  ["寅", "巳"],
  ["巳", "寅"],
  ["卯", "辰"],
  ["辰", "卯"],
  ["申", "亥"],
  ["亥", "申"],
  ["酉", "戌"],
  ["戌", "酉"],
];

// 地支五行 (用于相克判断)
const BRANCH_WUXING = {
  "子": "水", "丑": "土", "寅": "木", "卯": "木",
  "辰": "土", "巳": "火", "午": "火", "未": "土",
  "申": "金", "酉": "金", "戌": "土", "亥": "水"
};

// 五行相克: 木克土, 土克水, 水克火, 火克金, 金克木
const WUXING_KE = {
  "木": "土", "土": "水", "水": "火", "火": "金", "金": "木"
};

function branchRelation(a, b) {
  if (!a || !b) return "neutral";
  if (a === b) return "same";
  
  // 冲
  for (const [x, y] of CHONG_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) return "chong";
  }
  
  // 六合
  for (const [x, y] of LIUHE_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) return "liuhe";
  }
  
  // 三合
  for (const g of SANHE_GROUPS) {
    if (g.includes(a) && g.includes(b) && a !== b) return "sanhe";
  }
  
  // 刑
  for (const [x, y] of XING_PAIRS) {
    if (a === x && b === y) return "xing";
  }
  if (ZI_XING.includes(a) && a === b) return "xing"; // 自刑 (same branch)
  
  // 害
  for (const [x, y] of HAI_PAIRS) {
    if (a === x && b === y) return "hai";
  }
  
  // 相克 (基于五行)
  const wx_a = BRANCH_WUXING[a];
  const wx_b = BRANCH_WUXING[b];
  if (wx_a && wx_b && WUXING_KE[wx_a] === wx_b) return "ke";
  
  return "neutral";
}

// 关系中文名
function relationName(rel) {
  const map = {
    "same": "同支",
    "chong": "冲",
    "liuhe": "六合",
    "sanhe": "三合",
    "xing": "刑",
    "hai": "害",
    "ke": "克",
    "neutral": "平"
  };
  return map[rel] || "平";
}

module.exports = { branchRelation, relationName };
