const fs = require('fs');

function replaceFile(path) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Changing bg-background to bg-card for better contrast in dark mode
    content = content.replace(/\bbg-background\b/g, "bg-card");
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed bg-background -> bg-card in ' + path);
  }
}

replaceFile('./modules/emails/EmailsManagementClient.tsx');
replaceFile('./modules/emails/SignatureSettingsModal.tsx');
replaceFile('./modules/emails/EmailTemplatesManager.tsx');
