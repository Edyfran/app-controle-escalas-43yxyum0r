# Projeto Criado com o Skip

Este projeto foi criado de ponta a ponta com o [Skip](https://goskip.dev).

## 🚀 Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React
- **Supabase** - Backend (Postgres, Auth, Edge Functions)

## 📋 Pré-requisitos

- Node.js 18+
- npm
- Uma conta [Supabase](https://supabase.com) (o backend do app)

## 🔧 Instalação

```bash
npm install
```

## 🗄️ Backend (Supabase)

O app usa [Supabase](https://supabase.com) como backend: Postgres com RLS multi-tenant (cada
paróquia só enxerga seus próprios dados), Auth (coordenador e membro usam o mesmo mecanismo,
diferenciados por perfil) e uma Edge Function para notificações por email.

### 1. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (nunca commitado — já está no `.gitignore`):

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

Esses dois valores ficam em **Project Settings → API** no painel do Supabase (use a
**Project URL** e a **anon public key** — nunca a `service_role`).

### 2. Schema do banco

Rode os arquivos em [`supabase/migrations/`](supabase/migrations/) **em ordem** contra o seu
projeto, pelo SQL Editor do painel do Supabase (Database → SQL Editor → cole o conteúdo de cada
arquivo e execute, um de cada vez, começando por `0001_init.sql`).

### 3. Auth: URL de redirecionamento

Em **Authentication → URL Configuration**, defina `Site URL` e adicione à lista de "Redirect
URLs" a URL onde o app está rodando (ex: `http://localhost:8080/**` em desenvolvimento, ou o
domínio de produção depois do deploy). Isso é necessário para o link de "esqueci minha senha"
funcionar — sem isso o Supabase recusa o redirecionamento.

### 4. Notificação por email (opcional)

O envio automático de email quando um membro é escalado usa a
[Edge Function](supabase/functions/notify-assignment) `notify-assignment` + [Resend](https://resend.com):

1. Crie uma conta gratuita no Resend e gere uma API key.
2. Configure o secret no projeto Supabase: **Edge Functions → Secrets**, adicione
   `RESEND_API_KEY` com o valor da sua chave.
3. Faça o deploy da função (via [Supabase CLI](https://supabase.com/docs/guides/functions/deploy) —
   `supabase functions deploy notify-assignment` — ou colando o conteúdo do `index.ts` no editor
   de Edge Functions do painel).
4. Sem domínio verificado no Resend, o remetente padrão (`onboarding@resend.dev`) só entrega para
   o email da própria conta Resend. Para notificar membros de verdade, verifique um domínio
   próprio no Resend.

Se pular esta etapa, o resto do app funciona normalmente — só não dispara o email de aviso.

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Executar linter e corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Oxfmt
npm run format
```

## 📁 Estrutura do Projeto

```
.
├── src/              # Código fonte da aplicação
├── supabase/
│   ├── migrations/   # Schema do banco (SQL), aplicar em ordem
│   └── functions/    # Edge Functions (ex: notify-assignment)
├── public/           # Arquivos estáticos
├── dist/             # Build de produção (gerado)
├── node_modules/     # Dependências (gerado)
└── package.json      # Configurações e dependências do projeto
```

## 🎨 Componentes UI

Este template inclui uma biblioteca completa de componentes Shadcn UI baseados em Radix UI:

- Accordion
- Alert Dialog
- Avatar
- Button
- Checkbox
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Switch
- Tabs
- Toast
- Tooltip
- E muito mais...

## 📝 Ferramentas de Qualidade de Código

- **TypeScript**: Tipagem estática
- **Oxlint**: Linter extremamente rápido
- **Oxfmt**: Formatação automática de código

## 🔄 Workflow de Desenvolvimento

1. Instale as dependências: `npm install`
2. Inicie o servidor de desenvolvimento: `npm start`
3. Faça suas alterações
4. Verifique o código: `npm run lint`
5. Formate o código: `npm run format`
6. Crie a build: `npm run build`
7. Visualize a build: `npm run preview`

## 📦 Build e Deploy

Para criar uma build otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.
