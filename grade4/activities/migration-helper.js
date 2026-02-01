/**
 * Grade 4 Migration Helper
 *
 * This file loads the shared migration helper from the central JS folder.
 * Kept for backward compatibility.
 *
 * Note: For new usage, prefer loading directly from ../../js/migration-helper.js
 */

// Load from shared location
const script = document.createElement('script');
script.src = '../../js/migration-helper.js';
document.head.appendChild(script);

console.log('Grade 4 Migration Helper - loading shared module...');
