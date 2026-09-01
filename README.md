# Agenda Zero — Diário Digital para Creches

Agenda Zero é um sistema de comunicação diária entre creches e as famílias de crianças de 0 a 4 anos. A escola registra a rotina do dia como sono, alimentação, higiene, humor, ocorrências, e os responsáveis acompanham a rotina diária e outras informações pelo celular.

O projeto nasceu de uma observação simples: pais e responsáveis de bebês em creche têm uma ansiedade específica. Enquanto os pais no ensino fundamental acompanham seus filhos na escola preocupados com provas, notas, atividade, eventos, na creche a questão diária é "como ele esteve enquanto eu não estava perto?". Não se trata de um projeto disruptivo, definitivamente não almeja mudar o mundo, mas sim analisar e aprender aproveitando uma UX construída e evoluída por décadas, validada por milhões de usuários (sim, estou falando da agenda de papel, física, para creche, berçario e maternal) e pensar em uma adaptação para o digital, sob a regra máxima de facilitar seu uso para todos usuários envolvidos.   

---

## Stack
Todas as ferramentas operam dentro de tiers gratuitos. Essa restrição foi imposta intencionalmente para estimular a criação de soluções criativas dentro de limites reais, como qualquer projeto early-stage deveria considerar.

- **Next.js 14** com App Router e Server Actions
- **TypeScript**
- **Tailwind CSS**
- **Supabase**  PostgreSQL, autenticação, Row Level Security

---

## Funcionalidades do MVP

**Lado da escola (adm):**
- Cadastro de turmas, crianças, responsáveis e colaboradores
- Registro diário de rotina por criança (sono, alimentação, higiene, humor, observações)
- Registros de entrada e saída
- Envio de comunicados (por turma, turno, todos)
- Onboarding de responsáveis via link de convite (sem email)

**Lado da família (responsável):**
- Feed diário da criança com resumo da rotina
- Histórico de registros
- Acesso por telefone e senha, sem email necessário
- Recebimento de comunicados e recados

---

## Decisões de arquitetura

**Multi-tenancy:** todas as escolas na mesma base, separadas por `escola_id`. Row Level Security no Supabase garante que cada usuário acessa apenas dados da sua escola.

**Autenticação sem email:** o público inclui responsáveis que não usam email ativamente. O identificador é o telefone — o sistema cria um email fictício internamente para o Supabase Auth, invisível para o usuário.

**CPF protegido:** o CPF do responsável nunca é armazenado em texto puro. É processado via bcrypt no servidor antes de chegar ao banco — apenas o hash é salvo. O CPF original não existe na base.

**Vínculos com regras:** a tabela de vínculos entre responsável e criança suporta tipo (principal/secundário), datas de vigência para vínculos temporários, e registro de quem autorizou — protegendo a criança e a escola legalmente em casos sensíveis.

---

## Rodando localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Iniciar servidor de desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---


## Status

Projeto em desenvolvimento ativo. MVP com cadastros e diário funcional.
Em construção: configurações, fechamento do dia, comunicados, ocorrências e refinamento de UI.

### Demo

Acesse o app em produção: [agenda-zero-creche.vercel.app](https://agenda-zero-creche.vercel.app)

**Conta demo — responsável:**
- Telefone: `(11) 99999-0001`
- Senha: `demo1234`

A conta está vinculada a duas crianças com uma semana de registros diários preenchidos.

---

*Detalhes sobre decisões técnicas, de design, aprendizados e experiências estão sendo documentadas e publicadas no [Medium](https://medium.com/@eridecarv).*
