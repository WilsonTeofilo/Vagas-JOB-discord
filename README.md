# Trampo 💼 — Mural de Vagas e Oportunidades

> Plataforma fullstack open-source para comunidades do Discord publicarem **vagas de emprego** e **perfis de freelancers** de forma organizada, segura e automatizada.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E5A0?logo=postgresql)](https://neon.tech)
[![Discord](https://img.shields.io/badge/Auth-Discord_OAuth2-5865F2?logo=discord)](https://discord.com/developers)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📋 Índice

- [O que é o Trampo?](#-o-que-é-o-trampo)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e Stack](#%EF%B8%8F-arquitetura-e-stack)
- [Sistema de Segurança](#-sistema-de-segurança)
- [Sistema de Temas Visuais](#-sistema-de-temas-visuais)
- [Instalação — Método 1: Setup Wizard](#-método-1--setup-wizard-recomendado)
- [Instalação — Método 2: Manual](#%EF%B8%8F-método-2--configuração-manual-vanilla)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença e Créditos](#%EF%B8%8F-licença-e-créditos)

---

## 🎯 O que é o Trampo?

O **Trampo** é uma aplicação web que serve como mural de oportunidades para comunidades do Discord. Em vez de usar um bot ou planilha, os membros acessam um site moderno, fazem login com a conta do Discord deles e publicam vagas ou portfólios — que são enviados automaticamente para os canais corretos do servidor via Webhook.

**Pra quem é?** Qualquer dono de servidor Discord que queira organizar oportunidades de emprego e freelancers na comunidade, com moderação, controle de spam e visual personalizável.

---

## ✨ Principais Funcionalidades

- **Mural Público Interativo**: Filtre e pesquise vagas e freelancers aprovados diretamente no site, com botão para chamar o autor no Discord com 1 clique.
- **Integração Discord**: Envio automático e formatado para os canais de vagas via Webhook (OAuth2 seguro, sem acessar senhas).
- **Painel Admin Poderoso**: Aprove, rejeite (com justificativa) ou exclua vagas. O site controla o Discord: apagou no painel, apaga no canal do servidor.
- **Formulários Dinâmicos**: O Admin pode editar quais Faculdades, Níveis e Regimes aparecem no formulário sem tocar em código.
- **Sistema de Temas e Anúncios**: Edite as cores do site em tempo real (Glassmorphism) e gerencie banners de anúncios nativos.
- **Proteções**: Anti-spam (rate limits e cooldown), Anti-ping (@everyone bloqueado) e Segurança total (SSR, CSRF, NextAuth).

---

## 🏗️ Arquitetura e Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário / Admin                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│              Next.js 16 App Router (Vercel)                  │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Server Components│  │    API Routes (Route Handlers)   │  │
│  │  ThemeProvider  │  │  /api/discord  /api/admin/*      │  │
│  │  AdminPage      │  │  /api/theme/*  /api/auth/*       │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           proxy.js (Next.js Middleware)                  │ │
│  │   Setup Wizard ↔ App Router ↔ Setup API lockdown        │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────────────┬────────────────────────┘
           │ Prisma v7 + pg           │ fetch (Webhook)
┌──────────▼──────────┐  ┌───────────▼──────────────────────┐
│  PostgreSQL (Neon)  │  │    Discord API (Webhooks)         │
│  Users / JobPosts   │  │    Canal Vagas / Canal Freelas    │
│  Admins / Themes    │  └──────────────────────────────────┘
│  UserPreferences    │
└─────────────────────┘
```

### Stack Completa

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Framework | **Next.js 16.2** App Router | Server Components + API Routes em um só lugar |
| UI | **React 19.2** + Vanilla CSS Modules | Performance máxima, sem CSS-in-JS |
| Banco de Dados | **PostgreSQL via Neon DB** | Serverless, gratuito, alta performance |
| ORM | **Prisma v7** + `@prisma/adapter-pg` | Type-safe, migrations automáticas |
| Autenticação | **NextAuth.js** Discord Provider | Cookies HttpOnly nativos, anti-CSRF |
| Validação | **Zod** | Schema de validação em runtime para todas as APIs |
| Deploy | **Vercel** | SSR + Edge Middleware + CI/CD automático |

---

## 🔒 Stack e Segurança
Construído com **Next.js 16 (App Router)**, **React 19**, **Prisma v7** e banco **Neon DB (PostgreSQL)**.

A plataforma foi blindada para produção:
- **Cookies HttpOnly** e **Anti-CSRF** (sem injeção de sessão ou links maliciosos).
- **SSRF Blocked**: O Setup Wizard proíbe acesso a IPs internos (AWS/GCP metadata) garantindo a segurança do seu servidor.
- **Variaveis Ocultas**: Nenhuma chave da API do Discord ou Banco vai pro lado do cliente (ausência proposital do `NEXT_PUBLIC_`).

---

## 🧙 Método 1 — Setup Wizard (recomendado)
> Ideal para quem quer configurar tudo pelo navegador, com guias explicativos em cada etapa.

### Passo Zero: Criar Conta e Fazer o Fork no GitHub 🚨 (OBRIGATÓRIO)
Se você não tem experiência com programação, preste muita atenção: **NÃO pule esta etapa!** Se você pular, o seu site vai quebrar na hora de colocar no ar (na Vercel).

1. Crie uma conta gratuita no [GitHub](https://github.com/).
2. Volte nesta página (do projeto Trampo) e clique no botão **"Fork"** no canto superior direito.
3. Isso vai criar uma cópia exata do projeto na **sua** conta do GitHub.

> **Por que isso é obrigatório?** O Fork é a única forma de você conseguir hospedar o projeto depois na Vercel e receber futuras atualizações de segurança e recursos (usando o botão *Sync Fork*) sem precisar entender de código.

ABRA O TERMINAL
```bash
# 1. Faça o clone do SEU repositório.
# Vá na página do seu Fork no GitHub, clique no botão verde "Code", 
# copie a URL e cole aqui depois do "git clone":
git clone COLE_A_URL_DO_SEU_FORK_AQUI
cd Vagas-JOB-discord

# 🛑 AVISO CRÍTICO: Não faça o clone do link original do projeto (WilsonTeofilo). 
# Se você clonar o link original, quando tentar fazer alguma alteração 
# e rodar um "git push", o GitHub vai te dar "Permission Denied" porque 
# você não é o dono. Sempre faça o clone do SEU fork!

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

copie do seu terminal o endereço localhost, ex: `http://localhost:3000` — após isso, cole no topo da barra de pesquisa do seu navegador, o wizard inicia automaticamente e guia você por 5 etapas:

| Etapa | O que configura |
|-------|----------------|
| 1️⃣ Banco de Dados | URL de conexão PostgreSQL (Neon DB). **Nota:** Ao criar a conta, coloque o nome da Organization. No projeto, mantenha a opção "Neon Auth" DESLIGADA e escolha sua região (ex: São Paulo). Após criar, você pode copiar a "Connection string" revelando a senha com "Show password" e clicando em "Copy snippet". Ou clique em "Go to project", vá no botão "Connect", habilite "Show password" e copie o snippet. |
| 2️⃣ Webhooks Discord | URLs dos canais de vagas e freelancers |
| 3️⃣ App Discord | Client ID e Client Secret para OAuth2. Acesse a aba "OAuth2", crie um Redirect, cole a URL exata do seu site e salve. |
| 4️⃣ Autenticação | NEXTAUTH_SECRET (pode gerar automaticamente) e URL do site |
| 5️⃣ Comunidade | Link permanente de convite do seu servidor |

Ao concluir o Wizard, o `.env.local` é gerado e o sistema tenta configurar o banco de dados automaticamente. O servidor dará uma leve desconectada e reiniciará.

### ⚠️ Passo de Verificação (Apenas se ocorrer Erro 500)

**Na grande maioria das vezes, o Setup Wizard sincroniza o banco automaticamente.** Porém, dependendo do seu sistema operacional, o comando automático pode falhar.

Se ao tentar acessar o site você receber um **Erro 500**, significa que o banco não foi sincronizado. Siga os passos:

1. Vá para o terminal onde o servidor estava rodando. Pressione `CTRL+C` para parar.
2. Rode o comando abaixo para criar as tabelas no seu banco Neon DB:
```bash
npx prisma db push
```

3. Depois que o banco for sincronizado com sucesso, inicie o servidor novamente:
```bash
npm run dev
```

> **🔁 Seguro para redeploy**: O wizard só aparece quando as variáveis de ambiente **não estão presentes**. Com `.env.local` preenchido ou variáveis configuradas na Vercel, o sistema ignora completamente o wizard — nenhum novo deploy vai triggar o setup de novo.

---

## 🛠️ Método 2 — Configuração Manual (vanilla)

> Para quem prefere editar arquivos diretamente. Rápido e sem interface.

**1. Faça o Fork** deste repositório no GitHub.

```bash
# 2. Clone o SEU repositório (Vá no seu GitHub, botão verde "Code", copie o link e cole abaixo)
git clone COLE_A_URL_DO_SEU_FORK_AQUI
cd Vagas-JOB-discord
npm install
```

Crie o arquivo `.env.local` na raiz do projeto:

```env
# ── Banco de Dados (Neon DB recomendado — neon.tech) ─────────────────
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require"

# ── Webhooks do Discord ────────────────────────────────────────────────
# Cada variável deve apontar para o webhook do canal correto no seu servidor
DISCORD_WEBHOOK_URL_VAGAS="https://discord.com/api/webhooks/ID/TOKEN"
DISCORD_WEBHOOK_URL_FREELANCERS="https://discord.com/api/webhooks/ID/TOKEN"

# ── Autenticação ───────────────────────────────────────────────────────
# Em produção substitua por: https://seu-dominio.vercel.app
NEXTAUTH_URL="http://localhost:3000"
# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET="sua_chave_secreta_minimo_32_caracteres"

# ── App do Discord (discord.com/developers/applications) ───────────────
DISCORD_CLIENT_ID="id_numerico_do_seu_app"
DISCORD_CLIENT_SECRET="secret_do_seu_app"

# ── Link de Convite da Comunidade (opcional — usado pelo Setup Wizard) ─────
# Configure em src/lib/brand.js → discordInvite para personalizar o link
# exibido no modal de sucesso do formulário e na tela de login.
# NEXT_PUBLIC_DISCORD_SERVER_URL="https://discord.gg/SEU_LINK_PERMANENTE"
```

### Como criar o App no Discord Developer Portal

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application** e dê um nome.
2. No menu lateral esquerdo, clique na aba **OAuth2** (pode não ter a opção "General", clique apenas em OAuth2).
3. Copie o **Client ID** e clique no botão **Reset Secret** para revelar e obter o Client Secret.
4. Role a página até a seção **Redirects**, clique em "Add Redirect" e cole a URL exata:
   - **Local:** `http://localhost:3000/api/auth/callback/discord`
   - **Produção:** `https://seu-dominio.vercel.app/api/auth/callback/discord`
   - **(Não esqueça de clicar no botão verde para Salvar as alterações)**

```bash
# Crie as tabelas no banco (apenas na primeira vez)
npx prisma db push

# Inicie o servidor
npm run dev
```

---

## 🚀 Hospedando na Vercel (Deploy)

Se você já seguiu os passos de instalação, usou o Setup Wizard e tem o seu arquivo `.env.local` pronto e funcionando no localhost, colocar o site no ar é muito simples. 
**Atenção:** Você **não precisa** rodar `npx prisma db push` de novo, pois o seu banco Neon DB já foi criado e está na nuvem! A Vercel vai apenas se conectar a ele.

### Passo a Passo (Via GitHub — Recomendado para Deploy Automático)

Como você já fez o **Fork** no Passo Zero da instalação, hospedar a versão final é um processo de 3 cliques:

1. **Importe na Vercel:**
   Acesse [vercel.com](https://vercel.com) → **New Project** → Importe o seu repositório `Vagas-JOB-discord` do GitHub.
3. **Configure as Variáveis:**
   Na tela de importação da Vercel, abra a seção **Environment Variables**. Abra o seu arquivo `.env.local` no bloco de notas do seu PC, copie **todo o conteúdo** e cole no primeiro campo da Vercel. Ela vai preencher todas as chaves automaticamente!
4. **Corrija a URL Final:**
   Ainda nas variáveis, altere o valor de `NEXTAUTH_URL` de `http://localhost:3000` para a URL que a Vercel vai gerar para você (ex: `https://meu-trampo-discord.vercel.app`).
5. **Clique em Deploy.**

### Passo Final: Atualizar o Discord

Agora que seu site tem um link oficial na internet, você precisa avisar o Discord:
1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications).
2. Vá em **OAuth2**.
3. Adicione um novo **Redirect URI** com o seu link oficial: 
   `https://meu-trampo-discord.vercel.app/api/auth/callback/discord`
   *(Não esqueça de Salvar)*

> 📌 **Pronto!** O site já está no ar. Como a Vercel está lendo o mesmo banco de dados que você usou no localhost, todos os temas, vagas e permissões de Admin que você configurou já estarão funcionando perfeitamente na versão oficial.

### Redeploy Seguro

Ao atualizar o código no futuro (dando um simples `git push`), **nada quebra**:
- O banco de dados continua intacto na Neon DB
- Os temas visuais vivem no banco — não são sobrescritos
- As variáveis (incluindo as de webhook) ficam seguras no painel da Vercel
- O Setup Wizard fica bloqueado na URL pública, impedindo intrusos

---

## 📁 Estrutura do Projeto

```
trampo/
├── prisma/
│   └── schema.prisma          # Modelos: User, Admin, JobPost, Theme, UserThemePreference
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # OAuth2 Discord + upsert de usuário no banco
│   │   │   ├── discord/             # POST: publica vaga/freela com rate limit
│   │   │   ├── admin/
│   │   │   │   ├── action/          # POST: aprovar/rejeitar vaga (admin)
│   │   │   │   ├── promote/         # POST: promover usuário a admin (root)
│   │   │   │   ├── demote/          # POST: remover admin (root)
│   │   │   │   ├── me/              # GET: retorna dados do admin autenticado
│   │   │   │   ├── users/           # GET: busca de usuários com rate limit
│   │   │   │   ├── form-config/     # GET/PUT/DELETE: opções dinâmicas do formulário
│   │   │   │   └── ads/             # GET/POST/DELETE: gerenciamento de anúncios
│   │   │   │       └── [id]/        # DELETE: remove anúncio específico
│   │   │   ├── theme/
│   │   │   │   ├── [slot]/          # GET/PUT/DELETE: tema por slot (1,2,3)
│   │   │   │   ├── [slot]/activate/ # PUT: define tema como padrão do site
│   │   │   │   └── preference/      # GET/PUT/DELETE: preferência individual
│   │   │   ├── ads/                 # GET: anúncio ativo (público, anti-adblock)
│   │   │   │   └── click/           # POST: registra clique em anúncio
│   │   │   └── setup/
│   │   │       ├── save/            # POST: grava .env.local (bloqueado em prod)
│   │   │       ├── validate/        # POST: testa DB/webhooks (bloqueado em prod)
│   │   │       └── generate-secret/ # GET: gera NEXTAUTH_SECRET seguro
│   │   ├── admin/
│   │   │   ├── page.js             # Painel de moderação (Server Component)
│   │   │   ├── form-config/        # Editor de opções do formulário (tags + reset)
│   │   │   └── theme-editor/       # Editor visual de temas (Client Component)
│   │   ├── setup/
│   │   │   └── page.js             # Wizard de configuração (5 etapas)
│   │   ├── layout.js               # Layout raiz com ThemeProvider
│   │   └── globals.css             # Design system com CSS Custom Properties
│   │
│   ├── components/
│   │   ├── JobForm.js              # Formulário principal de vagas/freelas
│   │   ├── GlobalHeader.js         # Cabeçalho global fixo com navegação
│   │   ├── AdBanner.js             # Banner de anúncio (float e horizontal)
│   │   ├── DonationModal.js        # Modal de apoio financeiro ao projeto
│   │   ├── ThemeProvider.js        # Server Component: injeta CSS do tema no <head>
│   │   ├── ThemePreviewListener.js # Client Component: recebe preview via postMessage
│   │   ├── ThemeSelector.js        # Seletor de tema individual para usuários
│   │   ├── AdminManager.js         # UI de promoção/remoção de admins
│   │   ├── Providers.js            # SessionProvider do NextAuth
│   │   └── Footer.js               # Rodapé com créditos
│   │
│   ├── services/
│   │   ├── job.service.js          # Regras de negócio: vagas, rate limit, admins
│   │   ├── theme.service.js        # Regras de negócio: temas e preferências
│   │   ├── form-config.service.js  # Opções do formulário (padrão + customizadas)
│   │   └── discord.service.js      # Envio de webhooks + sanitização anti-ping
│   │
│   ├── lib/
│   │   ├── prisma.js               # Singleton do Prisma Client
│   │   ├── brand.js                # Configurações da comunidade (nome, link Discord, doações)
│   │   ├── theme-css.js            # Gerador de CSS puro (re-sanitiza tudo)
│   │   ├── is-admin.js             # Verifica permissão de admin via banco
│   │   └── csrf.js                 # Validação de Origin/Referer anti-CSRF
│   │
│   ├── validations/
│   │   └── schemas.js              # Schemas Zod: vagas, freelas, moderação, admin
│   │
│   ├── data/
│   │   └── education.js            # Listas padrão de faculdades, cursos e níveis
│   │
│   └── proxy.js                    # Middleware: Setup Wizard ↔ App lockdown
```

---

## ⚖️ Licença e Créditos

Este projeto é **open-source** e pode ser clonado, modificado e redistribuído livremente.

**Os créditos ao criador original são obrigatórios:**

- O nome **Trampo** e os créditos **"Desenvolvido por Wilson Teofilo"** presentes no rodapé e no código-fonte **não devem ser removidos** em versões derivadas.
- Ao usar ou distribuir este projeto (ou um fork), mantenha a atribuição visível para os usuários finais.

---

> Criado e mantido por [Wilson Teofilo](https://www.linkedin.com/in/wilson-teofilo/) · [Comunidade Discord](https://discord.gg/XwCzSwT53u)
