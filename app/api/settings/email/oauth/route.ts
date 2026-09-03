import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCorporateSettings, updateCorporateSettings } from "@/services/settings/settings.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.json({ error: "Autorização negada pelo usuário", details: error }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // O redirect URI deve ser esta mesma rota
  // Como podemos estar rodando em localhost ou Vercel, usamos a origin da URL atual
  const redirectUri = new URL('/api/settings/email/oauth', request.url).toString();

  if (!clientId || !clientSecret) {
    const errorUrl = new URL('/configuracoes?error=missing_google_credentials', request.url);
    return NextResponse.redirect(errorUrl);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Se não tem código, geramos a URL e redirecionamos o usuário
  if (!code) {
    const scopes = [
      'https://mail.google.com/', // Acesso IMAP ao Gmail
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Necessário para receber o refresh_token
      prompt: 'consent',      // Força a exibição para garantir que o refresh_token seja retornado
      scope: scopes,
    });

    return NextResponse.redirect(url);
  }

  // Se recebemos o código, trocamos pelo refresh token
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      // Salva o refresh token no banco de dados
      const settings = await getCorporateSettings();
      await updateCorporateSettings({
        googleRefreshToken: tokens.refresh_token,
        emailIntegrationStatus: 'CONNECTED',
        emailCheckError: null,
      });

      // Redireciona de volta para a página de configurações de integração com sucesso
      const successUrl = new URL('/configuracoes?integration=email-success', request.url);
      return NextResponse.redirect(successUrl);
    } else {
      // O Google não retornou refresh_token (já havia sido autorizado antes sem prompt=consent)
      // Como passamos prompt=consent, isso raramente deve acontecer.
      return NextResponse.json({ 
        error: "Google não retornou refresh_token. Tente revogar o acesso no painel do Google e tentar novamente." 
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[OAUTH] Erro ao trocar código:", err);
    return NextResponse.json({ error: "Falha ao obter tokens OAuth", details: err.message }, { status: 500 });
  }
}
