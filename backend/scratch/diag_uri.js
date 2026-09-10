require('dotenv').config();
const uri = process.env.MONGODB_URI || '';

console.log('--- MongoDB URI Diagnostic ---');
console.log('1. MONGODB_URI loaded from env:', !!uri);
console.log('2. URI length:', uri.length, 'chars');
console.log('3. Has literal < bracket:', uri.includes('<'));
console.log('4. Has literal > bracket:', uri.includes('>'));
console.log('5. Has leading/trailing whitespace:', uri !== uri.trim());
console.log('6. Has surrounding quotes:', uri.startsWith('"') || uri.startsWith("'"));
console.log('7. Starts with mongodb+srv:', uri.startsWith('mongodb+srv://'));
console.log('8. Has @ separator:', uri.includes('@'));

const atParts = uri.split('@');
console.log('9. Cluster host:', atParts.length > 1 ? atParts[1].split('/')[0] : 'MISSING');
console.log('10. Has database name in path:', atParts.length > 1 && atParts[1].includes('/') && atParts[1].split('/')[1] !== '');
console.log('11. Has retryWrites param:', uri.includes('retryWrites'));

// Parse username safely via URL API
try {
  const parsed = new URL(uri);
  const uname = parsed.username;
  console.log('12. URL-parsed username length:', uname.length);
  console.log('13. Username contains %3C (encoded <):', uname.includes('%3C'));
  console.log('14. Username contains %3E (encoded >):', uname.includes('%3E'));
  console.log('15. Database path:', parsed.pathname);
  console.log('16. Search params:', parsed.search || '(none)');
} catch(e) {
  console.log('12-16. URL parse error:', e.message);
}
