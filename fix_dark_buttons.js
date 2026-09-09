const fs = require('fs');

const path = './modules/emails/EmailsManagementClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { from: /\bbg-red-50 text-red-600 border border-red-100 hover:bg-red-100\b/g, to: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20" },
  { from: /\bhover:bg-red-50 hover:text-red-600\b/g, to: "hover:bg-red-500/10 hover:text-red-500" },
  { from: /\bbg-red-50 text-red-600\b/g, to: "bg-red-500/10 text-red-600 dark:text-red-400" },
  { from: /\bborder-red-100\b/g, to: "border-red-500/20" },
  { from: /bg-background border-border\/60 text-muted-foreground hover:bg-muted\/50/g, to: "bg-background dark:bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/50" }
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed buttons for dark mode!');
