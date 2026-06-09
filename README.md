```md
# UX Academy

Plataforma pessoal de estudos e organização da minha pós-graduação em UX Design, desenvolvida para centralizar conteúdos, acompanhar progresso por disciplina e apresentar entregas do portfólio em uma experiência única.

## Sobre o projeto

O **UX Academy** foi criado como um hub de estudos da pós, reunindo em um só lugar:

- dashboard de disciplinas
- timeline da pós
- glossário de termos
- flashcards
- materiais de apoio
- resumos
- revisões
- portfólio real com compartilhamento público

Além de funcionar como ferramenta de estudo, o projeto também serve como **portfólio acadêmico**, mostrando capacidade de estruturar produto, autenticação, persistência de dados e experiência de usuário.

## Funcionalidades

- Autenticação com **Supabase Auth**
- Login por **Magic Link**
- Login com **Google**
- Persistência dos dados por usuário
- Sincronização entre dispositivos
- Migração automática de dados antigos do `localStorage` para o Supabase
- Controle de status das disciplinas
- Gestão de flashcards, materiais, resumos e revisões
- Glossário personalizado salvo em banco
- Portfólio real com **link público compartilhável**
- Preferência de tema salva por usuário

## Tecnologias utilizadas

- **React**
- **TypeScript**
- **Vite**
- **TanStack Router**
- **TanStack Query**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase**

## Estrutura principal

O projeto utiliza o **Supabase** para:

- autenticação
- banco de dados
- persistência por perfil
- compartilhamento público do portfólio

## Configuração local

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd ux-pathway-hub
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` com:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 4. Configurar o banco no Supabase

Rode no SQL Editor do Supabase o script de migration localizado em:

```bash
supabase/migrations/20260608220000_add_remaining_subject_data.sql
```

Esse script cria as tabelas, índices, policies e funções necessárias para o projeto.

### 5. Rodar localmente

```bash
npm run dev
```

## Build de produção

```bash
npm run build
```

## Compartilhamento público do portfólio

O projeto permite gerar uma **página pública do Portfólio Real**, sem expor outras áreas privadas da aplicação.

Com isso, é possível compartilhar apenas os projetos e entregas da pós em uma URL pública única.

## Objetivo

Este projeto foi desenvolvido com foco em:

- organização dos estudos
- acompanhamento da jornada da pós
- construção de portfólio acadêmico
- demonstração prática de integração entre frontend e backend

## Autor

**Renan Gustavo Lemes de Souza**  
GitHub: [EvilUta](https://github.com/EvilUta)

## Observações

Este projeto tem fins acadêmicos, pessoais e de portfólio, mas foi estruturado com foco em boas práticas reais de produto e desenvolvimento.


