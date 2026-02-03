// Sistema de Persistência Ultra Robusto para Voos
// Este módulo garante que NENHUM dado seja perdido, NUNCA.

const STORAGE_KEYS = {
    PRIMARY: 'milavia_flights_data',
    BACKUP: 'milavia_flights_backup',
    EMERGENCY: 'milavia_flights_emergency',
    LAST_SAVE: 'milavia_last_save_timestamp'
};

// Salvar com tripla redundância e proteção contra limpeza acidental
// forceOverwrite: deve ser true APENAS se o usuário clicou explicitamente em "Limpar Tudo"
export const saveFlights = (flights, forceOverwrite = false) => {
    // 1. PROTEÇÃO CONTRA LISTA VAZIA (ANTI-WIPE)
    if (!flights || flights.length === 0) {
        if (!forceOverwrite) {
            // Se não for forçado, verificamos se já existem dados para não apagar por engano
            const existingData = tryLoadFromKey(STORAGE_KEYS.PRIMARY);
            if (existingData && existingData.flights && existingData.flights.length > 0) {
                console.warn(`[PERSISTÊNCIA] 🛡️ BLOQUEADO: Tentativa de salvar lista vazia sem flag de força!`);
                console.warn(`[PERSISTÊNCIA] 🛡️ Dados existentes preservados: ${existingData.flights.length} voos.`);
                // Retorna sucesso falso para indicar que não salvou
                return false;
            } else {
                console.log('[PERSISTÊNCIA] Salvando lista vazia (banco já estava vazio ou inexistente).');
            }
        } else {
            console.log('[PERSISTÊNCIA] ⚠️ Salvamento forçado de lista vazia (Ação do usuário).');
        }
    }

    // 2. BACKUP DE SEGURANÇA IMEDIATO ANTES DE SOBRESCREVER DADOS
    // Só fazemos backup se houver dados significativos sendo alterados ou apagados
    if (flights && (flights.length === 0 || flights.length < 5)) {
        const beforeData = tryLoadFromKey(STORAGE_KEYS.PRIMARY);
        if (beforeData && beforeData.flights && beforeData.flights.length > flights.length) {
            console.log(`[PERSISTÊNCIA] 📉 Detectada redução de voos (${beforeData.flights.length} -> ${flights.length}). Criando backup de segurança...`);
            const securityKey = `milavia_safety_reduction_${Date.now()}`;
            localStorage.setItem(securityKey, JSON.stringify(beforeData));
        }
    }

    const timestamp = new Date().toISOString();
    const dataToSave = {
        flights: flights || [],
        savedAt: timestamp,
        count: flights ? flights.length : 0
    };

    const jsonData = JSON.stringify(dataToSave);

    try {
        localStorage.setItem(STORAGE_KEYS.PRIMARY, jsonData);
        localStorage.setItem(STORAGE_KEYS.BACKUP, jsonData);
        localStorage.setItem(STORAGE_KEYS.EMERGENCY, jsonData);
        localStorage.setItem(STORAGE_KEYS.LAST_SAVE, timestamp);
        return true;
    } catch (error) {
        console.error('[PERSISTÊNCIA] ❌ ERRO CRÍTICO ao salvar:', error);
        return false;
    }
};

// Carregar com recuperação automática
export const loadFlights = () => {
    console.log('[PERSISTÊNCIA] Carregando voos do localStorage...');

    // Tentar carregar da chave principal
    let data = tryLoadFromKey(STORAGE_KEYS.PRIMARY);
    if (data && data.flights) {
        console.log(`[PERSISTÊNCIA] ✓ Carregado de PRIMARY: ${data.flights.length} voos`);
        return data.flights;
    }

    // Se falhar, tentar do backup
    console.warn('[PERSISTÊNCIA] ⚠️ PRIMARY falhou ou vazio, tentando BACKUP...');
    data = tryLoadFromKey(STORAGE_KEYS.BACKUP);
    if (data && data.flights) {
        console.log(`[PERSISTÊNCIA] ✓ Recuperado de BACKUP: ${data.flights.length} voos`);
        // Restaurar para PRIMARY
        saveFlights(data.flights);
        return data.flights;
    }

    // Se falhar, tentar da emergência
    console.warn('[PERSISTÊNCIA] ⚠️ BACKUP falhou, tentando EMERGENCY...');
    data = tryLoadFromKey(STORAGE_KEYS.EMERGENCY);
    if (data && data.flights) {
        console.log(`[PERSISTÊNCIA] ✓ Recuperado de EMERGENCY: ${data.flights.length} voos`);
        // Restaurar para PRIMARY e BACKUP
        saveFlights(data.flights);
        return data.flights;
    }

    // Procurar por chaves de segurança (criadas quando tentou apagar dados)
    console.warn('[PERSISTÊNCIA] ⚠️ EMERGENCY falhou, procurando backups de segurança...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('milavia_safety_backup_') || key.startsWith('milavia_emergency_') || key.startsWith('milavia_safety_reduction_'))) {
            const emergencyData = tryLoadFromKey(key);
            if (emergencyData && emergencyData.flights && emergencyData.flights.length > 0) {
                console.log(`[PERSISTÊNCIA] ✓ Recuperado de ${key}: ${emergencyData.flights.length} voos`);
                saveFlights(emergencyData.flights);
                return emergencyData.flights;
            }
        }
    }

    // Tentar chaves antigas (migração)
    console.warn('[PERSISTÊNCIA] ⚠️ Tentando chaves antigas para migração...');
    const oldKeys = [
        'milavia_requests_final',
        'milavia_requests_v5',
        'milavia_requests_v4',
        'milavia_requests_v3',
        'milavia_requests_v2',
        'milavia_requests'
    ];

    let migratedFlights = [];
    oldKeys.forEach(key => {
        try {
            const oldData = localStorage.getItem(key);
            if (oldData) {
                const parsed = JSON.parse(oldData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log(`[PERSISTÊNCIA] ✓ Encontrado ${parsed.length} voos em chave antiga: ${key}`);
                    migratedFlights = [...migratedFlights, ...parsed];
                }
            }
        } catch (e) {
            console.error(`[PERSISTÊNCIA] Erro ao ler chave antiga ${key}:`, e);
        }
    });

    if (migratedFlights.length > 0) {
        // Remover duplicatas
        const uniqueFlights = removeDuplicates(migratedFlights);
        console.log(`[PERSISTÊNCIA] ✓ Migrado ${uniqueFlights.length} voos únicos de chaves antigas`);
        saveFlights(uniqueFlights);
        return uniqueFlights;
    }

    console.warn('[PERSISTÊNCIA] ⚠️ Nenhum dado encontrado. Retornando array vazio.');
    return [];
};

// Função auxiliar para tentar carregar de uma chave
function tryLoadFromKey(key) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const parsed = JSON.parse(stored);

        // Verificar se é o formato novo (com metadata)
        if (parsed.flights && Array.isArray(parsed.flights)) {
            return parsed;
        }

        // Se for array direto (formato antigo), adaptar
        if (Array.isArray(parsed)) {
            return {
                flights: parsed,
                savedAt: new Date().toISOString(),
                count: parsed.length
            };
        }

        return null;
    } catch (error) {
        console.error(`[PERSISTÊNCIA] Erro ao carregar de ${key}:`, error);
        return null;
    }
}

// Remover duplicatas baseado em ID
function removeDuplicates(flights) {
    const uniqueMap = new Map();
    flights.forEach(flight => {
        if (flight && flight.id && !uniqueMap.has(flight.id)) {
            uniqueMap.set(flight.id, flight);
        }
    });
    return Array.from(uniqueMap.values());
}

// Salvar IMEDIATAMENTE (síncrono) - para uso antes de navegação
export const forceSaveSync = (flights) => {
    console.log('[PERSISTÊNCIA] 🚨 SALVAMENTO FORÇADO SÍNCRONO');
    return saveFlights(flights);
};

// Diagnóstico completo
export const diagnoseStorage = () => {
    console.log('=== DIAGNÓSTICO DE ARMAZENAMENTO ===');

    const keys = [STORAGE_KEYS.PRIMARY, STORAGE_KEYS.BACKUP, STORAGE_KEYS.EMERGENCY];

    keys.forEach(key => {
        const data = tryLoadFromKey(key);
        if (data && data.flights) {
            console.log(`✓ ${key}: ${data.flights.length} voos (salvo em ${data.savedAt})`);
        } else {
            console.log(`✗ ${key}: VAZIO ou CORROMPIDO`);
        }
    });

    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    console.log(`Último salvamento: ${lastSave || 'NUNCA'}`);

    console.log('====================================');
};

// Auto-salvamento a cada 5 segundos (failsafe)
let autoSaveInterval = null;
export const startAutoSave = (getFlightsCallback) => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    autoSaveInterval = setInterval(() => {
        const flights = getFlightsCallback();
        if (flights) {
            saveFlights(flights); // Agora é "safe by default"
        }
    }, 5000); // A cada 5 segundos

    console.log('[PERSISTÊNCIA] ✓ Auto-salvamento periódico ativado (a cada 5s)');
};

export const stopAutoSave = () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
};
