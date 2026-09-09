const fs = require('fs');

const path = './modules/emails/SignatureSettingsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { from: /\bbg-white\b/g, to: "bg-background" },
  { from: /\bborder-slate-200\b/g, to: "border-border/60" },
  { from: /\bborder-slate-100\b/g, to: "border-border/40" },
  { from: /\bborder-slate-300\b/g, to: "border-border" },
  { from: /\btext-slate-900\b/g, to: "text-foreground" },
  { from: /\btext-slate-800\b/g, to: "text-foreground" },
  { from: /\btext-slate-700\b/g, to: "text-muted-foreground" },
  { from: /\btext-slate-600\b/g, to: "text-muted-foreground" },
  { from: /\btext-slate-500\b/g, to: "text-muted-foreground" },
  { from: /\btext-slate-400\b/g, to: "text-muted-foreground/80" },
  { from: /\btext-slate-300\b/g, to: "text-muted-foreground/60" },
  { from: /\bbg-slate-50\b/g, to: "bg-muted/30" },
  { from: /\bbg-slate-100\b/g, to: "bg-muted/50" },
  { from: /\bhover:bg-slate-50\b/g, to: "hover:bg-muted/30" },
  { from: /\bhover:bg-slate-100\b/g, to: "hover:bg-muted/50" },
  { from: /\bbg-slate-50\/50\b/g, to: "bg-muted/20" },
  { from: /\bbg-slate-50\/80\b/g, to: "bg-muted/40" },
  { from: /\bdivide-slate-100\b/g, to: "divide-border/40" },
  { from: /\btext-slate-100\b/g, to: "text-foreground" },
  { from: /\bbg-slate-800\b/g, to: "bg-card" },
  { from: /\bborder-slate-700\b/g, to: "border-border/60" },
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed classes for dark mode!');
