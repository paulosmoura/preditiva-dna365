# Preditiva — gestão de notas críticas

Aplicação web criada a partir do fluxo solicitado no arquivo `PROJETO SITE - PREDITVA (Elieber) 17_09_26.pptx`, usando o projeto LAB como referência de experiência e arquitetura, sem carregar regras do domínio de óleo.

## O que está disponível

- login administrativo local com sessão assinada;
- painel de gestão limitado aos equipamentos classificados como críticos;
- filtros por Campo de ordenação, Denom.loc.instalação, Data da nota, Status usuário, Impacto e busca livre;
- indicadores, distribuição por equipamento e tabela paginada de notas abertas;
- cadastro administrativo dos equipamentos críticos, alterável a qualquer momento;
- atualização segura da base por upload de um novo `.xlsx`, com validação antes da substituição;
- camada de acesso ao Excel isolada para a futura conexão com SharePoint.

Os 15 equipamentos mostrados no PPTX são a seleção crítica inicial. Enquanto a regra funcional definitiva não for confirmada, uma nota é considerada aberta quando `Status usuário` contém o código exato `OPN`.

## Execução local

Requisitos: Node.js 20+ e pnpm.

```bash
pnpm install
pnpm setup:local
pnpm dev
```

A aplicação fica disponível em `http://127.0.0.1:3200`. O usuário e a senha administrativos são gravados em `.env.local`; esse arquivo não deve ser versionado.

Na primeira configuração, `PREDITIVA_XLSX_PATH` pode apontar para uma planilha externa. Depois do primeiro upload válido, a aplicação usa a cópia gerenciada em `.data/notas.xlsx`.

## Publicação na Vercel

A autenticação usa as variáveis `PREDITIVA_ADMIN_USER`, `PREDITIVA_ADMIN_PASSWORD` e `PREDITIVA_AUTH_SECRET`. Configure-as como variáveis sensíveis do projeto na Vercel; nenhuma credencial deve ser adicionada ao código-fonte.

O arquivo `.data/notas.xlsx` é versionado neste repositório privado e incluído no build de produção para permitir a leitura inicial na Vercel. Alterações feitas no sistema de arquivos de uma função serverless não são persistentes. Até a conexão com o SharePoint ser concluída, uma nova versão da planilha exige um commit e um novo deploy para ser permanente.

## Validação

```bash
pnpm validate
```

O comando executa lint, verificação TypeScript, testes automatizados e build de produção.

## Estrutura principal

- `src/app/dashboard`: páginas protegidas do painel;
- `src/components`: interface, filtros, tabela e telas administrativas;
- `src/lib/notes-data.ts`: leitura, validação e cache da planilha;
- `src/lib/critical-equipment-store.ts`: persistência da classificação crítica;
- `src/app/api/importar/route.ts`: importação atômica de novas planilhas;
- `src/app/api/equipamentos-criticos/route.ts`: atualização da classificação;
- `.data/notas.xlsx`: planilha base versionada no repositório privado.

## Próxima etapa: SharePoint

A integração deverá obter o arquivo autorizado no SharePoint e entregá-lo ao mesmo processo já existente de validação e troca atômica. Assim, dashboard, regras, filtros e cadastro crítico permanecem independentes da origem do arquivo.
