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
