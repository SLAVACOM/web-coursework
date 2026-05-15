const timestamp = () => new Date().toISOString();

const log = {
  info: (message, data = '') => {
    console.log(`[${timestamp()}] ℹ️  ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  success: (message, data = '') => {
    console.log(`[${timestamp()}] ✓ ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  warn: (message, data = '') => {
    console.warn(`[${timestamp()}] ⚠️  ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  error: (message, data = '') => {
    console.error(`[${timestamp()}] ✗ ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  db: (message, data = '') => {
    console.log(`[${timestamp()}] 🗄️  ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  http: (method, path, status, user = null) => {
    const userStr = user ? ` (${user})` : '';

    const ignoredPaths = [' /js/main.js', ' /favicon.ico', "/js/main.js", "/css/style.css"];

    if (ignoredPaths.includes(path)) return; // Игнорируем шум от загрузки JS
    console.log(`[${timestamp()}] 🌐 ${method} ${path} → ${status}${userStr}`);
  },

  auth: (message, data = '') => {
    console.log(`[${timestamp()}] 🔐 ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  booking: (message, data = '') => {
    console.log(`[${timestamp()}] 📋 ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },

  tool: (message, data = '') => {
    console.log(`[${timestamp()}] 🔧 ${message}${data ? ' ' + JSON.stringify(data) : ''}`);
  },
};

module.exports = log;
