// ==UserScript==
// @name         eproc - Exportar Log de Migração para Excel
// @namespace    https://eproc1g.tjsp.jus.br/
// @version      1.0
// @description  Adiciona botão para exportar a tabela de Log de Migração para Excel (.xlsx)
// @author       rsalvessap
// @match        https://eproc1g.tjsp.jus.br/eproc/controlador.php*
// @require      https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Executa apenas na página de Log de Migração
    const params = new URLSearchParams(window.location.search);
    if (!params.get('acao')?.includes('mig_log')) return;

    // Aguarda a tabela carregar antes de injetar o botão
    function waitForTable(callback, maxWait = 10000) {
        const interval = 300;
        let elapsed = 0;
        const timer = setInterval(() => {
            const table = document.querySelector('table.infraTable');
            if (table) {
                clearInterval(timer);
                callback(table);
            } else if (elapsed >= maxWait) {
                clearInterval(timer);
                console.warn('[Exportar Excel] Tabela não encontrada após ' + maxWait + 'ms.');
            }
            elapsed += interval;
        }, interval);
    }

    function injectButton() {
        if (document.getElementById('btnExportarExcel')) return;

        const btn = document.createElement('button');
        btn.id = 'btnExportarExcel';
        btn.type = 'button';
        btn.innerHTML = '&#128202; Exportar Excel';
        btn.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 99999;
            background-color: #1D6F42;
            color: white;
            border: 2px solid #155835;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            transition: background-color 0.2s;
        `;

        btn.onmouseover = () => btn.style.backgroundColor = '#155835';
        btn.onmouseout  = () => btn.style.backgroundColor = '#1D6F42';

        btn.addEventListener('click', function () {
            btn.disabled = true;
            btn.innerHTML = '&#9203; Exportando...';
            btn.style.backgroundColor = '#888';

            setTimeout(function () {
                try {
                    const table = document.querySelector('table.infraTable');
                    if (!table) {
                        alert('Tabela de resultados não encontrada!');
                        resetBtn();
                        return;
                    }

                    const headers = Array.from(table.querySelectorAll('th'))
                        .map(th => th.innerText.trim());
                    const numCols = headers.length;

                    if (numCols === 0) {
                        alert('Cabeçalho da tabela não encontrado!');
                        resetBtn();
                        return;
                    }

                    const rows = Array.from(table.querySelectorAll('tr'))
                        .filter(tr => tr.querySelectorAll('td').length === numCols)
                        .map(tr =>
                            Array.from(tr.querySelectorAll('td'))
                                .map(td => td.innerText.trim())
                        );

                    const data = [headers, ...rows];

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.aoa_to_sheet(data);

                    ws['!cols'] = headers.map((h, i) => {
                        const maxLen = Math.max(
                            h.length,
                            ...rows.slice(0, 300).map(r => (r[i] || '').length)
                        );
                        return { wch: Math.min(maxLen + 2, 50) };
                    });

                    ws['!freeze'] = {
                        xSplit: 0, ySplit: 1,
                        topLeftCell: 'A2',
                        activePane: 'bottomLeft'
                    };

                    XLSX.utils.book_append_sheet(wb, ws, 'Log de Migração');

                    const dataStr = new Date().toISOString().slice(0, 10);
                    const filename = `log_migracao_${dataStr}.xlsx`;

                    XLSX.writeFile(wb, filename);

                    resetBtn();
                    alert(`✅ Exportação concluída!\nArquivo: ${filename}\nTotal de registros: ${rows.length}`);

                } catch (e) {
                    alert('Erro na exportação: ' + e.message);
                    resetBtn();
                }
            }, 200);
        });

        function resetBtn() {
            btn.disabled = false;
            btn.innerHTML = '&#128202; Exportar Excel';
            btn.style.backgroundColor = '#1D6F42';
        }

        document.body.appendChild(btn);
    }

    waitForTable(injectButton);

})();
