import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RoleType, StatusType, OrigemType, PrioridadeType } from "@prisma/client";

export async function runFullDatabaseSeed(): Promise<{
  success: boolean;
  message: string;
  details: Record<string, number>;
}> {
  try {
    const details: Record<string, number> = {};

    console.log("[Seed] 1. Semeando Empresa (CG Construções) e Configurações...");
    let company = await prisma.company.findUnique({
      where: { name: "CG Construções" },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "CG Construções",
          logo: "/cg-logo.png",
          active: true,
        },
      });
      details["company"] = 1;
    } else {
      details["company"] = 0;
    }

    const settingsCount = await prisma.settings.count({
      where: { companyId: company.id },
    });

    if (settingsCount === 0) {
      await prisma.settings.create({
        data: {
          companyId: company.id,
          systemName: "CG Construções HelpDesk",
          theme: "system",
          primaryColor: "#2563eb",
          secondaryColor: "#f1f5f9",
        },
      });
      details["settings"] = 1;
    } else {
      details["settings"] = 0;
    }

    console.log("[Seed] 2. Semeando Papéis (Roles)...");
    const rolesData = [
      { name: RoleType.ADMIN, label: "Administrador Geral", description: "Acesso irrestrito a todo o sistema" },
      { name: RoleType.TI, label: "Equipe de Suporte e TI", description: "Gestão e atendimento técnico de chamados" },
      { name: RoleType.SOLICITANTE, label: "Solicitante", description: "Abertura e acompanhamento de chamados próprios" },
    ];

    let rolesCreated = 0;
    for (const r of rolesData) {
      const exists = await prisma.role.findUnique({ where: { name: r.name } });
      if (!exists) {
        await prisma.role.create({ data: r });
        rolesCreated++;
      }
    }
    details["roles"] = rolesCreated;

    console.log("[Seed] 3. Semeando Permissões e Agrupamentos (Permissions)...");
    const permissionsData = [
      { code: "chamados.create", label: "Criar Chamado", category: "Chamados", description: "Permite abrir novos chamados no sistema" },
      { code: "chamados.read", label: "Visualizar Chamados", category: "Chamados", description: "Permite listar e ler chamados" },
      { code: "chamados.update", label: "Editar Chamado", category: "Chamados", description: "Permite atualizar status e detalhes de chamados" },
      { code: "chamados.delete", label: "Excluir Chamado", category: "Chamados", description: "Permite excluir chamados" },
      { code: "users.create", label: "Criar Usuário", category: "Usuários", description: "Permite cadastrar novos usuários e técnicos" },
      { code: "users.read", label: "Visualizar Usuários", category: "Usuários", description: "Permite listar usuários e técnicos" },
      { code: "users.update", label: "Editar Usuário", category: "Usuários", description: "Permite editar dados de usuários" },
      { code: "users.delete", label: "Excluir Usuário", category: "Usuários", description: "Permite inativar ou excluir usuários" },
      { code: "users.permissions", label: "Gerenciar Permissões", category: "Usuários", description: "Permite alterar permissões individuais e papéis" },
      { code: "dashboard.read", label: "Acessar Dashboard", category: "Dashboard", description: "Permite visualizar indicadores globais do Dashboard" },
      { code: "settings.read", label: "Visualizar Configurações", category: "Configurações", description: "Permite acessar painel de configurações" },
      { code: "settings.update", label: "Alterar Configurações", category: "Configurações", description: "Permite modificar configurações institucionais e White Label" },
      { code: "reports.read", label: "Acessar Relatórios", category: "Relatórios", description: "Permite visualizar relatórios de SLA e atendimento" },
      { code: "reports.export", label: "Exportar Relatórios", category: "Relatórios", description: "Permite exportar dados em Excel e PDF" },
      { code: "integrations.read", label: "Visualizar Integrações", category: "Integrações", description: "Permite consultar integrações com WhatsApp e Email" },
      { code: "integrations.update", label: "Configurar Integrações", category: "Integrações", description: "Permite alterar chaves e webhooks das integrações" },
    ];

    let permissionsCreated = 0;
    for (const p of permissionsData) {
      const exists = await prisma.permission.findUnique({ where: { code: p.code } });
      if (!exists) {
        await prisma.permission.create({ data: p });
        permissionsCreated++;
      }
    }
    details["permissions"] = permissionsCreated;

    console.log("[Seed] 4. Semeando 24 Setores da CG Construções...");
    const sectorsList = [
      "Almoxarifado",
      "Brasília",
      "Compras",
      "Conceito Viver",
      "Controladoria",
      "Sala Técnica",
      "Engenharia",
      "Financeiro",
      "Konstroi",
      "Lavras",
      "Departamento Pessoal",
      "Qualidade",
      "Ramal",
      "Recepção",
      "RH",
      "CTR",
      "Riversul",
      "Diretoria",
      "Contabilidade",
      "Casif",
      "TI",
      "JRB Impressora",
      "Mahay",
      "JFJ Ousy",
    ];

    let sectorsCreated = 0;
    for (const secName of sectorsList) {
      const exists = await prisma.sector.findUnique({ where: { name: secName } });
      if (!exists) {
        await prisma.sector.create({
          data: {
            name: secName,
            isActive: true,
          },
        });
        sectorsCreated++;
      }
    }
    details["sectors"] = sectorsCreated;

    console.log("[Seed] 5. Semeando 56 Serviços Catalogados...");
    const servicesList = [
      "Rede Acesso",
      "BKP Restauração",
      "Email Acesso",
      "Equipamento Ativação",
      "Software Instalação",
      "Google Drive Acesso Nuvem",
      "Software Configuração",
      "Formatação",
      "VPN Instalação",
      "VPN Configuração",
      "Equipamento Manutenção",
      "Dúvidas & Informações",
      "Informakon Perfil de Acesso",
      "Conta de Usuário Exclusão",
      "Conta de Usuário Criação",
      "Conta de Usuário Atualização",
      "Informakon BD Atualização",
      "Fortes AC Pessoal BD Atualização",
      "Antivirus Instalação",
      "Antivirus Configuração",
      "Email Configuração",
      "RDP Acesso",
      "RDP Configuração",
      "Onedrive Acesso",
      "Onedrive Configuração",
      "Equipamento Empréstimo",
      "Informakon Redefinição de Senha",
      "Rede Cabeamento",
      "Entrega de Equipamento",
      "Equipamento Desativação",
      "Sistema Operacional Configuração",
      "Fortes AC Pessoal Software Atualização",
      "Serviço Ativação",
      "Informakon Software Atualização",
      "Certificado Instalação",
      "Acionar Suporte Impressora",
      "Impressora Manutenção",
      "Impressora Configuração",
      "Google Drive Acesso Local",
      "Sistema Operacional Atualização",
      "Equipamento Configuração",
      "Informakon Instalação",
      "Credencial Instalação",
      "Acesso LocawebMail",
      "Implantação Servidor",
      "Acesso Wifi",
      "Software Desinstalação",
      "Permissão Fortes",
      "Office Ativação",
      "Permissão Informakon",
      "Ajuste Infraestrutura",
      "Reiniciar Agente",
      "Licença ZWCAD",
      "Certificado Fortes",
      "Agente Atualização",
      "Reunião Online", "Apoio",
      "Acionar Suporte Konstroi",
      "Acionar Suporte Fortes",
    ];

    let servicesCreated = 0;
    for (const srvName of servicesList) {
      const exists = await prisma.service.findUnique({ where: { name: srvName } });
      if (!exists) {
        await prisma.service.create({
          data: {
            name: srvName,
            isActive: true,
          },
        });
        servicesCreated++;
      }
    }
    details["services"] = servicesCreated;

    console.log("[Seed] 6. Semeando Enums / Tabelas de Tickets (Status, Origem, Prioridade)...");
    const statusesData = [
      { code: StatusType.ABERTO, label: "Aberto" },
      { code: StatusType.RESOLVIDO, label: "Resolvido" },
      { code: StatusType.AGUARDANDO_USUARIO, label: "Aguardando" },
      { code: StatusType.AGUARDANDO_PECA, label: "Agendado" },
    ];
    let statusesCreated = 0;
    for (const st of statusesData) {
      const exists = await prisma.ticketStatus.findUnique({ where: { code: st.code } });
      if (!exists) {
        await prisma.ticketStatus.create({ data: st });
        statusesCreated++;
      }
    }
    details["ticketStatuses"] = statusesCreated;

    const originsData = [
      { code: OrigemType.MANUAL, label: "Manual" },
      { code: OrigemType.WHATSAPP, label: "WhatsApp" },
      { code: OrigemType.EMAIL, label: "Email" },
    ];
    let originsCreated = 0;
    for (const org of originsData) {
      const exists = await prisma.ticketOrigin.findUnique({ where: { code: org.code } });
      if (!exists) {
        await prisma.ticketOrigin.create({ data: org });
        originsCreated++;
      }
    }
    details["ticketOrigins"] = originsCreated;

    const prioritiesData = [
      { code: PrioridadeType.BAIXA, label: "Baixa" },
      { code: PrioridadeType.MEDIA, label: "Média" },
      { code: PrioridadeType.ALTA, label: "Alta" },
      { code: PrioridadeType.CRITICA, label: "Crítica" },
    ];
    let prioritiesCreated = 0;
    for (const pr of prioritiesData) {
      const exists = await prisma.ticketPriority.findUnique({ where: { code: pr.code } });
      if (!exists) {
        await prisma.ticketPriority.create({ data: pr });
        prioritiesCreated++;
      }
    }
    details["ticketPriorities"] = prioritiesCreated;

    console.log("[Seed] 7. Semeando Administrador Inicial e Técnicos (Lucas, Hudson)...");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@cgconstrucoes.com.br";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";
    const lucasEmail = process.env.LUCAS_EMAIL || "lucas@cgconstrucoes.com.br";
    const hudsonEmail = process.env.HUDSON_EMAIL || "hudson@cgconstrucoes.com.br";
    const defaultTiPass = process.env.TI_PASSWORD || "ti123456";

    const adminRole = await prisma.role.findUnique({ where: { name: RoleType.ADMIN } });
    const tiRole = await prisma.role.findUnique({ where: { name: RoleType.TI } });
    const tiSector = await prisma.sector.findUnique({ where: { name: "TI" } });

    const usersToSeed = [
      {
        name: process.env.ADMIN_NAME || "Administrador Geral",
        email: adminEmail,
        password: await bcrypt.hash(adminPass, 10),
        role: RoleType.ADMIN,
        roleId: adminRole?.id || null,
        department: "Gestão / TI",
        sectorId: tiSector?.id || null,
      },
      {
        name: "Lucas",
        email: lucasEmail,
        password: await bcrypt.hash(defaultTiPass, 10),
        role: RoleType.TI,
        roleId: tiRole?.id || null,
        department: "TI",
        sectorId: tiSector?.id || null,
      },
      {
        name: "Hudson",
        email: hudsonEmail,
        password: await bcrypt.hash(defaultTiPass, 10),
        role: RoleType.TI,
        roleId: tiRole?.id || null,
        department: "TI",
        sectorId: tiSector?.id || null,
      },
    ];

    let usersCreated = 0;
    for (const u of usersToSeed) {
      const exists = await prisma.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        await prisma.user.create({ data: u });
        usersCreated++;
      }
    }
    details["users"] = usersCreated;

    console.log("[Seed] Seeding completo com sucesso!");
    return {
      success: true,
      message: "Seeding completo das entidades, enums, setores, serviços e técnicos executado com sucesso.",
      details,
    };
  } catch (error) {
    console.error("[Seed] Erro ao executar runFullDatabaseSeed:", error);
    throw error;
  }
}

// Mantido para retrocompatibilidade com chamadas da Etapa 1
export async function ensureInitialAdmin(): Promise<{
  created: boolean;
  email?: string;
  message: string;
}> {
  const seedResult = await runFullDatabaseSeed();
  return {
    created: (seedResult.details.users || 0) > 0,
    email: process.env.ADMIN_EMAIL || "admin@cgconstrucoes.com.br",
    message: seedResult.message,
  };
}
