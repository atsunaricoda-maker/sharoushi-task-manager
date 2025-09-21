// Test report generation locally
const year = 2025;
const month = 9;

console.log('Testing date calculation...');

const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
const lastDay = new Date(Number(year), Number(month), 0).getDate();
const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

console.log('Start Date:', startDate);
console.log('Last Day:', lastDay);
console.log('End Date:', endDate);

// Check what new Date(2025, 9, 0) returns
const testDate = new Date(2025, 9, 0);
console.log('Test Date (2025, 9, 0):', testDate);
console.log('Test Date ISO:', testDate.toISOString());
console.log('Test Date getDate():', testDate.getDate());