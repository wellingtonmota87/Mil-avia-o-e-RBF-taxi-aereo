// SCRIPT DE TESTE - SISTEMA DE PERSISTÊNCIA
// Cole este código no console do navegador (F12) para testar

console.log('🧪 INICIANDO TESTE DO SISTEMA DE PERSISTÊNCIA...\n');

// Teste 1: Verificar se as chaves existem
console.log('📋 TESTE 1: Verificando chaves de armazenamento...');
const keys = ['milavia_flights_data', 'milavia_flights_backup', 'milavia_flights_emergency'];
keys.forEach(key => {
    const exists = localStorage.getItem(key) !== null;
    console.log(`${exists ? '✅' : '❌'} ${key}: ${exists ? 'EXISTE' : 'VAZIO'}`);
});
console.log('');

// Teste 2: Contar voos em cada chave
console.log('📊 TESTE 2: Contando voos em cada chave...');
keys.forEach(key => {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            const count = parsed.flights ? parsed.flights.length : 0;
            console.log(`✓ ${key}: ${count} voos`);
            if (parsed.savedAt) {
                console.log(`  └─ Salvo em: ${new Date(parsed.savedAt).toLocaleString('pt-BR')}`);
            }
        } else {
            console.log(`✗ ${key}: Sem dados`);
        }
    } catch (e) {
        console.log(`❌ ${key}: ERRO - ${e.message}`);
    }
});
console.log('');

// Teste 3: Verificar consistência entre chaves
console.log('🔍 TESTE 3: Verificando consistência...');
const counts = keys.map(key => {
    try {
        const data = localStorage.getItem(key);
        if (!data) return 0;
        const parsed = JSON.parse(data);
        return parsed.flights ? parsed.flights.length : 0;
    } catch {
        return -1;
    }
});

const allSame = counts.every(c => c === counts[0]);
if (allSame && counts[0] > 0) {
    console.log(`✅ CONSISTÊNCIA PERFEITA! Todas as 3 chaves têm ${counts[0]} voos`);
} else if (counts[0] === 0) {
    console.log('⚠️ Nenhum voo salvo ainda. Adicione alguns voos e teste novamente.');
} else {
    console.log(`⚠️ INCONSISTÊNCIA DETECTADA!`);
    console.log(`   PRIMARY: ${counts[0]} voos`);
    console.log(`   BACKUP: ${counts[1]} voos`);
    console.log(`   EMERGENCY: ${counts[2]} voos`);
}
console.log('');

// Teste 4: Simular recuperação
console.log('🔄 TESTE 4: Simulando recuperação de dados...');
let recoveredFlights = null;
for (let i = 0; i < keys.length; i++) {
    try {
        const data = localStorage.getItem(keys[i]);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.flights && parsed.flights.length > 0) {
                recoveredFlights = parsed.flights;
                console.log(`✅ Recuperado de ${keys[i]}: ${recoveredFlights.length} voos`);
                break;
            }
        }
    } catch (e) {
        console.log(`❌ Falha em ${keys[i]}: ${e.message}`);
    }
}

if (!recoveredFlights) {
    console.log('⚠️ Nenhum dado para recuperar');
} else {
    console.log(`✅ Recuperação bem-sucedida!`);
}
console.log('');

// Teste 5: Tamanho do armazenamento
console.log('💾 TESTE 5: Uso de armazenamento...');
let totalSize = 0;
keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
        const sizeKB = (data.length / 1024).toFixed(2);
        totalSize += parseFloat(sizeKB);
        console.log(`   ${key}: ${sizeKB} KB`);
    }
});
console.log(`   TOTAL: ${totalSize.toFixed(2)} KB`);
console.log('');

// Teste 6: Última sincronização
console.log('⏰ TESTE 6: Última sincronização...');
const lastSave = localStorage.getItem('milavia_last_save_timestamp');
if (lastSave) {
    const lastSaveDate = new Date(lastSave);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastSaveDate) / 1000);
    console.log(`✅ Última sincronização: ${lastSaveDate.toLocaleString('pt-BR')}`);
    console.log(`   (há ${diffSeconds} segundos)`);
} else {
    console.log('⚠️ Nenhuma sincronização registrada');
}
console.log('');

// Resumo Final
console.log('═'.repeat(50));
console.log('📊 RESUMO DO TESTE');
console.log('═'.repeat(50));

const allKeysExist = keys.every(k => localStorage.getItem(k) !== null);
const isConsistent = counts.every(c => c === counts[0]);
const hasData = counts[0] > 0;

if (allKeysExist && isConsistent && hasData) {
    console.log('✅ STATUS: SISTEMA 100% OPERACIONAL');
    console.log(`✅ ${counts[0]} voos salvos em 3 locais diferentes`);
    console.log('✅ Todos os backups estão sincronizados');
    console.log('✅ Sistema pronto para uso');
} else if (!hasData) {
    console.log('⚠️ STATUS: SISTEMA OPERACIONAL (SEM DADOS)');
    console.log('ℹ️ Adicione alguns voos e execute este teste novamente');
} else {
    console.log('⚠️ STATUS: ATENÇÃO NECESSÁRIA');
    if (!allKeysExist) console.log('⚠️ Algumas chaves de backup estão faltando');
    if (!isConsistent) console.log('⚠️ Dados inconsistentes entre backups');
    console.log('ℹ️ O sistema ainda funciona, mas recomenda-se investigação');
}

console.log('═'.repeat(50));
console.log('\n✅ TESTE CONCLUÍDO!\n');

// Função de diagnóstico
console.log('💡 DICA: Para diagnóstico avançado, use:');
console.log('   diagnoseStorage() - na aplicação React');
