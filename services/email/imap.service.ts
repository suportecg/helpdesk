import { ImapFlow } from 'imapflow';
import { google } from 'googleapis';
import { getCorporateSettings, updateCorporateSettings } from '../settings/settings.service';

/**
 * Gets a fresh access token using the stored refresh token.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const settings = await getCorporateSettings();
  
  if (!settings.googleRefreshToken) {
    throw new Error('Refresh token não encontrado nas configurações.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais do Google OAuth não configuradas no servidor (.env).');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: settings.googleRefreshToken });

  try {
    const { token } = await oauth2Client.getAccessToken();
    if (!token) throw new Error('O Google não retornou um token de acesso válido.');
    return token;
  } catch (error: any) {
    console.error('[IMAP] Erro ao obter token de acesso:', error.message);
    
    // Se o refresh token foi revogado, marca nas configurações
    if (error.message?.includes('invalid_grant')) {
      await updateCorporateSettings({
        emailIntegrationStatus: 'ERROR',
        emailCheckError: 'Refresh token revogado ou expirado. Reconecte a conta.',
      });
    }
    throw error;
  }
}

/**
 * Connects to IMAP using XOAUTH2 and returns the ImapFlow instance.
 */
export async function connectToImap(): Promise<ImapFlow> {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    throw new Error('Não foi possível obter o token de acesso para conectar ao IMAP.');
  }

  let emailUser = process.env.EMAIL_IMAP_USER;
  
  // Se não tem no .env, descobre o email do dono do token dinamicamente
  if (!emailUser) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      if (profile.data.emailAddress) {
        emailUser = profile.data.emailAddress;
      } else {
        throw new Error("E-mail não retornado na API do Gmail");
      }
    } catch (err: any) {
      console.error("[IMAP] Erro ao buscar perfil do Gmail:", err.message);
      throw new Error("Falha ao obter o e-mail da conta autorizada. Defina EMAIL_IMAP_USER no .env.");
    }
  }

  const imapHost = process.env.EMAIL_IMAP_HOST || 'imap.gmail.com';
  const imapPort = Number(process.env.EMAIL_IMAP_PORT || 993);

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: {
      user: emailUser,
      accessToken,
    },
    logger: false, // Desabilitar log verboso da lib
  });

  try {
    await client.connect();
    return client;
  } catch (error: any) {
    console.error('[IMAP] Erro ao conectar:', error);
    throw new Error(`Falha na conexão IMAP: ${error.message}`);
  }
}
