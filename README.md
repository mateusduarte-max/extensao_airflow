# Airflow Task Log Viewer Chrome Extension

## Visão Geral

Esta é uma extensão para o Google Chrome que aprimora a interface do Apache Airflow. Ao passar o mouse sobre uma tarefa que falhou na visualização de DAGs (Grid View), um tooltip/pop-up será exibido instantaneamente, mostrando os logs de erro relevantes para aquela tarefa. Para tarefas Spark/Kubernetes, ele fornecerá o comando `gsutil cat` para acessar os logs detalhados da aplicação diretamente no seu terminal.

## Funcionalidades

*   **Visualização Rápida de Logs:** Exibe logs de erro em um tooltip ao passar o mouse sobre tarefas falhas.
*   **Posicionamento Inteligente:** O pop-up se ajusta automaticamente para permanecer totalmente visível na tela, mesmo para tarefas localizadas nas bordas da página.
*   **Compatibilidade com Spark/Kubernetes:** Para tarefas que geram logs externos (ex: GCS para Spark no Composer), a extensão analisa o log do Airflow e extrai o caminho `gs://...` para fornecer o comando `gsutil cat` para acesso direto ao log da aplicação.
*   **Suporte a Múltiplos Ambientes:** Configurado para funcionar em diversas instâncias do Airflow simultaneamente.
*   **Detecção Robusta de Elementos:** Funciona mesmo em interfaces complexas que utilizam Shadow DOM.

## Como Funciona

A extensão opera com dois scripts principais que trabalham em conjunto:

*   **`content.js`:** Injetado nas páginas do Airflow, ele monitora o DOM (incluindo Shadow DOM) para identificar os quadrados das tarefas. Ao passar o mouse sobre uma tarefa, ele extrai informações como `dag_id`, `dag_run_id` e `task_id` da página e as envia para o `background.js`.
*   **`background.js`:** Recebe os IDs do `content.js`, faz uma chamada à API REST do Airflow para obter o status da tarefa. Se a tarefa falhou, busca o log detalhado. Em seguida, analisa este log para encontrar um padrão de caminho `gs://...` (indicando um log de aplicação Spark/Kubernetes). Se encontrado, ele formata o resultado como um comando `gsutil cat`; caso contrário, retorna o log original do Airflow. O resultado é então enviado de volta ao `content.js`.

## Instalação

Para instalar e usar esta extensão no Chrome:

1.  Baixe ou clone este repositório para o seu computador.
2.  Abra o Google Chrome e navegue até `chrome://extensions`.
3.  No canto superior direito, ative o **"Developer mode"** (Modo de desenvolvedor).
4.  Clique no botão **"Load unpacked"** (Carregar sem pacote).
5.  Navegue até o diretório do seu projeto e selecione a pasta **`chrome-extension`** (que contém o arquivo `manifest.json`).
6.  A extensão "Airflow Task Log Viewer" deve aparecer na sua lista de extensões.

## Configuração (URLs Suportadas)

A extensão está configurada para funcionar automaticamente nas seguintes URLs do Airflow:

*   `host do airflow`

Para adicionar mais URLs ou modificar as existentes, edite o arquivo `chrome-extension/manifest.json` nas seções `host_permissions` e `content_scripts.matches`. Lembre-se de recarregar a extensão em `chrome://extensions` e também a página do Airflow após qualquer alteração no `manifest.json`.

## Tecnologias Utilizadas

*   HTML, CSS, JavaScript
*   Chrome Extension APIs (Manifest V3)
*   API REST do Apache Airflow

## Resolução de Problemas Comuns

*   **Extensão não carrega / Erro no `manifest.json`:** Certifique-se de que está selecionando a pasta **`chrome-extension`** ao clicar em "Carregar sem pacote".
*   **Extensão não funciona após atualização/edição:** Após fazer qualquer alteração nos arquivos da extensão ou recarregar a extensão em `chrome://extensions`, **sempre recarregue a página do Airflow** (F5 ou Ctrl+R) para que o novo código seja injetado.
*   **Problemas com ícones:** Atualmente, a extensão não tem ícones configurados no `manifest.json` para evitar erros de carregamento. Se desejar adicionar ícones, coloque arquivos PNG de 16x16, 48x48 e 128x128 pixels na pasta `chrome-extension/icons/` (nomeados `icon16.png`, `icon48.png`, `icon128.png`) e adicione as seções `icons` e `action.default_icon` ao `manifest.json`.

## Próximos Passos e Melhorias Futuras

*   Implementação de testes unitários e de integração.
*   Otimizações de performance.
*   Revisão de segurança.
*   Adicionar opções de configuração para o usuário (ex: tempo do tooltip, cores, etc.).
*   Suporte a mais tipos de logs.
