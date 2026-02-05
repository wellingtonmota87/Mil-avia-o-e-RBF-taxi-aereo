import React from 'react';
import { ListChecks, Users, ArrowRight, Plane, UserCog, Fingerprint, Trash2, Clock, Download, Upload, Database, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import logoRbf from '../assets/logo-rbf.png';
import logoMil from '../assets/logo-mil-real.png';
import { exportToJSON, importFromJSON } from '../utils/flightPersistence';

export default function CoordinatorHome({ requests, onNavigate, onRequestsImported }) {
    const pendingCount = requests.filter(r => r.status === 'novo').length;
    const uniqueClients = [...new Set(requests.map(r => r.name))].filter(Boolean);

    // Get requesters count
    const getRequestersData = () => {
        const stored = localStorage.getItem('requesters');
        if (!stored) return { total: 0, pending: 0 };
        const requesters = JSON.parse(stored);
        return {
            total: requesters.length,
            pending: requesters.filter(r => r.status === 'pending').length
        };
    };
    const requestersData = getRequestersData();

    const getCrewData = () => {
        const stored = localStorage.getItem('crew_members');
        if (!stored) return { total: 0 };
        const crew = JSON.parse(stored);
        return { total: crew.length };
    };
    const crewData = getCrewData();

    return (
        <div className="container" style={{ padding: '80px 0' }}>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(52, 211, 153, 0.05) 0%, transparent 40%)',
                zIndex: -1,
                pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '60px' }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '32px',
                    marginBottom: '32px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '24px 48px',
                    borderRadius: '40px',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {/* MIL Aviação Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '120px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logoMil} alt="MIL Aviação" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ color: '#fff', fontSize: '1.2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>MIL Aviação</span>
                    </div>

                    <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent)' }}></div>

                    {/* RBF Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '120px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logoRbf} alt="RBF Táxi Aéreo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ color: '#fff', fontSize: '1.2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>RBF Táxi Aéreo</span>
                    </div>
                </div>

                <h1 style={{
                    fontSize: '3.5rem',
                    marginBottom: '16px',
                    background: 'linear-gradient(to bottom, #fff 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Painel de Coordenação <span style={{ fontSize: '1rem', verticalAlign: 'middle', opacity: 0.5, WebkitTextFillColor: 'initial', color: 'rgba(255,255,255,0.3)' }}>v2.2.4</span></h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
                    Escolha a visualização desejada para gerenciar os voos da frota.
                </p>
            </motion.div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {/* Calendário de Voo */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#34d399',
                        boxShadow: '0 0 30px rgba(52, 211, 153, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('flight-panel')}
                    className="glass-morphism"
                    style={{
                        padding: '32px 24px',
                        borderRadius: '32px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(52, 211, 153, 0.2)'
                    }}>
                        <ListChecks size={40} />
                    </div>
                    <h2 style={{ marginBottom: '16px', fontSize: '1.6rem' }}>Controle de Solicitação de Voo</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Visualize e gerencie todas as solicitações de voo da frota em uma única tela completa.
                    </p>
                    {pendingCount > 0 && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '2px solid #ef4444',
                            color: '#fff',
                            padding: '8px 20px',
                            borderRadius: '24px',
                            fontSize: '0.9rem',
                            marginBottom: '20px',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                            animation: 'pulse-alert 2s infinite',
                            letterSpacing: '0.5px'
                        }}>
                            <Clock size={18} /> {pendingCount} {pendingCount === 1 ? 'NOVA SOLICITAÇÃO' : 'NOVAS SOLICITAÇÕES'}
                        </div>
                    )}
                    <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem', marginTop: '16px' }}>
                        Acessar Painel <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Voos por Cliente */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#fbbf24',
                        boxShadow: '0 0 30px rgba(251, 191, 36, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('by-client')}
                    className="glass-morphism"
                    style={{
                        padding: '32px 24px',
                        borderRadius: '32px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(251, 191, 36, 0.2)'
                    }}>
                        <Users size={40} />
                    </div>
                    <h2 style={{ marginBottom: '16px', fontSize: '2rem' }}>Voos por Cliente</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Filtre e visualize voos específicos de cada cliente cadastrado no sistema.
                    </p>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        color: '#fbbf24',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}>
                        {uniqueClients.length} {uniqueClients.length === 1 ? 'cliente' : 'clientes'}
                    </div>
                    <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem', marginTop: '16px' }}>
                        Ver Clientes <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Gerenciar Solicitantes */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#a855f7',
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('manage-requesters')}
                    className="glass-morphism"
                    style={{
                        padding: '32px 24px',
                        borderRadius: '32px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#fff',
                        boxShadow: '0 8px 20px rgba(168, 85, 247, 0.2)'
                    }}>
                        <UserCog size={40} />
                    </div>
                    <h2 style={{ marginBottom: '16px', fontSize: '2rem' }}>Gerenciar Solicitantes</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Cadastre e gerencie quem pode fazer solicitações de voo no sistema.
                    </p>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        color: '#a855f7',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}>
                        {requestersData.total} {requestersData.total === 1 ? 'solicitante' : 'solicitantes'}
                        {requestersData.pending > 0 && ` • ${requestersData.pending} ${requestersData.pending === 1 ? 'pendente' : 'pendentes'}`}
                    </div>
                    <div style={{ color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem', marginTop: '16px' }}>
                        Gerenciar <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Gerenciar Tripulação */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: 'var(--primary)',
                        boxShadow: '0 0 30px rgba(201, 168, 106, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('manage-crew')}
                    className="glass-morphism"
                    style={{
                        padding: '32px 24px',
                        borderRadius: '32px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #c9a86a 0%, #b08d4a 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(201, 168, 106, 0.2)'
                    }}>
                        <Fingerprint size={40} />
                    </div>
                    <h2 style={{ marginBottom: '16px', fontSize: '2rem' }}>Gerenciar Tripulação</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Cadastre e gerencie os tripulantes (Pilotos e Co-pilotos) da frota.
                    </p>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(201, 168, 106, 0.1)',
                        border: '1px solid rgba(201, 168, 106, 0.3)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}>
                        {crewData.total} {crewData.total === 1 ? 'tripulante' : 'tripulantes'}
                    </div>
                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem', marginTop: '16px' }}>
                        Gerenciar <ArrowRight size={18} />
                    </div>
                </motion.div>
            </div>

            {/* Sistema de Backup e Sincronização */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    marginTop: '80px',
                    padding: '40px',
                    borderRadius: '32px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'center'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px', color: 'var(--primary)' }}>
                    <Database size={24} />
                    <h3 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sincronização de Dados</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
                    Use estas ferramentas para mover seus dados entre o ambiente de teste (Localhost) e o site oficial (GitHub), ou para criar cópias de segurança.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => exportToJSON(requests)}
                        className="premium-button"
                        style={{
                            background: 'rgba(52, 211, 153, 0.1)',
                            border: '1px solid #34d399',
                            color: '#34d399',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Download size={20} /> Exportar Backup (.json)
                    </button>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept=".json"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    try {
                                        const importedFlights = await importFromJSON(file);
                                        if (importedFlights && importedFlights.length > 0) {
                                            if (confirm(`Deseja importar ${importedFlights.length} voos? Isso irá ADICIONAR aos voos existentes sem apagar nada.`)) {
                                                onRequestsImported(importedFlights);
                                                alert('Dados importados com sucesso!');
                                            }
                                        }
                                    } catch (err) {
                                        alert('Erro ao importar: ' + err.message);
                                    }
                                }
                            }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                        />
                        <button
                            className="premium-button"
                            style={{
                                background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px solid #fbbf24',
                                color: '#fbbf24',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Upload size={20} /> Importar Dados
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
