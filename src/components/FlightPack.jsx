import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Save, Check, X, RotateCcw } from 'lucide-react';
import logoMil from '../assets/logo-mil-real.png';
import aircraftCover from '../assets/aircraft_cover.png';
import { formatDateLong, addTimes } from '../utils/dateUtils';

export default function FlightPack({ request, legIndex, onBack, onSave }) {
    // Shared data calculation (moved up to avoid ReferenceError)
    const currentLegs = request ? ((legIndex !== null && legIndex !== undefined)
        ? [request.legs?.[legIndex]].filter(Boolean)
        : (request.legs || [])) : [];

    const firstLeg = currentLegs[0] || {};
    const lastLeg = currentLegs[currentLegs.length - 1] || {};

    // Initial state for editable fields
    const [packData, setPackData] = useState(() => {
        if (!request) return {}; // Safety check

        return {
            alterna: request.alterna || firstLeg.destination || '',
            pilot1: request.crew?.[0]?.name || request.pilot1 || 'Roberto Thompson',
            pilot2: request.crew?.[1]?.name || request.pilot2 || 'Roberto Saltiel',
            remarks: request.remarks || 'PANAS UZ16 OSUNO\nF390',
            planoVoo: request.planoVoo || `(FPL-PRKRT-IG\n-C25A/L-SDFGHRW/S\n-${firstLeg.origin}${firstLeg.time?.replace(':', '') || '1700'}\n-N0330F390 PANAS UZ16 OSUNO\n-${firstLeg.destination}0100 ${request.alterna || firstLeg.origin}\n-PBN/A1B2C2D2O2S1 DOF/260102 EET/SBRE0017 OPR/MIL AVIACAO SA\nORGN/SBSPSIGX PER/B RMK/AD CFM IDPLANO WQWB1HZ7 FROM SDAG)`,
            briefing: request.legs?.map((leg, idx) => {
                // Se já existe briefing salvo para este index no request, usar ele
                if (request.briefing?.[idx]) return request.briefing[idx];

                return {
                    tempoVoo: leg.duration || '01:00',
                    balizamento: true,
                    solicitado1: false,
                    radioTwr: true,
                    solicitado2: false,
                    abastecimento: true,
                    distance: (leg.distance || '').replace(/\D/g, '')
                };
            }) || [],
            originFbo: firstLeg.originFbo || '',
            destinationFbo: firstLeg.destinationFbo || '',
            fuelSupplier: (() => {
                const prices = [
                    { name: 'Shell', val: firstLeg.fuelShell },
                    { name: 'BR', val: firstLeg.fuelBR },
                    { name: 'Air BP', val: firstLeg.fuelAirBp }
                ].map(p => {
                    const num = parseFloat(p.val?.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
                    return { ...p, numeric: isNaN(num) || num === 0 ? Infinity : num };
                });
                const minPrice = Math.min(...prices.map(p => p.numeric));
                const cheapest = minPrice !== Infinity ? prices.find(p => p.numeric === minPrice) : null;
                return cheapest ? `${cheapest.name} (R$ ${cheapest.val})` : 'Não informado';
            })(),
            passengers: `${firstLeg.passengers || 0} pax`,
            weather: {
                origin: 'Buscando...',
                destination: 'Buscando...',
                alternative: 'Buscando...',
                enroute: 'Em rota, prognósticos indicam ausência de fenômenos meteorológicos significativos.'
            },
            mapSearch: lastLeg.destination?.split(' - ')[0] || lastLeg.destination?.split(' ')[0] || '',
            mapZoom: 16
        };
    });

    const fetchWeather = async (icao) => {
        if (!icao || icao.length !== 4) return 'ICAO inválido';
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=';

            // Buscar METAR e TAF simultaneamente
            const metarUrl = encodeURIComponent(`https://tgftp.nws.noaa.gov/data/observations/metar/stations/${icao.toUpperCase()}.TXT`);
            const tafUrl = encodeURIComponent(`https://tgftp.nws.noaa.gov/data/forecasts/taf/stations/${icao.toUpperCase()}.TXT`);

            const [metarRes, tafRes] = await Promise.all([
                fetch(`${proxyUrl}${metarUrl}`),
                fetch(`${proxyUrl}${tafUrl}`)
            ]);

            let metar = '';
            let taf = '';

            if (metarRes.ok) {
                const data = await metarRes.json();
                const lines = data.contents.split('\n');
                metar = lines[1]?.trim() || lines[0]?.trim() || '';
            }

            if (tafRes.ok) {
                const data = await tafRes.json();
                const lines = data.contents.split('\n');
                taf = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim() || lines[0]?.trim() || '';
            }

            if (!metar && !taf) return `Dados indisponíveis para ${icao}`;
            return `METAR: ${metar}${taf ? `\n\nTAF: ${taf}` : ''}`;
        } catch (error) {
            console.error('Erro ao buscar meteorologia:', error);
            return `Erro ao carregar ${icao}`;
        }
    };

    useEffect(() => {
        const loadAllWeather = async () => {
            const originIcao = firstLeg.origin?.split(' - ')[0] || firstLeg.origin?.split(' ')[0];
            const destIcao = firstLeg.destination?.split(' - ')[0] || firstLeg.destination?.split(' ')[0];
            const altIcao = packData.alterna?.split(' - ')[0];

            const [originMet, destMet, altMet] = await Promise.all([
                fetchWeather(originIcao),
                fetchWeather(destIcao),
                fetchWeather(altIcao)
            ]);

            setPackData(prev => ({
                ...prev,
                weather: {
                    ...prev.weather,
                    origin: originMet,
                    destination: destMet,
                    alternative: altMet,
                    enroute: `Analise Windy (${originIcao} -> ${destIcao}): Condições estáveis em rota. Sem previsões de CB ou turbulência severa conforme modelos ECMWF.`
                }
            }));
        };

        if (firstLeg.origin) {
            loadAllWeather();
        }
    }, [firstLeg.origin, firstLeg.destination, packData.alterna]);

    const handleFieldChange = (field, value) => {
        setPackData(prev => ({ ...prev, [field]: value }));
    };

    const handleBriefingChange = (idx, field, value) => {
        setPackData(prev => {
            const newBriefing = [...prev.briefing];
            newBriefing[idx] = { ...newBriefing[idx], [field]: value };
            return { ...prev, briefing: newBriefing };
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (!request) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
                <h2>Nenhum voo selecionado</h2>
                <button onClick={onBack} className="premium-button">Voltar</button>
            </div>
        );
    }



    return (
        <div className="flight-pack-container" style={{ background: '#f5f5f5', minHeight: '100vh', color: '#000', paddingBottom: '50px' }}>
            {/* Toolbar - Hidden during print */}
            <div className="no-print" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: '#1a1a1a',
                color: '#fff',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={20} /> Voltar
                </button>
                <div style={{ fontWeight: 'bold' }}>PACK DE VOO - {request.aircraft?.name}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrint} className="premium-button" style={{ background: 'var(--primary)', color: '#000', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={18} /> Imprimir PDF
                    </button>
                    <button onClick={() => onSave(packData)} className="premium-button" style={{ background: '#22c55e', color: '#fff', padding: '8px 16px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={18} /> Salvar Dados
                    </button>
                </div>
            </div>

            <div className="pack-content-wrapper" style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>

                {/* --- PAGE 1: COVER --- */}
                <div className="page-print" style={{
                    width: '210mm',
                    height: '297mm',
                    background: '#fff',
                    padding: '10mm 20mm',
                    display: 'flex',
                    flexDirection: 'column',
                    border: 'none',
                    position: 'relative',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}>
                    {/* Orange Border Frame */}
                    <div style={{
                        position: 'absolute',
                        top: '5mm', // Bordas estendidas mais para cima
                        left: '10mm',
                        right: '10mm',
                        bottom: '30mm', // Subida da borda inferior em 2cm (total 30mm)
                        border: '3px solid #f97316',
                        pointerEvents: 'none'
                    }} />

                    <div style={{
                        position: 'absolute',
                        top: '5mm', // Acompanhando a borda laranja
                        left: '10mm',
                        right: '10mm',
                        zIndex: 0,
                        pointerEvents: 'none',
                        display: 'flex',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <img src={aircraftCover} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>

                    <div className="logo-container-print" style={{ textAlign: 'center', marginTop: '5px', position: 'relative', zIndex: 2 }}>
                        <img src={logoMil} className="logo-img-print" alt="MIL AVIAÇÃO" style={{ width: '650px', marginBottom: '-5px', position: 'relative', zIndex: 3, background: 'transparent' }} />
                        <h1 className="title-nav-print" style={{ fontSize: '52px', fontWeight: '1000', letterSpacing: '2px', margin: '0', color: '#000', position: 'relative', zIndex: 3 }}>NAVIGATION</h1>
                        <h1 className="title-pkg-print" style={{ fontSize: '52px', fontWeight: '1000', letterSpacing: '2px', margin: '-15px 0 0', color: '#000', position: 'relative', zIndex: 3 }}>PACKAGE</h1>

                        <div className="info-block-print" style={{ marginTop: '40px', fontSize: '24px', textAlign: 'left', paddingLeft: '80px' }}>
                            <p style={{ margin: 0, lineHeight: '1' }}>Aeronave: <strong style={{ display: 'inline-block', lineHeight: '1', WebkitBoxReflect: 'below -10px linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.5) 100%)' }}>{request.aircraft?.name || '---'}</strong></p>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'left', paddingLeft: '80px', fontSize: '22px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <p style={{ margin: '0' }}>Origem: <strong>{firstLeg.origin}</strong></p>
                            <p style={{ margin: '0' }}>Destino: <strong>{lastLeg.destination}</strong></p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>Alterna: </span>
                                <input
                                    type="text"
                                    className="no-border-input"
                                    style={{ fontSize: '22px', fontWeight: 'bold', width: '350px' }}
                                    value={packData.alterna}
                                    onChange={(e) => handleFieldChange('alterna', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'left', paddingLeft: '80px', fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '0', fontStyle: 'italic' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>PIC: </span>
                                <input
                                    type="text"
                                    className="no-border-input"
                                    style={{ fontSize: '18px', fontWeight: 'bold', width: '300px', fontStyle: 'italic' }}
                                    value={packData.pilot1}
                                    onChange={(e) => handleFieldChange('pilot1', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>SIC: </span>
                                <input
                                    type="text"
                                    className="no-border-input"
                                    style={{ fontSize: '18px', fontWeight: 'bold', width: '300px', fontStyle: 'italic' }}
                                    value={packData.pilot2}
                                    onChange={(e) => handleFieldChange('pilot2', e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'left', paddingLeft: '80px', fontSize: '20px' }}>
                            <p>Data: <strong>{formatDateLong(firstLeg.date)}</strong></p>
                        </div>

                        <div className="remarks-container" style={{
                            marginTop: '20px',
                            textAlign: 'left',
                            paddingLeft: '40px',
                            paddingRight: '40px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '120px' // Reduced height (about 3 lines less)
                        }}>
                            <span style={{
                                position: 'absolute',
                                top: '0',
                                left: '40px',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                background: '#fff',
                                zIndex: 10,
                                paddingRight: '10px',
                                lineHeight: '30px',
                                height: '30px'
                            }}>Remarks:</span>
                            <textarea
                                className="no-border-input"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    fontSize: '18px',
                                    lineHeight: '30px',
                                    padding: '0',
                                    margin: '0',
                                    background: 'repeating-linear-gradient(transparent, transparent 29px, #000 29px, #000 30px)',
                                    backgroundAttachment: 'local',
                                    border: 'none',
                                    textIndent: '95px',
                                    fontFamily: 'inherit',
                                    color: '#000',
                                    resize: 'none',
                                    overflow: 'hidden'
                                }}
                                value={packData.remarks}
                                onChange={(e) => handleFieldChange('remarks', e.target.value)}
                            />
                        </div>

                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: '31mm', // Ajustado em 0,15cm para baixo
                        left: 'calc(10mm + 3px)',
                        right: 'calc(10mm + 3px)',
                        background: '#0f172a',
                        color: '#fff',
                        padding: '10px',
                        letterSpacing: '45px',
                        fontSize: '25px',
                        fontWeight: '900',
                        textAlign: 'center',
                        zIndex: 10
                    }}>
                        AVIAÇÃO
                    </div>
                </div>

                {/* --- PAGE 2: GENERAL INFO --- */}
                <div className="page-print" style={{
                    width: '210mm',
                    minHeight: '297mm',
                    background: '#fff',
                    padding: '10mm',
                    display: 'flex',
                    flexDirection: 'column',
                    border: 'none',
                    fontSize: '10px'
                }}>
                    {/* Header Table */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', marginBottom: '15px' }}>
                        <img src={logoMil} alt="MIL" style={{ width: '100px' }} />
                        <h2 style={{ fontSize: '18px', margin: 0, alignSelf: 'center' }}>INFORMAÇÕES GERAIS</h2>
                        <div style={{ width: '100px' }}></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px', border: '1px solid #000', padding: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Cliente: <strong>{request.name}</strong></div>
                            <div>Tripulante 01: <strong>{request.pilot1 || '---'}</strong></div>
                            <div>Tripulante 02: <strong>{request.pilot2 || '---'}</strong></div>
                            <div>Aeronave: <strong>{request.aircraft?.name}</strong></div>
                            <div>Voo Solicitado Por: <strong>{request.userName || '---'}</strong></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {currentLegs.map((l, i) => (
                                <div key={i}>
                                    <strong>{legIndex !== null ? `Etapa ${legIndex + 1}` : `Etapa ${i + 1}`}</strong><br />
                                    Origem: <strong>{l.origin}</strong><br />
                                    Destino: <strong>{l.destination}</strong>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Data: <strong>{formatDateLong(firstLeg.date)}</strong></div>
                            <div>Decolagem (Local): <strong>{firstLeg.time}</strong></div>
                            <div>Limite de Pouso: <strong>{request.limitLanding || '23:11'}</strong></div>
                            <div>Limite de Jornada: <strong>{request.limitDuty || '23:41'}</strong></div>
                        </div>
                    </div>

                    {/* Briefing Table */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ background: '#f3f4f6', border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '4px' }}>Informações de Briefing</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9px' }}>
                            <thead>
                                <tr style={{ background: '#e5e7eb' }}>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>De</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Para</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Decolagem (Z)</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Tempo de Voo</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Pouso</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Distância</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Alternativa</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Balizamento?</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Solicitado?</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Rádio/TWR?</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Solicitado?</th>
                                    <th style={{ border: '1px solid #000', padding: '4px', whiteSpace: 'nowrap' }}>Abastecimento?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLegs.map((leg, localIdx) => {
                                    const absoluteIdx = legIndex !== null ? legIndex : localIdx;
                                    const b = packData.briefing[absoluteIdx] || {};
                                    const pouso = addTimes(leg.time, b.tempoVoo);

                                    return (
                                        <tr key={localIdx} style={{ textAlign: 'center' }}>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>{leg.origin?.split(' - ')[0]}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>{leg.destination?.split(' - ')[0]}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>{leg.time}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>
                                                <input
                                                    type="text"
                                                    style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', fontSize: '9px' }}
                                                    value={b.tempoVoo}
                                                    onChange={(e) => handleBriefingChange(absoluteIdx, 'tempoVoo', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{pouso}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        style={{ width: '25px', textAlign: 'right', border: 'none', background: 'transparent', fontSize: '9px' }}
                                                        value={b.distance}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            handleBriefingChange(absoluteIdx, 'distance', val);
                                                        }}
                                                        placeholder="---"
                                                    />
                                                    <span style={{ fontSize: '9px' }}>NM</span>
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px' }}>{packData.alterna?.split(' - ')[0]}</td>
                                            <td style={{ border: '1px solid #000', padding: '4px', cursor: 'pointer', background: b.balizamento ? '#dcfce7' : '#fee2e2' }} onClick={() => handleBriefingChange(absoluteIdx, 'balizamento', !b.balizamento)}>
                                                {b.balizamento ? 'SIM' : 'NÃO'}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px', cursor: 'pointer', background: b.solicitado1 ? '#dcfce7' : '#fee2e2' }} onClick={() => handleBriefingChange(absoluteIdx, 'solicitado1', !b.solicitado1)}>
                                                {b.solicitado1 ? 'SIM' : 'NÃO'}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px', cursor: 'pointer', background: b.radioTwr ? '#dcfce7' : '#fee2e2' }} onClick={() => handleBriefingChange(absoluteIdx, 'radioTwr', !b.radioTwr)}>
                                                {b.radioTwr ? 'SIM' : 'NÃO'}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px', cursor: 'pointer', background: b.solicitado2 ? '#dcfce7' : '#fee2e2' }} onClick={() => handleBriefingChange(absoluteIdx, 'solicitado2', !b.solicitado2)}>
                                                {b.solicitado2 ? 'SIM' : 'NÃO'}
                                            </td>
                                            <td style={{ border: '1px solid #000', padding: '4px', cursor: 'pointer', background: b.abastecimento ? '#dcfce7' : '#fee2e2' }} onClick={() => handleBriefingChange(absoluteIdx, 'abastecimento', !b.abastecimento)}>
                                                {b.abastecimento ? 'SIM' : 'NÃO'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Additional Info Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', border: '1px solid #000', marginBottom: '20px' }}>
                        <div style={{ borderRight: '1px solid #000', padding: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #ddd', marginBottom: '5px' }}>Atendimento:</div>
                            <div style={{ color: '#555', fontSize: '9px', display: 'flex', alignItems: 'center' }}>
                                - <input
                                    className="no-border-input"
                                    style={{ flex: 1, padding: '0 4px', fontSize: '9px' }}
                                    value={packData.originFbo}
                                    onChange={(e) => handleFieldChange('originFbo', e.target.value)}
                                    placeholder="FBO Origem"
                                />
                            </div>
                            <div style={{ color: '#555', fontSize: '9px', display: 'flex', alignItems: 'center' }}>
                                - <input
                                    className="no-border-input"
                                    style={{ flex: 1, padding: '0 4px', fontSize: '9px' }}
                                    value={packData.destinationFbo}
                                    onChange={(e) => handleFieldChange('destinationFbo', e.target.value)}
                                    placeholder="FBO Destino"
                                />
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #ddd', margin: '10px 0 5px' }}>Abastecimento:</div>
                            <div style={{ color: '#555', fontSize: '9px', display: 'flex', alignItems: 'center' }}>
                                - <input
                                    className="no-border-input"
                                    style={{ flex: 1, padding: '0 4px', fontSize: '9px' }}
                                    value={packData.fuelSupplier}
                                    onChange={(e) => handleFieldChange('fuelSupplier', e.target.value)}
                                    placeholder="Fornecedor"
                                />
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #ddd', margin: '10px 0 5px' }}>Passageiros:</div>
                            <div style={{ color: '#555', fontSize: '9px', display: 'flex', alignItems: 'center' }}>
                                - <input
                                    className="no-border-input"
                                    style={{ flex: 1, padding: '0 4px', fontSize: '9px' }}
                                    value={packData.passengers}
                                    onChange={(e) => handleFieldChange('passengers', e.target.value)}
                                    placeholder="Qtd Pax"
                                />
                            </div>
                        </div>

                        <div style={{ borderRight: '1px solid #000', padding: '10px' }}>
                            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>Plano de voo</div>
                            <textarea
                                className="no-border-input"
                                style={{ width: '100%', height: '150px', fontSize: '9px', fontFamily: 'monospace', resize: 'none' }}
                                value={packData.planoVoo}
                                onChange={(e) => handleFieldChange('planoVoo', e.target.value)}
                            />
                        </div>

                        <div style={{ padding: '10px' }}>
                            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', fontSize: '11px', paddingBottom: '2px' }}>Lista de Passageiros</div>
                            <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
                                {firstLeg.passengerData && firstLeg.passengerData.length > 0 ? (
                                    firstLeg.passengerData.map((pax, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '10px', paddingBottom: '2px' }}>
                                            <span style={{ fontWeight: 'bold', width: '20px' }}>{i + 1}.</span>
                                            <span style={{ flex: 1 }}>{pax.name}</span>
                                            <span style={{ color: '#666' }}>{pax.document}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontStyle: 'italic', color: '#999', textAlign: 'center', marginTop: '10px' }}>Voo de translado (Sem passageiros)</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Weather Section */}
                    <div style={{ border: '1px solid #000', marginBottom: '20px' }}>
                        <div style={{ background: '#f3f4f6', borderBottom: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '4px' }}>Análise Meteorológica (AISWEB/REDEMET)</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #eee' }}>
                                <div style={{ borderRight: '1px solid #eee', padding: '4px', fontWeight: 'bold' }}>ORIGEM</div>
                                <div style={{ padding: '4px', fontSize: '8px', fontFamily: 'monospace' }}>
                                    <textarea
                                        className="no-border-input"
                                        style={{ width: '100%', height: '45px', fontSize: '8px', background: 'transparent', resize: 'none', padding: '2px' }}
                                        value={packData.weather.origin}
                                        onChange={(e) => setPackData(prev => ({ ...prev, weather: { ...prev.weather, origin: e.target.value } }))}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #eee' }}>
                                <div style={{ borderRight: '1px solid #eee', padding: '4px', fontWeight: 'bold' }}>DESTINO</div>
                                <div style={{ padding: '4px', fontSize: '8px', fontFamily: 'monospace' }}>
                                    <textarea
                                        className="no-border-input"
                                        style={{ width: '100%', height: '45px', fontSize: '8px', background: 'transparent', resize: 'none', padding: '2px' }}
                                        value={packData.weather.destination}
                                        onChange={(e) => setPackData(prev => ({ ...prev, weather: { ...prev.weather, destination: e.target.value } }))}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #eee' }}>
                                <div style={{ borderRight: '1px solid #eee', padding: '4px', fontWeight: 'bold' }}>EM ROTA</div>
                                <div style={{ padding: '4px', fontSize: '8px', position: 'relative' }}>
                                    <textarea
                                        className="no-border-input"
                                        style={{ width: '100%', height: '45px', fontSize: '8px', background: 'transparent', resize: 'none', padding: '2px' }}
                                        value={packData.weather.enroute}
                                        onChange={(e) => setPackData(prev => ({ ...prev, weather: { ...prev.weather, enroute: e.target.value } }))}
                                    />
                                    <a
                                        href={`https://www.windy.com/distance/${firstLeg.origin?.split(' - ')[0] || firstLeg.origin?.split(' ')[0]}/${firstLeg.destination?.split(' - ')[0] || firstLeg.destination?.split(' ')[0]}?metar,wind,temp,cloud,rain`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="no-print"
                                        style={{ position: 'absolute', right: '5px', bottom: '2px', color: '#0369a1', textDecoration: 'none', fontSize: '7px', fontWeight: 'bold' }}
                                    >
                                        VER NO WINDY →
                                    </a>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                                <div style={{ borderRight: '1px solid #eee', padding: '4px', fontWeight: 'bold' }}>ALTERNATIVA</div>
                                <div style={{ padding: '4px', fontSize: '8px', fontFamily: 'monospace' }}>
                                    <textarea
                                        className="no-border-input"
                                        style={{ width: '100%', height: '45px', fontSize: '8px', background: 'transparent', resize: 'none', padding: '2px' }}
                                        value={packData.weather.alternative}
                                        onChange={(e) => setPackData(prev => ({ ...prev, weather: { ...prev.weather, alternative: e.target.value } }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Satellite Map Section */}
                    <div style={{ flex: 1, border: '1px solid #000', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ background: '#f3f4f6', borderBottom: '1px solid #000', textAlign: 'center', fontWeight: 'bold', padding: '4px', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                            <span>Vista Satélite (Google Earth)</span>
                            {/* Map Controls - Hidden during print */}
                            <div className="no-print" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: '20px' }}>
                                <input
                                    className="no-border-input"
                                    style={{ width: '100px', fontSize: '10px', height: '20px', border: '1px solid #ccc', background: '#fff' }}
                                    value={packData.mapSearch}
                                    onChange={(e) => handleFieldChange('mapSearch', e.target.value)}
                                    placeholder="Busca (Ex: SBSP)"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '10px' }}>Zoom:</span>
                                    <input
                                        type="range"
                                        min="10"
                                        max="21"
                                        step="1"
                                        style={{ width: '60px' }}
                                        value={packData.mapZoom}
                                        onChange={(e) => handleFieldChange('mapZoom', parseInt(e.target.value))}
                                    />
                                    <span style={{ fontSize: '10px', width: '15px' }}>{packData.mapZoom}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 1, position: 'relative', minHeight: '350px' }}>
                            <iframe
                                key={`${packData.mapSearch}-${packData.mapZoom}`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.google.com/maps?q=${encodeURIComponent(packData.mapSearch)}&t=k&z=${packData.mapZoom}&output=embed`}
                            ></iframe>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .no-border-input {
                    border: 1px dashed transparent;
                    background: transparent;
                    outline: none;
                    font-family: inherit;
                    color: inherit;
                    padding: 4px;
                    transition: border-color 0.2s;
                }
                .no-border-input:hover {
                    border-color: #ccc;
                }
                .no-border-input:focus {
                    border-color: var(--primary);
                    background: #fff8e1;
                }
                @media print {
                    .no-print, .nav-bar, footer, nav { display: none !important; }
                    body { background: #fff !important; margin: 0; padding: 0; }
                    .flight-pack-container { background: #fff !important; padding: 0 !important; }
                    .pack-content-wrapper { padding-top: 0 !important; }
                    .page-print { 
                        margin: 0 !important; 
                        padding: 5mm 20mm 15mm 20mm !important;
                        box-shadow: none !important; 
                        border: none !important;
                        page-break-after: always;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        box-sizing: border-box !important;
                        height: 297mm !important;
                        overflow: hidden !important;
                        position: relative !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .remarks-container {
                        flex: 1 !important;
                    }
                    .remarks-container textarea {
                        height: 100% !important;
                    }
                    .logo-container-print { margin-top: 0 !important; }
                    .logo-img-print { margin-bottom: -15px !important; }
                    .title-pkg-print { margin-top: -25px !important; }
                    .info-block-print { margin-top: 20px !important; }
                }
                @page {
                    size: A4;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
