import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, DollarSign, FileText, Download, Eye, Calendar, MapPin, Users, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function FinancialView({ requests, onBack }) {
    const [selectedClient, setSelectedClient] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

    // Grouping requests by client
    const clientsData = React.useMemo(() => {
        const clientMap = new Map();
        requests.forEach(req => {
            if (!req.name) return;
            if (!clientMap.has(req.name)) {
                clientMap.set(req.name, {
                    name: req.name,
                    total: 0,
                    withFiles: 0,
                    logs: 0,
                    expenses: 0
                });
            }
            const client = clientMap.get(req.name);
            client.total++;

            const hasLogs = req.crewLogs && req.crewLogs.length > 0;
            const hasExpenses = req.crewExpenses && req.crewExpenses.length > 0;

            if (hasLogs) client.logs += req.crewLogs.length;
            if (hasExpenses) client.expenses += req.crewExpenses.length;
            if (hasLogs || hasExpenses) client.withFiles++;
        });
        return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [requests]);

    if (selectedClient) {
        const clientFlights = requests
            .filter(r => r.name === selectedClient)
            .sort((a, b) => {
                const dateA = a.legs?.[0]?.date || '';
                const dateB = b.legs?.[0]?.date || '';
                return dateB.localeCompare(dateA); // Most recent first
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

                <h1 style={{ marginBottom: '12px' }}>Financeiro: {selectedClient}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>
                    Documentos e comprovantes anexados pela tripulação para este cliente.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {clientFlights.map((req) => {
                        const hasLogs = req.crewLogs && req.crewLogs.length > 0;
                        const hasExpenses = req.crewExpenses && req.crewExpenses.length > 0;

                        return (
                            <motion.div
                                key={req.id}
                                layout
                                className="glass-morphism"
                                style={{
                                    padding: '24px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '24px',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: req.status === 'concluido' ? 'rgba(148,163,184,0.1)' : 'rgba(16,185,129,0.1)',
                                            color: req.status === 'concluido' ? '#94a3b8' : '#10b981',
                                            textTransform: 'uppercase'
                                        }}>
                                            {req.status === 'concluido' ? 'Concluído' : 'Confirmado'}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            ID: #{req.id.toString().slice(-6)}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>
                                        {req.aircraft?.name || 'Aeronave não definida'}
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} /> {formatDate(req.legs?.[0]?.date)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} /> {req.legs?.[0]?.origin} → {req.legs?.[req.legs.length - 1]?.destination}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        disabled={!hasLogs}
                                        onClick={() => setPreviewFile({ type: 'Diário de Bordo', files: req.crewLogs })}
                                        className="premium-button"
                                        style={{
                                            background: hasLogs ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: hasLogs ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                                            color: hasLogs ? '#60a5fa' : 'rgba(255,255,255,0.2)',
                                            opacity: hasLogs ? 1 : 0.5,
                                            cursor: hasLogs ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        <FileText size={18} /> Diário {hasLogs && `(${req.crewLogs.length})`}
                                    </button>
                                    <button
                                        disabled={!hasExpenses}
                                        onClick={() => setPreviewFile({ type: 'Comprovantes de Despesas', files: req.crewExpenses })}
                                        className="premium-button"
                                        style={{
                                            background: hasExpenses ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: hasExpenses ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.05)',
                                            color: hasExpenses ? '#4ade80' : 'rgba(255,255,255,0.2)',
                                            opacity: hasExpenses ? 1 : 0.5,
                                            cursor: hasExpenses ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        <DollarSign size={18} /> Despesas {hasExpenses && `(${req.crewExpenses.length})`}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* File List Modal */}
                <AnimatePresence>
                    {previewFile && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 10000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '24px'
                        }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setPreviewFile(null)}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '600px',
                                    background: '#1a1a1a',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '32px',
                                    maxHeight: '80vh',
                                    overflowY: 'auto'
                                }}
                            >
                                <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {previewFile.type === 'Diário de Bordo' ? <FileText size={24} color="#60a5fa" /> : <DollarSign size={24} color="#4ade80" />}
                                    {previewFile.type}
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {previewFile.files.map((file, idx) => (
                                        <div key={idx} style={{
                                            padding: '16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{file.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{file.date} • {file.size}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Visualizar"
                                                >
                                                    <Eye size={18} />
                                                </a>
                                                <a
                                                    href={file.url}
                                                    download={file.name}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '8px',
                                                        background: 'var(--primary)',
                                                        color: '#000',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="premium-button"
                                    style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }}
                                >
                                    Fechar
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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

            <h1 style={{ marginBottom: '12px' }}>Financeiro & Documentação</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>
                Acesse diários de bordo e comprovantes organizados por cliente.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {clientsData.map((client) => (
                    <motion.div
                        key={client.name}
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedClient(client.name)}
                        className="glass-morphism"
                        style={{
                            padding: '24px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{client.name}</h3>
                            <ChevronRight size={20} color="var(--primary)" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '4px' }}>Diários</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{client.logs}</div>
                            </div>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#4ade80', textTransform: 'uppercase', marginBottom: '4px' }}>Despesas</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{client.expenses}</div>
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {client.total} voos totais • {client.withFiles} voos com arquivos
                        </div>
                    </motion.div>
                ))}

                {clientsData.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center', opacity: 0.5 }}>
                        <DollarSign size={48} style={{ marginBottom: '24px' }} />
                        <h3>Nenhum cliente com voos encontrado no sistema.</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
