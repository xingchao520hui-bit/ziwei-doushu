const fs = require('fs');
const path = require('path');

// 直接require hepan-cli的computeCompat函数
const { computeCompat } = require('C:\\Users\\LENOVO\\Desktop\\紫薇skills\\合盘\\hepan-cli\\src\\engine\\computeCompat');

// 读取示例数据
const payload = JSON.parse(fs.readFileSync('C:\\Users\\LENOVO\\Desktop\\紫薇skills\\合盘\\examples\\sample-compat-payload.json', 'utf8'));

console.log('示例数据加载成功，开始计算合盘...');
console.log('人员A:', payload.chart_a.birth_info.solar_date, payload.chart_a.birth_info.gender);
console.log('人员B:', payload.chart_b.birth_info.solar_date, payload.chart_b.birth_info.gender);

try {
  const result = computeCompat(payload.chart_a, payload.chart_b, {
    rule_version: payload.rule_version || 'compat/v1',
    meta_a: payload.meta_a,
    meta_b: payload.meta_b,
    reference_year: payload.reference_year
  });
  
  console.log('\n✅ 合盘计算成功！');
  console.log('总分:', result.score);
  console.log('置信度:', result.confidence);
  console.log('\n各维度得分:');
  result.dimensions.forEach(d => {
    console.log(`  ${d.id}: ${d.score}/${d.max}`);
  });
  console.log('\n命中规则数:', result.hits.length);
  
} catch (e) {
  console.error('❌ 计算失败:', e.message);
}
