# eproc - Exportar Log de Migração para Excel

Userscript que adiciona um botão na página de **Log de Migração** do eProc (TJSP) para exportar a tabela de resultados diretamente para um arquivo Excel (`.xlsx`).

## Pré-requisitos

- Navegador: Google Chrome, Mozilla Firefox ou Microsoft Edge
- Extensão **Tampermonkey** instalada

## Instalação do Tampermonkey

1. Acesse a página da extensão no seu navegador:
   - [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/pt-BR/firefox/addon/tampermonkey/)
   - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
2. Clique em **Adicionar** / **Instalar**
3. Confirme a instalação quando solicitado

## Instalação do Script

1. Com o Tampermonkey instalado, clique no link abaixo:

   **[Instalar script](https://raw.githubusercontent.com/rsalvessap/extrair_relat-rio/main/eproc_exportar_log_migracao.user.js)**

2. O Tampermonkey abrirá uma tela de confirmação com o código do script
3. Clique em **Instalar**

## Como usar

1. Acesse o eProc e navegue até a página de **Log de Migração** (`controlador.php?acao=mig_log...`)
2. Aguarde a tabela de resultados carregar — o botão **Exportar Excel** aparecerá na página
3. Clique no botão **📊 Exportar Excel**
4. O arquivo `log_migracao_AAAA-MM-DD.xlsx` será baixado automaticamente com todos os registros da tabela

## Atualização

O Tampermonkey verifica atualizações automaticamente. Para forçar uma atualização manual:

1. Clique no ícone do Tampermonkey na barra do navegador
2. Acesse **Painel de controle**
3. Na aba **Instalados**, localize o script **eproc - Exportar Log de Migração para Excel**
4. Clique na aba **Configurações** do script
5. Clique em **Verificar atualizações**
