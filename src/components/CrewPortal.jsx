import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
    Navigation2,
    Plane,
    Calendar,
    Clock,
    MapPin,
    Users,
    Coffee,
    Search,
    ChevronRight,
    X,
    Filter,
    LayoutDashboard,
    Fingerprint,
    Info
} from 'lucide-react';

export default function CrewPortal({ requests = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'completed'

    const today = new Date().toISOString().split('T')[0];

    // Filter and sort requests
    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            req.aircraft?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.legs?.some(l => l.origin.toLowerCase().includes(searchTerm.toLowerCase()) || l.destination.toLowerCase().includes(searchTerm.toLowerCase()));

        const isApproved = req.status === 'aprovado';

        const lastLegDate = req.legs && req.legs.length > 0 ? req.legs[req.legs.length - 1].date : '';

        if (filterStatus === 'upcoming') return isApproved && lastLegDate >= today && matchesSearch;
        if (filterStatus === 'completed') return (req.status === 'concluido' || (isApproved && lastLegDate < today)) && matchesSearch;

        return (isApproved || req.status === 'concluido') && matchesSearch;
    }).sort((a, b) => {
        const dateA = a.legs?.[0]?.date || '';
        const dateB = b.legs?.[0]?.date || '';
        return dateA.localeCompare(dateB);
    });

    const getStatusInfo = (status, lastLegDate) => {
        if (status === 'concluido' || (status === 'aprovado' && lastLegDate < today)) {
            return { label: 'Concluído', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
        }
        return { label: 'Confirmado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    };

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            {/* Cockpit Header */}
            <div style={{
                marginBottom: '48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '32px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', marginBottom: '8px' }}>
                        <Navigation2 size={24} />
                        <span style={{ fontWeight: '800', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>SISTEMA DE OPERAÇÕES</span>
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: '800' }}>Cockpit Operacional</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '8px 0 0 0' }}>Painel exclusivo para tripulação e controle de voo.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="glass-morphism" style={{ padding: '12px 24px', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Voos Hoje</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {filteredRequests.filter(r => r.legs?.some(l => l.date === today)).length}
                        </div>
                    </div>
                    <div className="glass-morphism" style={{ padding: '12px 24px', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Ativos</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                            {filteredRequests.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por prefixo, rota ou cliente..."
                        className="input-field"
                        style={{ paddingLeft: '48px', height: '56px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px' }}>
                    <button
                        onClick={() => setFilterStatus('all')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: filterStatus === 'all' ? 'var(--primary)' : 'transparent',
                            color: filterStatus === 'all' ? '#000' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >Todos</button>
                    <button
                        onClick={() => setFilterStatus('upcoming')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: filterStatus === 'upcoming' ? 'var(--primary)' : 'transparent',
                            color: filterStatus === 'upcoming' ? '#000' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >Próximos</button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: filterStatus === 'completed' ? 'var(--primary)' : 'transparent',
                            color: filterStatus === 'completed' ? '#000' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >Concluídos</button>
                </div>
            </div>

            {/* Flight List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredRequests.map((req) => {
                    const lastLeg = req.legs[req.legs.length - 1];
                    const status = getStatusInfo(req.status, lastLeg.date);
                    const isToday = req.legs.some(l => l.date === today);

                    return (
                        <motion.div
                            key={req.id}
                            whileHover={{ scale: 1.005, borderColor: 'var(--primary)' }}
                            onClick={() => setSelectedFlight(req)}
                            style={{
                                position: 'relative',
                                background: 'rgba(10, 10, 12, 0.95)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                padding: '24px 32px',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* Golden Wing Decoration - Asinha */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '6px',
                                background: 'linear-gradient(180deg, var(--primary) 0%, rgba(201, 168, 106, 0.5) 100%)',
                                boxShadow: '0 0 20px rgba(201, 168, 106, 0.3)',
                                borderTopLeftRadius: '20px',
                                borderBottomLeftRadius: '20px'
                            }} />

                            {/* Header: Aircraft + Company + Timestamp */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '20px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '1.3rem',
                                            color: '#fff',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {req.aircraft?.name || 'N/A'} | CITATION CJ4
                                        </h3>
                                    </div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {req.aircraft?.type || 'RBF TAXI AÉREO'}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <h4 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '1.1rem',
                                        color: '#fff'
                                    }}>
                                        {req.name}
                                    </h4>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 16px',
                                        borderRadius: '100px',
                                        background: status.bg,
                                        color: status.color,
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {status.label}
                                    </div>
                                </div>
                            </div>

                            {/* Flight Legs */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                                {req.legs.map((leg, legIdx) => (
                                    <div key={legIdx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '12px 0'
                                    }}>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--text-muted)',
                                            fontWeight: '700',
                                            minWidth: '80px'
                                        }}>
                                            {legIdx + 1}ª ETAPA
                                        </div>

                                        <div style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <div style={{
                                                fontSize: '1.1rem',
                                                color: '#fff',
                                                minWidth: '100px'
                                            }}>
                                                {leg.origin}
                                            </div>

                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</div>

                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {leg.originCity || leg.origin}
                                            </div>

                                            <ChevronRight size={16} style={{ color: 'var(--primary)' }} />

                                            <div style={{
                                                fontSize: '1.1rem',
                                                color: '#fff',
                                                minWidth: '100px'
                                            }}>
                                                {leg.destination}
                                            </div>

                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</div>

                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {leg.destinationCity || leg.destination}
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            minWidth: '200px',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: '#fff',
                                                fontWeight: '600'
                                            }}>
                                                {formatDateTime(leg.date, leg.time)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Timestamp and Arrow */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    {req.timestamp}
                                </div>

                                <div style={{
                                    background: 'rgba(201, 168, 106, 0.1)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)'
                                }}>
                                    <ChevronRight size={18} />
                                </div>
                            </div>

                            {/* Mission Today Badge */}
                            {isToday && (
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'var(--primary)',
                                    color: '#000',
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontSize: '0.65rem',
                                    fontWeight: '900',
                                    letterSpacing: '1px',
                                    boxShadow: '0 4px 12px rgba(201, 168, 106, 0.4)'
                                }}>
                                    MISSÃO HOJE
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {filteredRequests.length === 0 && (
                    <div className="glass-morphism" style={{ padding: '100px', textAlign: 'center', borderRadius: '32px' }}>
                        <div style={{ opacity: 0.2, marginBottom: '24px' }}>
                            <LayoutDashboard size={80} style={{ margin: '0 auto' }} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Nenhum plano de voo encontrado</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Ajuste os filtros ou o termo de busca para localizar missões.</p>
                    </div>
                )}
            </div>

            {/* Read-only Detail Modal */}
            <AnimatePresence>
                {selectedFlight && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFlight(null)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.92)',
                                backdropFilter: 'blur(15px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'rgba(10, 10, 12, 0.98)',
                                border: '1px solid var(--primary)',
                                borderRadius: '32px',
                                width: '100%',
                                maxWidth: '850px',
                                maxHeight: '90vh',
                                position: 'relative',
                                overflowY: 'auto',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
                                padding: '48px'
                            }}
                        >
                            <button
                                onClick={() => setSelectedFlight(null)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={28} />
                            </button>

                            {/* Modal Header */}
                            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', marginBottom: '8px' }}>
                                        <Info size={20} />
                                        <span style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase' }}>DETALHES DA MISSÃO OPERACIONAL</span>
                                    </div>
                                    <h2 style={{ fontSize: '2.5rem', margin: 0, color: '#fff' }}>{selectedFlight.aircraft?.name}</h2>
                                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Cliente: {selectedFlight.name} • Protocolo #{selectedFlight.id}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        padding: '10px 24px',
                                        borderRadius: '100px',
                                        background: getStatusInfo(selectedFlight.status, selectedFlight.legs[selectedFlight.legs.length - 1].date).bg,
                                        color: getStatusInfo(selectedFlight.status, selectedFlight.legs[selectedFlight.legs.length - 1].date).color,
                                        fontSize: '0.85rem',
                                        marginBottom: '12px',
                                        display: 'inline-block'
                                    }}>
                                        {getStatusInfo(selectedFlight.status, selectedFlight.legs[selectedFlight.legs.length - 1].date).label.toUpperCase()}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gerado: {selectedFlight.timestamp}</div>
                                </div>
                            </div>

                            {/* Itinerary - High Tech Style */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {selectedFlight.legs.map((leg, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        padding: '32px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        fontFamily: 'monospace'
                                    }}>
                                        <div style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                            {`|> ${idx + 1}ª ETAPA <|`}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: '2px' }}>-----------------</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', fontSize: '1.1rem' }}>
                                            <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)' }}>Data e Horário:</span> <span style={{ color: '#fff' }}>{formatDateTime(leg.date, leg.time)}</span></p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                                            {/* Passageiros Section */}
                                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Users size={16} /> MANIFESTO ({leg.passengers} PAX):
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6' }}>
                                                    {Array.isArray(leg.passengerData) && leg.passengerData.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {leg.passengerData.map((p, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                                                                    <span>{i + 1}. {p.name || '---'}</span>
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.document || ''}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{leg.passengerList || 'Nenhum passageiro listado.'}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comissaria Section */}
                                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Coffee size={16} /> SERVIÇO DE BORDO:
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                                    {leg.catering || 'Catering padrão solicitado.'}
                                                </div>
                                            </div>

                                            {/* FBO Section */}
                                            <div style={{ gridColumn: 'span 2', background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MapPin size={16} /> FBO {leg.fboCity || ''}:
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', lineHeight: '1.6' }}>{leg.fboDetails || 'Informações operacionais não cadastradas.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tripulação do Voo Section */}
                            {selectedFlight.crew && selectedFlight.crew.some(c => c.name) && (
                                <div style={{
                                    marginTop: '40px',
                                    padding: '32px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Fingerprint size={16} /> TRIPULAÇÃO DO VOO
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace' }}>
                                        {selectedFlight.crew.map((member, idx) => member.name && (
                                            <div key={idx} style={{ fontSize: '1.1rem', color: '#fff' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{idx + 1} - </span>
                                                <span>{member.name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}> - </span>
                                                <span style={{ color: 'var(--primary)' }}>{member.anac || '---'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedFlight.observation && (
                                <div style={{
                                    marginTop: '40px',
                                    padding: '32px',
                                    background: 'rgba(201, 168, 106, 0.05)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(201, 168, 106, 0.1)'
                                }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>OBSERVAÇÕES OPERACIONAIS</h4>
                                    <p style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontStyle: 'italic' }}>{selectedFlight.observation}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedFlight(null)}
                                className="premium-button"
                                style={{ width: '100%', marginTop: '40px', justifyContent: 'center', padding: '20px' }}
                            >
                                FECHAR INFORMAÇÕES
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
