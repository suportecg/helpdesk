# Configuração do Cron com cron-job.org

Para contornar as limitações de frequência do Vercel Cron no plano Hobby/Free (que não permite execução a cada 5 minutos), utilizamos o serviço gratuito [cron-job.org](https://cron-job.org) para acionar a rotina de verificação de e-mails do nosso HelpDesk.

## 1. Variável de Ambiente na Vercel

Por questões de segurança, nosso endpoint exige um segredo. 

1. Acesse o painel da [Vercel](https://vercel.com).
2. Vá no projeto do HelpDesk > **Settings** > **Environment Variables**.
3. Adicione uma nova variável:
   - **Key**: `CRON_SECRET`
   - **Value**: Gere um valor seguro, por exemplo, usando o comando no seu terminal:
     ```bash
     openssl rand -base64 32
     ```
     (Guarde esse valor, você precisará dele no cron-job.org)

> **Nota**: Não coloque o valor real em nenhum arquivo enviado para o repositório (Git).

### Outras Variáveis Necessárias
Para que o endpoint funcione corretamente, certifique-se de que as variáveis do **Google OAuth** (usadas para o IMAP) também estejam configuradas na Vercel:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_IMAP_USER` (opcional, caso o e-mail não seja inferido automaticamente)

## 2. Configurando o cron-job.org

1. Crie uma conta ou faça login em [cron-job.org](https://cron-job.org).
2. Clique em **CREATE CRONJOB** e preencha as informações:

- **Title**: `HelpDesk - Verificação de E-mails`
- **URL**: `https://SEU-DOMINIO-NA-VERCEL.vercel.app/api/email/check` (Substitua pela URL real de produção)
- **Execution schedule**: Escolha "User-defined" ou a opção de rodar a cada **5 minutos**.

### Configuração Avançada (Autenticação)
3. Na aba **Advanced**, encontre a seção **HTTP Headers**.
4. Adicione um novo Header:
   - **Header name**: `Authorization`
   - **Header value**: `Bearer SEU_CRON_SECRET_GERADO_AQUI` (Substitua pelo mesmo valor colocado na Vercel)

5. Clique em **CREATE**.

## 3. Testando Manualmente

Para garantir que a segurança está ativa, você pode testar via terminal:

**Teste sem Header (Deve falhar com 401 Unauthorized):**
```bash
curl -i -X GET https://SEU-DOMINIO-NA-VERCEL.vercel.app/api/email/check
```

> **Alternativa (Navegador)**: Você também pode testar acessando a URL diretamente pelo navegador. Como o sistema permite autenticação por sessão, se você estiver **logado como ADMIN ou TI** no painel do HelpDesk, o endpoint retornará `200 OK` e processará os e-mails sem exigir o header. Se estiver deslogado, retornará `401 Unauthorized`.

**Teste com Header Incorreto (Deve falhar com 401 Unauthorized):**
```bash
curl -i -X GET https://SEU-DOMINIO-NA-VERCEL.vercel.app/api/email/check \
  -H "Authorization: Bearer segredo-errado"
```

**Teste Correto (Deve retornar 200 OK):**
```bash
curl -i -X GET https://SEU-DOMINIO-NA-VERCEL.vercel.app/api/email/check \
  -H "Authorization: Bearer SEU_CRON_SECRET_GERADO_AQUI"
```

## 4. Monitoramento e Idempotência

- **Logs na Vercel**: Se houver um erro de execução ou falha de autenticação (401), você poderá visualizar na aba **Logs** do seu painel da Vercel.
- **Proteção contra Duplicidade (Idempotência)**: O sistema já é protegido contra criação de tickets duplicados. Ele verifica o identificador único do e-mail (`Message-ID`) e o registra no banco de dados PostgreSQL. Mesmo se o cron rodar duas vezes no mesmo segundo, o e-mail não gerará tickets duplicados. A estrutura atual no Prisma e Neon gerencia isso perfeitamente através da tabela `ProcessedEmail`.
