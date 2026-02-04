/**
 * Utilitários para decodificação de METAR e TAF
 * Adaptado para as necessidades da Mil Aviação
 */

export const decodeMetar = (metar) => {
    if (!metar || typeof metar !== 'string') return "Dados inválidos";

    // Limpeza inicial: remover prefixos comuns e trimar
    let cleanMetar = metar.replace(/^METAR |^SPECI /, '').trim();
    if (cleanMetar.endsWith('=')) cleanMetar = cleanMetar.slice(0, -1);

    const parts = cleanMetar.split(/\s+/);
    if (parts.length < 2) return metar;

    let decoded = "";

    // Identificador e Horário (Procuro por padrao de 6 digitos + Z em qualquer parte do início)
    const station = parts[0];
    const timeIndex = parts.findIndex(p => /\d{6}Z/.test(p));

    if (timeIndex !== -1) {
        const timePart = parts[timeIndex];
        const day = timePart.substring(0, 2);
        const hour = timePart.substring(2, 4);
        const min = timePart.substring(4, 6);
        decoded += `${station} (${day} às ${hour}:${min}Z): `;
    } else {
        decoded += `${station}: `;
    }

    // Vento (DDDFFKT ou DDDFFGFFKT)
    const windIndex = parts.findIndex(p => /(\d{3}|VRB)\d{2,3}(G\d{2,3})?(KT|MPS|KMH)/.test(p));
    if (windIndex !== -1) {
        const windPart = parts[windIndex];
        const dir = windPart.substring(0, 3);
        const speedMatch = windPart.match(/\d{2,3}/);
        const speed = speedMatch ? speedMatch[0] : '??';
        const unit = windPart.includes('KT') ? 'kt' : windPart.includes('MPS') ? 'mps' : 'km/h';
        const gust = windPart.includes('G') ? ` com rajadas de ${windPart.split('G')[1].replace(/\D/g, '')}${unit}` : '';

        if (dir === 'VRB') {
            decoded += `Vento variável com ${speed}${unit}${gust}. `;
        } else if (dir === '000' && speed === '00') {
            decoded += `Vento calmo. `;
        } else {
            decoded += `Vento de ${dir}° com ${speed}${unit}${gust}. `;
        }
    }

    // Visibilidade (4 dígitos ou CAVOK)
    if (parts.find(p => p === 'CAVOK')) {
        decoded += `Céu claro e visibilidade ok (CAVOK). `;
    } else {
        const visPart = parts.find(p => /^\d{4}$/.test(p));
        if (visPart) {
            const vis = parseInt(visPart);
            if (vis === 9999) {
                decoded += `Visibilidade maior que 10km. `;
            } else {
                decoded += `Visibilidade de ${vis}m. `;
            }
        }
    }

    // Fenômenos
    const weatherCodes = {
        'RA': 'Chuva', 'DZ': 'Chuvisco', 'SN': 'Neve', 'SG': 'Neve granular', 'PL': 'Gelo granulado',
        'IC': 'Cristais de gelo', 'GR': 'Granizo', 'GS': 'Granizo pequeno', 'FG': 'Nevoeiro',
        'BR': 'Névoa úmida', 'HZ': 'Névoa seca', 'FU': 'Fumaça', 'VA': 'Cinzas vulcânicas',
        'DU': 'Poeira', 'SA': 'Areia', 'TS': 'Trovoada', 'SH': 'Pancadas', 'FZ': 'Congelante',
        'VC': 'Nas vizinhanças', 'RE': 'Recente', 'DS': 'Tempestade de poeira', 'SS': 'Tempestade de areia'
    };

    // Regex para pegar fenômenos (ex: +TSRA, -DZ, FG)
    const weatherPart = parts.find(p => p.length >= 2 && /^(\+|-|VC)?(TS|SH|FZ|DZ|RA|SN|SG|PL|IC|GR|GS|FG|BR|HZ|FU|VA|DU|SA|DS|SS)+$/.test(p));
    if (weatherPart) {
        let weatherDesc = "";
        if (weatherPart.startsWith('+')) weatherDesc = "Forte ";
        if (weatherPart.startsWith('-')) weatherDesc = "Leve ";

        const core = weatherPart.replace(/^(\+|-|VC)/, '');
        for (let i = 0; i < core.length; i += 2) {
            const code = core.substring(i, i + 2);
            if (weatherCodes[code]) {
                weatherDesc += (weatherDesc && !weatherDesc.endsWith(' ') ? " de " : "") + weatherCodes[code];
            }
        }
        decoded += `${weatherDesc.trim()}. `;
    }

    // Nuvens
    const cloudCodes = { 'FEW': 'Poucas nuvens', 'SCT': 'Nuvens esparsas', 'BKN': 'Nublado', 'OVC': 'Encoberto', 'SKC': 'Céu limpo', 'CLR': 'Céu limpo' };
    const cloudParts = parts.filter(p => /^(FEW|SCT|BKN|OVC|VV)\d{3}(CB|TCU)?$/.test(p));
    if (cloudParts.length > 0) {
        const clouds = cloudParts.map(p => {
            const type = cloudCodes[p.substring(0, 3)] || 'Nuvens';
            const height = parseInt(p.substring(3, 6)) * 100;
            const extra = p.endsWith('CB') ? ' (Cumulonimbus)' : p.endsWith('TCU') ? ' (Torre de Cumulus)' : '';
            return `${type} a ${height} pés${extra}`;
        });
        decoded += `${clouds.join(', ')}. `;
    }

    // Temperatura e Ponto de Orvalho (XX/XX ou MXX/MXX)
    const tempPart = parts.find(p => /^(M?\d{2})\/(M?\d{2})$/.test(p));
    if (tempPart) {
        const [temp, dp] = tempPart.split('/').map(t => t.replace('M', '-'));
        decoded += `Temp: ${temp}°C / DP: ${dp}°C. `;
    }

    // Ajuste de Altímetro (QXXXX)
    const qnhPart = parts.find(p => /^Q\d{4}$/.test(p));
    if (qnhPart) {
        const qnh = qnhPart.substring(1);
        decoded += `QNH: ${qnh}hPa. `;
    }

    // Fallback se não conseguiu decodificar quase nada além do nome
    const minLength = station.length + 5;
    return decoded.length > minLength ? decoded.trim() : metar;
};

export const decodeTaf = (taf) => {
    if (!taf || typeof taf !== 'string') return "Dados inválidos";

    // TAF pode conter várias linhas e grupos de mudança
    const cleanTaf = taf.replace(/^TAF |^AMD |^COR /, '').trim();
    const station = cleanTaf.split(/\s+/)[0];

    // Quebrar em grupos principais
    const lines = cleanTaf.replace(/BECMG|TEMPO|FM|PROB\d{2}/g, '\n$&').split('\n');
    const base = lines[0];
    const decodedBase = decodeMetar(base);

    let result = `[PREVISÃO] ${decodedBase}\n`;

    if (lines.length > 1) {
        result += "Evolução:\n";
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.startsWith('BECMG')) {
                result += `- Gradual: ${decodeMetar(station + ' ' + line.substring(6))}\n`;
            } else if (line.startsWith('TEMPO')) {
                result += `- Temporário: ${decodeMetar(station + ' ' + line.substring(6))}\n`;
            } else if (line.startsWith('FM')) {
                result += `- A partir de ${line.substring(2, 6)}: ${decodeMetar(station + ' ' + line.substring(7))}\n`;
            } else {
                result += `- ${line}\n`;
            }
        }
    }

    return result.trim();
};

/**
 * Converte horário de Brasília (UTC-3) para UTC
 */
export const brtToUtc = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    try {
        // dateStr: YYYY-MM-DD, timeStr: HH:MM
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, min] = timeStr.split(':').map(Number);

        const date = new Date(year, month - 1, day, hour, min);
        if (isNaN(date.getTime())) return null;

        // Adiciona 3 horas para converter de BRT (UTC-3) para UTC
        date.setHours(date.getHours() + 3);

        return {
            day: String(date.getDate()).padStart(2, '0'),
            hour: String(date.getUTCHours()).padStart(2, '0'),
            min: String(date.getUTCMinutes()).padStart(2, '0'),
            full: date.toISOString().replace(/[-:T]/g, '').substring(0, 12) + 'Z'
        };
    } catch (e) {
        return null;
    }
};
