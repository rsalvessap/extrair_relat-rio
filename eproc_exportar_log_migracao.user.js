// ==UserScript==
// @name         eproc - Exportar Log de Migração para Excel
// @namespace    https://eproc1g.tjsp.jus.br/
// @version      1.3
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

    // Apenas o @keyframes para a animação de progresso — nenhum seletor que toque no botão
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulso-borda-verde {
            0%, 100% { border-bottom-color: #28a745; }
            50%      { border-bottom-color: #8ae6a1; }
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // --- Cria o botão igual ao padrão do script de lotações ---
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eproc-button-primary';
    btn.style.marginLeft = '4px';

    // Estado inicial: carregando (indicador verde pulsante na borda inferior)
    btn.disabled = true;
    btn.textContent = '\u23F3 Carregando tabela\u2026';
    btn.style.borderBottom = '3px solid #28a745';
    btn.style.animation = 'pulso-borda-verde 1.5s ease-in-out infinite';

    // --- Posiciona o botão na página ---
    function posicionarBotao() {
        const barraComandos = document.querySelector('#divInfraBarraComandosSuperior')
            || document.querySelector('.infraBarraComandosSuperior');
        if (barraComandos) {
            barraComandos.appendChild(btn);
            return true;
        }

        const btnNativo = document.querySelector('button[type="submit"], button[type="button"], input[type="submit"]');
        if (btnNativo && btnNativo.parentNode) {
            btnNativo.after(btn);
            return true;
        }

        const areaConteudo = document.querySelector('#divInfraAreaTelaD')
            || document.querySelector('#divInfraAreaTela')
            || document.querySelector('.infraAreaTela');
        if (areaConteudo) {
            areaConteudo.insertBefore(btn, areaConteudo.firstChild);
            return true;
        }

        return false;
    }

    if (!posicionarBotao()) {
        const timerPosicao = setInterval(() => {
            if (posicionarBotao()) clearInterval(timerPosicao);
        }, 200);

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
                btn.style.borderBottom = '';
                btn.style.animation = '';
            }
            elapsed += interval;
        }, interval);
    }

    aguardarTabela(function () {
        // Transição para estado pronto — remove todo inline extra
        btn.disabled = false;
        btn.textContent = '\uD83D\uDCCA Exportar Excel';
        btn.style.borderBottom = '';
        btn.style.animation = '';

        btn.addEventListener('click', function () {
            btn.disabled = true;
            btn.textContent = '\u23F3 Exportando\u2026';
            btn.style.borderBottom = '3px solid #28a745';
            btn.style.animation = 'pulso-borda-verde 1.5s ease-in-out infinite';

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
            btn.style.borderBottom = '';
            btn.style.animation = '';
        }
    });

})();
