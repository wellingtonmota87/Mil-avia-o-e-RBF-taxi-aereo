/**
 * Utilitários de Data para o projeto Mil-avia
 * Garante padronização DD/MM/AAAA em todo o sistema
 */

/**
 * Formata uma string de data (geralmente YYYY-MM-DD ou ISO) para DD/MM/AAAA
 * @param {string|Date} date - A data a ser formatada
 * @returns {string} Data formatada ou a string original se inválida
 */
export const formatDate = (date) => {
    if (!date) return '';

    // Se for um objeto Date
    if (date instanceof Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Se for string YYYY-MM-DD
    if (typeof date === 'string' && date.includes('-') && date.length >= 10) {
        const parts = date.split('T')[0].split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
    }

    // Tentar parsear se for outro formato de string
    try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }
    } catch (e) {
        // Silencioso, retorna original
    }

    return date;
};

/**
 * Retorna o timestamp atual formatado de forma legível
 */
export const getTimestamp = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return formatDateTime(now, time);
};

/**
 * Formata data e hora juntas no padrão "DD/MM/AAAA às HH:MM"
 * @param {string|Date} date 
 * @param {string} time 
 * @returns {string}
 */
export const formatDateTime = (date, time) => {
    if (!date) return '';
    const fDate = formatDate(date);
    if (!time) return fDate;
    return `${fDate} às ${time}`;
};

/**
 * Soma dois horários no formato HH:MM
 */
export const addTimes = (time1, time2) => {
    if (!time1) return time2 || '00:00';
    if (!time2) return time1 || '00:00';

    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    let totalM = m1 + m2;
    let totalH = h1 + h2 + Math.floor(totalM / 60);
    totalM %= 60;

    // Para pouso, podemos passar das 24h se o voo for longo, 
    // mas no contexto de aviação geralmente mostramos a hora do dia (mod 24)
    totalH %= 24;

    return `${String(totalH).padStart(2, '0')}:${String(totalM).padStart(2, '0')}`;
};

/**
 * Formata data para o padrão longo: "02/Janeiro/2026"
 */
export const formatDateLong = (date) => {
    if (!date) return '';
    const d = new Date(date + 'T12:00:00'); // T12:00:00 to avoid timezone issues
    if (isNaN(d.getTime())) return date;

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};
