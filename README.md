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
