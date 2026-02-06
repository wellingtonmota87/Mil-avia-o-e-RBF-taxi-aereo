import React, { useState } from 'react';
import { ArrowLeft, User, Plane, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export default function FlightsByClient({ requests, onBack, onSelectRequest }) {
    const [selectedClient, setSelectedClient] = useState(null);

    // Get unique clients with their flight counts
    const clientsData = React.useMemo(() => {
        const clientMap = new Map();

        requests.forEach(req => {
            if (!req.name) return;

            if (!clientMap.has(req.name)) {
                clientMap.set(req.name, {
                    name: req.name,
                    total: 0,
                    novo: 0,
                    aprovado: 0,
                    pendente: 0,
                    concluido: 0,
                    recusado: 0,
                    cancelamento: 0,
                    cancelado: 0
                });
            }

            const client = clientMap.get(req.name);
            client.total++;
            client[req.status] = (client[req.status] || 0) + 1;
        });

        return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [requests]);

    const getStatusInfo = (status, request = null) => {
        if (status === 'novo' && request?.oldData) {
            return { label: 'Alteração Solicitada', color: '#a855f7' };
        }
        switch (status) {
            case 'aprovado': return { label: 'Aprovado', color: '#34d399' };
            case 'pendente': return { label: 'Pendência', color: '#f87171' };
            case 'concluido': return { label: 'Concluído', color: '#60a5fa' };
            case 'recusado': return { label: 'Recusado', color: '#f87171' };
            case 'alteracao_solicitada': return { label: 'Alteração Solicitada', color: '#a855f7' };
            case 'cancelamento': return { label: 'Cancelamento Solicitada', color: '#f87171' };
            case 'cancelado': return { label: 'Voo Cancelado', color: '#94a3b8' };
            default: return { label: 'Nova Solicitação', color: '#f87171', isNew: true };
        }
    };

    if (selectedClient) {
        const clientFlights = requests.filter(r => r.name === selectedClient).sort((a, b) => {
            const getPriority = (status) => {
                if (status === 'novo' || status === 'cancelamento') return 1;
                if (status === 'pendente' || status === 'aprovado') return 2;
                if (status === 'concluido') return 3;
                if (status === 'recusado' || status === 'cancelado') return 4;
                return 99;
            };
            const pA = getPriority(a.status);
            const pB = getPriority(b.status);
            if (pA !== pB) return pA - pB;
            const dateA = a.legs?.[0]?.date || '';
            const dateB = b.legs?.[0]?.date || '';
            return dateA.localeCompare(dateB);
        });

        return (
            <div className="container" style={{ padding: '80px 0' }}>
                <button
                    onClick={() => setSelectedClient(null)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        marginBottom: '32px',
                        fontSize: '1rem',
                        fontWeight: '600'
                    }}
                >
                    <ArrowLeft size={20} /> Voltar para Clientes
                </button>

                <div style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Voos de {selectedClient}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        {clientFlights.length} {clientFlights.length === 1 ? 'voo encontrado' : 'voos encontrados'}
                    </p>
                </div>

                {clientFlights.length === 0 ? (
                    <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                        <Plane size={48} color="var(--primary)" style={{ marginBottom: '24px', margin: '0 auto 24px' }} />
                        <h3>Nenhuma solicitação de voo encontrada</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Este cliente ainda não possui voos registrados.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {clientFlights.map((req) => {
                            const statusInfo = getStatusInfo(req.status, req);
                            return (
                                <motion.div
                                    key={req.id}
                                    whileHover={{ scale: 1.01, x: 5 }}
                                    onClick={() => onSelectRequest(req)}
                                    className="glass-morphism"
                                    style={{
                                        padding: '24px 32px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderLeft: `4px solid ${statusInfo.color}`
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                                            <Plane size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                                {req.aircraft?.name}
                                            </h4>
                                            <p style={{ margin: '4px 0 6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                Voo em: {formatDateTime(req.legs?.[0]?.date, req.legs?.[0]?.time)}
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {req.legs?.map((leg, idx) => (
                                                    <p key={idx} style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                        {idx + 1} etapa | {leg.origin} → {leg.destination} - {formatDateTime(leg.date, leg.time)}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'normal',
                                            background: statusInfo.isNew ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255,255,255,0.05)',
                                            color: statusInfo.color,
                                            border: `1px solid ${statusInfo.color}`
                                        }}>
                                            {statusInfo.label.toUpperCase()}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {req.timestamp}
                                        </div>
                                        <ChevronRight size={20} color="var(--text-muted)" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '80px 0' }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginBottom: '32px',
                    fontSize: '1rem',
                    fontWeight: '600'
                }}
            >
                <ArrowLeft size={20} /> Voltar ao Painel
            </button>

            <div style={{ marginBottom: '48px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Voos por Cliente</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                    Selecione um cliente para visualizar seus voos
                </p>
            </div>

            {clientsData.length === 0 ? (
                <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                    <User size={48} color="var(--primary)" style={{ marginBottom: '24px', margin: '0 auto 24px' }} />
                    <h3>Nenhum cliente encontrado</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Não há clientes cadastrados no sistema ainda.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '24px'
                }}>
                    {clientsData.map((client) => (
                        <motion.div
                            key={client.name}
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => setSelectedClient(client.name)}
                            className="glass-morphism"
                            style={{
                                padding: '32px',
                                borderRadius: '24px',
                                cursor: 'pointer',
                                border: '2px solid transparent',
                                transition: 'border-color 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <User size={24} color="#000" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{client.name}</h3>
                                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {client.total} {client.total === 1 ? 'voo' : 'voos'}
                                    </p>
                                </div>
                                <ChevronRight size={20} color="var(--text-muted)" />
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px',
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid var(--glass-border)'
                            }}>
                                {client.novo > 0 && (
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(248, 113, 113, 0.1)',
                                        border: '1px solid #f87171',
                                        color: '#f87171',
                                        textAlign: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        {client.novo} Novo{client.novo > 1 ? 's' : ''}
                                    </div>
                                )}
                                {client.pendente > 0 && (
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(248, 113, 113, 0.1)',
                                        border: '1px solid #f87171',
                                        color: '#f87171',
                                        textAlign: 'center'
                                    }}>
                                        <AlertCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        {client.pendente} Pendente{client.pendente > 1 ? 's' : ''}
                                    </div>
                                )}
                                {client.aprovado > 0 && (
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(52, 211, 153, 0.1)',
                                        border: '1px solid #34d399',
                                        color: '#34d399',
                                        textAlign: 'center'
                                    }}>
                                        <CheckCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        {client.aprovado} Aprovado{client.aprovado > 1 ? 's' : ''}
                                    </div>
                                )}
                                {client.concluido > 0 && (
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(96, 165, 250, 0.1)',
                                        border: '1px solid #60a5fa',
                                        color: '#60a5fa',
                                        textAlign: 'center'
                                    }}>
                                        {client.concluido} Concluído{client.concluido > 1 ? 's' : ''}
                                    </div>
                                )}
                                {client.cancelado > 0 && (
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        background: 'rgba(148, 163, 184, 0.1)',
                                        border: '1px solid #94a3b8',
                                        color: '#94a3b8',
                                        textAlign: 'center'
                                    }}>
                                        {client.cancelado} Cancelado{client.cancelado > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
