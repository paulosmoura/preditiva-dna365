# Plano de modernização do dashboard Preditiva

## 1. Objetivo

Este documento descreve as mudanças necessárias para transformar o protótipo atual em uma aplicação moderna de Engenharia de Confiabilidade e Preditiva. A análise considera:

- os requisitos apresentados em `docs/references/Site - PREDITVA - Elieber.pptx`;
- o comportamento disponível no projeto em 6 de outubro de 2026;
- a necessidade de integrar as notas industriais do SAP por meio do SharePoint;
- a separação de acesso entre técnicos e gestão;
- o registro de medições, observações e anexos por equipamento crítico.

O PowerPoint é tratado como fonte de requisitos e referência visual. As telas dos slides 11 e 12 são conceitos de interface, não especificações prontas de regras de negócio. Indicadores como Health Index, risco operacional, priorização e insights só devem entrar em produção depois que suas fórmulas e fontes forem aprovadas.

## 2. Requisitos identificados no PowerPoint

| Origem | Necessidade de negócio | Resultado esperado |
| --- | --- | --- |
| Slides 1 e 2 | Criar o site da Engenharia de Preditiva usando a experiência do projeto Luberfil como referência | Plataforma web com navegação simples, identidade visual consistente e experiência adequada aos fluxos de manutenção |
| Slide 3 | Atualizar a base de notas do SAP no SharePoint duas vezes por dia | Processo automático, rastreável e idempotente, sem depender de upload manual ou novo deploy |
| Slide 4 | Controlar o acesso pela identificação do usuário presente no campo `NOTIFICADOR` | Técnicos veem apenas as próprias notas; gestão acompanha os registros feitos pelos times |
| Slide 5 | Exibir as notas abertas do técnico e associá-las aos equipamentos críticos | Área “Minhas notas” com identificação do equipamento, prioridade e acesso ao registro técnico |
| Slide 6 | Disponibilizar quatro tipos de informação técnica | Temperatura, Batimento, Observer e Outros |
| Slide 7 | Registrar medições de temperatura | Data, equipamento, temperatura em °C, responsável, observação e anexos |
| Slide 8 | Registrar batimento do eixo | Data, equipamento, batimento radial e axial em mm, responsável, observação e anexos |
| Slide 9 | Anexar evidência do sistema Observer | Upload e visualização de imagem vinculada ao equipamento, nota e responsável |
| Slide 10 | Anexar outras evidências | Até três anexos por registro, com observação e rastreabilidade |
| Slides 11 e 12 | Criar uma visão gerencial moderna | KPIs, Pareto, criticidade, priorização, status, mapa ou hierarquia da planta e insights explicáveis |

Os nomes, e-mails e o link corporativo presentes no material não devem ser copiados para o código. O sistema deve obter usuários e permissões de uma fonte administrável, preferencialmente o Microsoft Entra ID, e guardar o endereço do SharePoint somente em configuração segura.

## 3. Situação atual do projeto

### 3.1 O que já funciona

O projeto atual já oferece uma base útil para a modernização:

- aplicação Next.js com interface responsiva e navegação lateral;
- login administrativo com sessão assinada por cookie;
- dashboard de notas abertas limitado aos equipamentos classificados como críticos;
- filtros por equipamento, local, período, status, impacto e busca livre;
- KPIs de notas abertas, equipamentos críticos, notas urgentes e locais de instalação;
- distribuição de notas por equipamento e tabela paginada;
- filtro rápido ao clicar nos cards e equipamentos dos gráficos;
- página separada com todos os campos de uma nota;
- cadastro administrativo dos equipamentos críticos;
- upload validado de arquivos `.xlsx`;
- tutorial guiado pelo botão “Como usar”;
- testes da regra de notas abertas, agregações e substituição atômica do Excel.

### 3.2 Limitações atuais

| Área | Situação atual | Mudança necessária |
| --- | --- | --- |
| Identidade | Um único usuário administrativo configurado por variáveis de ambiente | Autenticação individual e perfis de acesso |
| Autorização | Toda sessão autenticada recebe o papel `admin` | Regras de acesso aplicadas no servidor por perfil, disciplina e identidade do notificador |
| Dados | Leitura direta de `.data/notas.xlsx` | SharePoint como origem e banco de dados persistente para consultas e histórico |
| Atualização | Upload manual ou commit de uma nova planilha | Sincronização automática duas vezes ao dia, com reprocessamento manual controlado |
| Equipamentos críticos | Seleção salva em arquivo JSON local | Cadastro persistente com histórico, responsável e data da alteração |
| Área técnica | Não existe | Minhas notas, ficha do equipamento e formulários de medições |
| Anexos | Não existem | Armazenamento durável, validação, visualização, controle de acesso e auditoria |
| Relatórios | A página mostra somente os dados da nota | Relatório consolidado por equipamento e histórico técnico exportável |
| Indicadores avançados | Não existem regras para Health Index, risco ou ranking | Definir fórmulas, pesos, faixas, responsáveis e explicação do cálculo |
| Persistência em produção | Alterações no sistema de arquivos da Vercel podem desaparecer | Banco e armazenamento externos ao runtime serverless |

## 4. Experiência de usuário proposta

### 4.1 Estrutura de navegação

A navegação lateral pode ser mantida, mas deve refletir o perfil autenticado.

**Perfil técnico**

- Início / Minhas notas
- Equipamentos críticos
- Registros técnicos
- Relatórios enviados
- Como usar

**Perfil de gestão**

- Painel de gestão
- Equipamentos críticos
- Apontamentos técnicos
- Qualidade e sincronizações
- Administração
- Como usar

**Perfil administrador**

- Todas as opções de gestão
- Usuários e permissões
- Configuração do SharePoint
- Parâmetros de criticidade
- Auditoria

A interface deve ocultar opções sem permissão para reduzir ruído, mas a API também deve negar a operação. Ocultar um botão não substitui autorização no servidor.

### 4.2 Área “Minhas notas”

Ao entrar, o técnico deve visualizar somente notas abertas cujo `NOTIFICADOR` corresponda à sua identidade ou a um alias previamente cadastrado. A tela deve incluir:

- resumo de notas abertas, urgentes e vencidas;
- filtro por equipamento, local, período, impacto e status;
- lista ordenada por urgência e data;
- indicação clara de equipamento crítico;
- estado do registro técnico: não iniciado, rascunho, enviado ou revisado;
- acesso à nota completa sem sair do fluxo de trabalho;
- ação “Registrar medição” associada à nota e ao equipamento.

O vínculo entre login e `NOTIFICADOR` não deve depender apenas de comparação visual de nomes. É necessário normalizar e-mail, matrícula e aliases para evitar que variações no SAP mostrem dados à pessoa errada.

### 4.3 Ficha do equipamento crítico

Cada equipamento deve ter uma página própria com:

- identificação, descrição, local de instalação e disciplina responsável;
- notas abertas e histórico de notas;
- última medição de cada tipo;
- tendência de temperatura e batimento;
- anexos recentes;
- registros e observações dos técnicos;
- classificação de criticidade e sua justificativa;
- trilha de alterações.

As abas sugeridas pelo PPTX devem virar componentes de formulário consistentes:

1. **Temperatura**: data e hora, temperatura em °C, equipamento, responsável, observação e anexos.
2. **Batimento**: data e hora, batimento radial em mm, batimento axial em mm, equipamento, responsável, observação e anexos.
3. **Observer**: imagem principal obtida do Observer, data de referência, observação e responsável.
4. **Outros**: até três anexos, categoria, descrição, data de referência e responsável.

O sistema deve preencher automaticamente o responsável com o usuário autenticado. A seleção manual de outro responsável deve ser restrita a gestão ou administradores e registrada na auditoria.

### 4.4 Painel de gestão moderno

O painel deve preservar a clareza da interface atual e incorporar os elementos úteis dos slides 11 e 12.

**Primeira faixa**

- notas abertas;
- notas urgentes;
- equipamentos críticos com notas abertas;
- locais de instalação afetados;
- data e situação da última sincronização.

Variações percentuais devem aparecer somente quando houver uma base histórica comparável. O texto deve informar claramente o período usado na comparação.

**Análises principais**

- Pareto de notas abertas por equipamento, com barras e percentual acumulado;
- tabela de criticidade com quantidade de notas, impacto e urgência;
- lista de priorização com regra explicável;
- distribuição por disciplina e status;
- tendência temporal de abertura e encerramento;
- cobertura de registros técnicos por equipamento.

**Mapa da planta**

Um mapa visual só deve ser desenvolvido se existirem coordenadas ou uma planta oficial com pontos de equipamentos mantidos pela empresa. Sem esses dados, a alternativa correta é uma hierarquia navegável de área, local de instalação e equipamento. Uma imagem decorativa com marcadores fixos pode transmitir uma precisão que os dados não sustentam.

**Health Index, risco e insights**

- definir a fórmula e os pesos com Engenharia de Confiabilidade;
- mostrar os fatores que explicam cada pontuação;
- guardar a versão da fórmula aplicada;
- evitar textos gerados sem evidência nos dados;
- começar com regras determinísticas e auditáveis;
- permitir que a gestão acesse os registros que sustentam o insight.

### 4.5 Design visual

O conceito “command center” do slide 12 pode orientar uma visualização para telas grandes, mas não deve comprometer leitura ou acessibilidade. A recomendação é:

- manter o tema claro como padrão para uso diário;
- oferecer tema escuro opcional para sala de controle;
- usar azul como cor estrutural e reservar vermelho e âmbar para risco real;
- padronizar espaçamento, tipografia, ícones, estados e gráficos por tokens de design;
- reduzir brilho, contornos e elementos decorativos sem função;
- garantir contraste WCAG AA e navegação por teclado;
- adaptar tabelas e gráficos para notebook, tablet e celular;
- usar carregamento progressivo e estados vazios que expliquem a próxima ação.

## 5. Arquitetura de dados proposta

### 5.1 Fluxo principal

```text
SAP
  -> automação corporativa
  -> arquivo autorizado no SharePoint
  -> rotina de sincronização e validação
  -> banco de dados da aplicação
  -> APIs com autorização por usuário
  -> painéis de técnico e gestão
```

O arquivo Excel continua útil como formato de integração, mas não deve ser consultado diretamente a cada página. A sincronização deve normalizar os dados em tabelas próprias e manter metadados da origem.

### 5.2 Sincronização com SharePoint

A rotina deve:

1. autenticar no Microsoft Graph com credencial de aplicação e menor privilégio possível;
2. localizar o arquivo por site, biblioteca e caminho configurados fora do código;
3. comparar identificador de versão, data de alteração e hash antes de processar;
4. baixar o arquivo para uma área temporária;
5. validar extensão, assinatura, tamanho, aba e colunas obrigatórias;
6. importar em transação ou área de preparação;
7. aplicar atualização idempotente por identificador da nota;
8. registrar quantidade de linhas lidas, inseridas, atualizadas, rejeitadas e removidas;
9. publicar os novos dados somente após validação completa;
10. manter o último conjunto válido se a sincronização falhar.

Devem existir execução automática duas vezes ao dia, botão de reprocessamento para administradores e uma tela de histórico das sincronizações. Falhas precisam gerar alerta para o responsável pelo sistema.

### 5.3 Persistência

Um banco relacional é recomendado para consultas, histórico e autorização. Estrutura inicial:

| Entidade | Conteúdo principal |
| --- | --- |
| `users` | identidade corporativa, matrícula, e-mail normalizado, disciplina e estado |
| `roles` e `user_roles` | técnico, gestão e administrador |
| `notifier_aliases` | valores do SAP que identificam cada usuário |
| `equipment` | código, descrição, local, disciplina e situação |
| `critical_equipment` | classificação, justificativa, responsável e vigência |
| `notes` | dados normalizados da nota do SAP e referência da origem |
| `technical_records` | tipo de registro, nota, equipamento, responsável, data, observação e estado |
| `measurements` | temperatura, batimento radial e batimento axial com unidade |
| `attachments` | nome seguro, tipo, tamanho, hash, localização e autor |
| `sync_runs` | início, fim, versão do arquivo, contagens e erro |
| `audit_events` | usuário, ação, entidade, valores relevantes e data |

No TypeScript, os registros técnicos devem usar uma união discriminada pelo tipo `temperature`, `runout`, `observer` ou `other`. A validação de entrada deve usar esquemas Zod compartilhados entre formulários e APIs.

### 5.4 Anexos

Os anexos não devem ficar no sistema de arquivos da função Vercel. Usar armazenamento de objetos ou uma biblioteca controlada do SharePoint, conforme decisão de governança. Requisitos mínimos:

- formatos permitidos e tamanho máximo por arquivo;
- validação da assinatura real do arquivo, não apenas da extensão;
- nome interno aleatório e preservação do nome original como metadado;
- varredura antimalware quando disponível;
- autorização para baixar e visualizar;
- miniatura para imagens;
- limite de um anexo principal para Observer e três para Outros, conforme o PPTX;
- retenção e exclusão alinhadas à política corporativa;
- auditoria de inclusão, substituição e remoção.

## 6. Identidade, autorização e segurança

O login compartilhado atual deve ser substituído por autenticação corporativa, preferencialmente Microsoft Entra ID. A mudança permite identificar o autor real de cada medição e aplicar as regras do PPTX.

Requisitos:

- Single Sign-On e encerramento de sessão centralizado;
- autorização verificada em todas as consultas e mutações;
- técnicos limitados às notas vinculadas aos seus aliases de `NOTIFICADOR`;
- gestão com leitura dos times sob sua responsabilidade;
- administradores com acesso a parametrização, sem acesso irrestrito implícito a segredos;
- proteção contra tentativas repetidas, uploads maliciosos e chamadas sem origem válida;
- segredos apenas em variáveis protegidas da plataforma;
- logs sem senhas, tokens, arquivos ou dados pessoais desnecessários;
- política de retenção e tratamento de dados alinhada à LGPD e às regras da empresa.

O repositório Git deve voltar a armazenar apenas código, documentação, schemas e dados de demonstração quando a integração estiver pronta. A planilha real versionada atualmente é uma solução transitória; novas versões devem vir do SharePoint para evitar cópias permanentes no histórico do Git.

## 7. Mudanças no código

### 7.1 Refatorações

- substituir a leitura direta em `src/lib/notes-data.ts` por uma interface de repositório;
- manter um adaptador de Excel somente na camada de sincronização;
- migrar `src/lib/critical-equipment-store.ts` do arquivo JSON para o banco;
- substituir o papel fixo em `src/lib/session.ts` por identidade e permissões reais;
- mover agregações grandes para consultas no servidor;
- persistir filtros relevantes na URL para permitir compartilhamento e retorno à mesma visão;
- manter o componente cliente apenas para interação, evitando enviar conjuntos completos e crescentes ao navegador.

### 7.2 Novos módulos sugeridos

```text
src/lib/auth/
src/lib/db/
src/lib/sharepoint/
src/lib/repositories/
src/lib/measurements/
src/lib/attachments/
src/lib/audit/
src/app/dashboard/minhas-notas/
src/app/dashboard/equipamentos/[equipmentId]/
src/app/dashboard/registros/[recordId]/
src/app/dashboard/sincronizacoes/
src/app/dashboard/administracao/usuarios/
src/app/api/sync/sharepoint/
src/app/api/technical-records/
src/app/api/attachments/
```

### 7.3 Relatórios

O relatório de equipamento deve reunir identificação, notas relacionadas, medições em ordem cronológica, gráficos, observações, anexos e responsáveis. O sistema deve gerar uma versão para leitura na tela e uma exportação imutável, preferencialmente PDF, com data, versão e identificador do relatório.

## 8. Qualidade, desempenho e operação

- testes unitários para normalização do `NOTIFICADOR`, cálculos e regras de acesso;
- testes de integração para sincronização, transações e persistência;
- testes de autorização garantindo isolamento entre técnicos;
- testes de upload para formatos, tamanho, conteúdo inválido e limites de anexos;
- testes ponta a ponta para login, minhas notas, medição, envio e visão de gestão;
- paginação e filtros no servidor para volumes maiores;
- índices de banco em nota, equipamento, notificador, status e datas;
- métricas de duração da sincronização, registros processados, falhas e latência das páginas;
- alertas para sincronização atrasada, arquivo inválido e aumento de erros;
- backup, recuperação e plano de reversão antes da entrada em produção.

## 9. Sequência recomendada de implementação

### Fase 0 — decisões funcionais

- validar perfis e responsáveis;
- confirmar como `NOTIFICADOR` identifica cada técnico;
- aprovar regra de nota aberta e nota urgente;
- definir ciclo de vida do registro técnico;
- definir fórmulas de criticidade, prioridade, Health Index e risco;
- decidir armazenamento dos anexos e responsável pela automação SAP/SharePoint.

### Fase 1 — fundação segura

- banco de dados e migrações;
- autenticação corporativa;
- usuários, aliases e autorização;
- sincronização do SharePoint com histórico de execução;
- migração do cadastro de equipamentos críticos.

### Fase 2 — área do técnico

- Minhas notas;
- ficha do equipamento;
- formulários de Temperatura e Batimento;
- Observer e Outros com anexos;
- rascunho, envio, histórico e auditoria.

### Fase 3 — gestão moderna

- KPIs com período comparável;
- Pareto e tendência temporal;
- criticidade e priorização explicáveis;
- acompanhamento dos registros técnicos;
- insights baseados em regras validadas;
- mapa real ou hierarquia de instalações.

### Fase 4 — produção

- relatórios e exportação;
- acessibilidade e responsividade completas;
- testes de carga e segurança;
- alertas, backup e recuperação;
- treinamento, tutorial revisado e documentação operacional.

## 10. Critérios de aceite da versão moderna

1. Cada usuário entra com identidade corporativa individual.
2. Um técnico não consegue consultar notas ou anexos de outro técnico sem permissão explícita.
3. A base do SharePoint sincroniza duas vezes ao dia e expõe o resultado de cada execução.
4. Uma falha de importação mantém a última base válida disponível.
5. Gestão identifica quem registrou cada medição, quando e para qual nota e equipamento.
6. Temperatura e batimento aceitam somente unidades e valores válidos definidos pelo negócio.
7. Observer e Outros respeitam limites de anexos, formatos e autorização.
8. O relatório do equipamento apresenta histórico, observações e evidências com rastreabilidade.
9. KPIs e rankings mostram período, fonte e regra de cálculo.
10. O dashboard funciona por teclado, possui contraste adequado e se adapta aos tamanhos de tela suportados.
11. Toda alteração administrativa relevante gera evento de auditoria.
12. Código, dados operacionais e segredos permanecem separados nos ambientes de desenvolvimento e produção.

## 11. Decisões pendentes

Antes de iniciar a implementação, o responsável do produto deve responder:

- O acesso técnico será por e-mail, matrícula ou ambos?
- Um técnico pode visualizar notas de colegas da mesma disciplina?
- A gestão enxerga todas as disciplinas ou apenas equipes atribuídas?
- Qual campo e combinação de códigos determinam urgência?
- Quais limites válidos e faixas de alerta existem para temperatura e batimento?
- O equipamento possui coordenadas confiáveis para um mapa?
- Onde os anexos devem residir e por quanto tempo?
- Quem pode corrigir ou excluir um registro enviado?
- Qual evento fecha ou revisa um apontamento técnico?
- Como o sistema deve agir quando uma nota muda de notificador no SAP?
- Qual processo gera a planilha do SAP e quem recebe alertas quando ele falha?
- Quais indicadores dos slides 11 e 12 têm regra já aprovada?

Essas respostas devem ser registradas como regras funcionais antes do desenvolvimento das telas correspondentes.
