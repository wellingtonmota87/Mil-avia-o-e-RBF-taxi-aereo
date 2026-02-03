// Utilitário de diagnóstico para LocalStorage (Atualizado v2)
// Cole este código no console do navegador para diagnosticar problemas

function diagnosticarLocalStorage() {
    console.log('=== DIAGNÓSTICO DE LOCALSTORAGE (v2) ===\n');

    const STORAGE_KEYS = {
        PRIMARY: 'milavia_flights_data',
        BACKUP: 'milavia_flights_backup',
        EMERGENCY: 'milavia_flights_emergency',
        LAST_SAVE: 'milavia_last_save_timestamp'
    };

    // Verificar Chaves Principais
    console.log('--- ARMAZENAMENTO ATUAL ---');
    Object.entries(STORAGE_KEYS).forEach(([nome, chave]) => {
        const dados = localStorage.getItem(chave);
        if (dados) {
            if (nome === 'LAST_SAVE') {
                console.log(`✓ ${nome}: ${dados}`);
                return;
            }
            try {
                const parsed = JSON.parse(dados);
                if (parsed.flights && Array.isArray(parsed.flights)) {
                    console.log(`✓ ${nome}: ${parsed.flights.length} voos (Salvo em: ${parsed.savedAt})`);
                } else if (Array.isArray(parsed)) {
                    console.log(`✓ ${nome} (Antigo): ${parsed.length} voos`);
                } else {
                    console.log(`⚠ ${nome}: Formato desconhecido`);
                }
            } catch (e) {
                console.log(`✗ ${nome}: Erro ao ler JSON`);
            }
        } else {
            console.log(`- ${nome}: Vazio`);
        }
    });

    console.log('\n--- BACKUPS DE SEGURANÇA ---');
    let encontrouBackup = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('milavia_safety_backup_')) {
            encontrouBackup = true;
            const dados = localStorage.getItem(key);
            try {
                const parsed = JSON.parse(dados);
                console.log(`🛡️ ${key}: ${parsed.flights?.length || 0} voos`);
            } catch (e) {
                console.log(`🛡️ ${key}: (Erro ao ler)`);
            }
        }
    }
    if (!encontrouBackup) console.log('Nenhum backup de emergência encontrado (isso é bom se tudo estiver funcionando).');

    // Verificar chaves antigas
    console.log('\n--- CHAVES ANTIGAS (MIGRAÇÃO) ---');
    const chavesRequests = [
        'milavia_requests_final',
        'milavia_requests_v5',
        'milavia_requests_v4',
        'milavia_requests_v3',
        'milavia_requests_v2',
        'milavia_requests'
    ];

    chavesRequests.forEach(chave => {
        const dados = localStorage.getItem(chave);
        if (dados) {
            console.log(`ℹ️ ${chave}: Dados encontrados (podem ser migrados)`);
        }
    });

    console.log('\n=== FIM DO DIAGNÓSTICO ===');
}

// Executar automaticamente
diagnosticarLocalStorage();

// Disponibilizar globalmente
window.diagnosticarLocalStorage = diagnosticarLocalStorage;
console.log('\n✓ Função diagnosticarLocalStorage() atualizada. Execute para verificar.');
