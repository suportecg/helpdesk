export const CG_LOGO_URL = "https://raw.githubusercontent.com/suportecg/helpdesk/main/public/cg-logo.png";

export function generateDefaultSignature(
  name: string,
  email: string,
  roleOrDepartment?: string,
  phone?: string
) {
  const formattedPhone = phone || "(85) 9999-0000";
  return `<table cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF; font-family:Arial,sans-serif; font-size:14px; color:#333333;">
  <tbody>
    <tr>
      <!-- Logo principal -->
      <td style="vertical-align:top; padding-right:15px;">
        <img 
          alt="CG Construções" 
          src="${CG_LOGO_URL}" 
          style="border:none; display:block; width:125px;"
          width="125"
        />
      </td>

      <!-- Dados do usuário -->
      <td align="left" style="padding-left:15px; border-left:1px solid #e2e8f0;">
        <p style="margin:0; font-size:16px; font-weight:bold;">${name || "Seu Nome"}</p>
        <p style="margin:0; color:#666666;">${roleOrDepartment || "Assistente de TI"}</p>
        <p style="margin:0; color:#666666;"><b>CG Construções</b></p>
        <p style="margin:0; color:#666666;">
          <a href="mailto:${email}" style="color:#1A73E8; text-decoration:none; display:inline-block;">
            ${email || "seuemail@cgconstrucoes.com"}
          </a>
        </p>
        <p style="margin:0; color:#666666;">
          <span style="color:#000000;">Fone:</span>
          <a href="tel:${formattedPhone.replace(/\D/g, '')}" style="color:#1A73E8; text-decoration:none;">
            ${formattedPhone}
          </a>
        </p>
        <p style="margin:0; color:#666666;">
          <span style="color:#000000;">Website: </span>
          <a href="https://www.cgconstrucoes.com" style="color:#1A73E8; text-decoration:none;" target="_blank" rel="noopener noreferrer">
            www.cgconstrucoes.com
          </a>
        </p>
      </td>
    </tr>

    <!-- Redes sociais e logo -->
    <tr>
      <td colspan="2" align="left" style="padding-top:10px;">
        <p style="font-size:12px; color:#888888; margin:0 0 5px 0;">Siga-nos:</p>
        
        <!-- Redes sociais -->
        <span style="display:inline-block;">
          <a href="https://www.facebook.com/cg.construcoesconst" target="_blank" rel="noopener noreferrer" 
             style="text-decoration:none; border:none; outline:none; display:inline-block;">
            <img alt="Facebook" 
                 src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" 
                 style="width:20px; border:none; outline:none; text-decoration:none; display:block;">
          </a>

          <a href="https://www.instagram.com/cg.construcoesoficial/" target="_blank" rel="noopener noreferrer"
             style="text-decoration:none; border:none; outline:none; display:inline-block; margin-left:5px;">
            <img alt="Instagram" 
                 src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                 style="width:20px; border:none; outline:none; text-decoration:none; display:block;">
          </a>

          <a href="https://www.linkedin.com/company/cg-constru%C3%A7%C3%B5es-ltda/" target="_blank" rel="noopener noreferrer"
             style="text-decoration:none; border:none; outline:none; display:inline-block; margin-left:5px;">
            <img alt="LinkedIn" 
                 src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                 style="width:20px; border:none; outline:none; text-decoration:none; display:block;">
          </a>
        </span>
      </td>
    </tr>
  </tbody>
</table>`;
}
