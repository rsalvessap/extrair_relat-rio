// ==UserScript==
// @name         eproc - Exportar Log de Migração para Excel
// @namespace    https://eproc1g.tjsp.jus.br/
// @version      1.1
// @description  Adiciona botão para exportar a tabela de Log de Migração para Excel (.xlsx)
// @author       rsalvessap
// @match        https://eproc1g.tjsp.jus.br/eproc/controlador.php*
// @require      https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    if (!params.get('acao')?.includes('mig_log')) return;

    // --- Estilos da barra de progresso verde ---
    const style = document.createElement('style');
    style.textContent = `
        #btnExportarExcel {
            position: relative;
            overflow: hidden;
        }
        #btnExportarExcel.carregando {
            opacity: 0.85;
            cursor: wait;
        }
        #btnExportarExcel.carregando::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background-color: #28a745;
            border-radius: 0 0 3px 3px;
            animation: progresso-carregamento 1.8s ease-in-out infinite;
        }
        @keyframes progresso-carregamento {
            0%   { width: 0; }
            50%  { width: 75%; }
            100% { width: 100%; }
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // --- Cria o botão imediatamente em estado de carregamento ---
    const btn = document.createElement('button');
    btn.id = 'btnExportarExcel';
    btn.type = 'button';
    btn.className = 'eproc-button-primary carregando';
    btn.style.marginLeft = '4px';
    btn.disabled = true;
    btn.textContent = '\u23F3 Carregando tabela\u2026';

    // --- Posiciona o botão na página ---
    function posicionarBotao() {
        // Tenta barras de comando nativas do eProc / Infra
        const barraComandos = document.querySelector('#divInfraBarraComandosSuperior')
            || document.querySelector('.infraBarraComandosSuperior');
        if (barraComandos) {
            barraComandos.appendChild(btn);
            return true;
        }

        // Tenta inserir ao lado de um botão nativo existente
        const btnNativo = document.querySelector('button[type="submit"], button[type="button"], input[type="submit"]');
        if (btnNativo && btnNativo.parentNode) {
            btnNativo.after(btn);
            return true;
        }

        // Tenta área principal de conteúdo
        const areaConteudo = document.querySelector('#divInfraAreaTelaD')
            || document.querySelector('#divInfraAreaTela')
            || document.querySelector('.infraAreaTela');
        if (areaConteudo) {
            areaConteudo.insertBefore(btn, areaConteudo.firstChild);
            return true;
        }

        return false;
    }

    // Tenta posicionar imediatamente; se não conseguir, faz polling
    if (!posicionarBotao()) {
        const timerPosicao = setInterval(() => {
            if (posicionarBotao()) clearInterval(timerPosicao);
        }, 200);

        // Fallback: após 3s, coloca no body mesmo
        setTimeout(() => {
            if (!btn.parentNode) {
                clearInterval(timerPosicao);
                document.body.appendChild(btn);
            }
        }, 3000);
    }

    // --- Aguarda a tabela carregar e ativa o botão ---
    function aguardarTabela(callback, maxWait = 15000) {
        const interval = 300;
        let elapsed = 0;
        const timer = setInterval(() => {
            const table = document.querySelector('table.infraTable');
            if (table) {
                clearInterval(timer);
                callback(table);
            } else if (elapsed >= maxWait) {
                clearInterval(timer);
                btn.textContent = '\u274C Tabela n\u00E3o encontrada';
                btn.classList.remove('carregando');
            }
            elapsed += interval;
        }, interval);
    }

    aguardarTabela(function () {
        // Transição para estado pronto
        btn.classList.remove('carregando');
        btn.disabled = false;
        btn.textContent = '\uD83D\uDCCA Exportar Excel';

        btn.addEventListener('click', function () {
            btn.disabled = true;
            btn.textContent = '\u23F3 Exportando\u2026';
            btn.classList.add('carregando');

            setTimeout(function () {
                try {
                    const table = document.querySelector('table.infraTable');
                    if (!table) {
                        alert('Tabela de resultados n\u00E3o encontrada!');
                        resetBtn();
                        return;
                    }

                    const headers = Array.from(table.querySelectorAll('th'))
                        .map(th => th.innerText.trim());
                    const numCols = headers.length;

                    if (numCols === 0) {
                        alert('Cabe\u00E7alho da tabela n\u00E3o encontrado!');
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

                    XLSX.utils.book_append_sheet(wb, ws, 'Log de Migra\u00E7\u00E3o');

                    const dataStr = new Date().toISOString().slice(0, 10);
                    const filename = `log_migracao_${dataStr}.xlsx`;

                    XLSX.writeFile(wb, filename);

                    resetBtn();
                    alert(`\u2705 Exporta\u00E7\u00E3o conclu\u00EDda!\nArquivo: ${filename}\nTotal de registros: ${rows.length}`);

                } catch (e) {
                    alert('Erro na exporta\u00E7\u00E3o: ' + e.message);
                    resetBtn();
                }
            }, 200);
        });

        function resetBtn() {
            btn.disabled = false;
            btn.textContent = '\uD83D\uDCCA Exportar Excel';
            btn.classList.remove('carregando');
        }
    });

})();
