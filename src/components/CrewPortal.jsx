import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateTime } from '../utils/dateUtils';
import { brazilianAirports } from '../data/airports';
import { authenticateCrew } from '../utils/supabaseCrew';
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
    Info,
    Database,
    BookOpen,
    DollarSign,
    ChevronDown,
    Trash2,
    FileText,
    Upload,
    Eye,
    User,
    Lock,
    Mail,
    LogOut,
    ArrowLeft
} from 'lucide-react';

export default function CrewPortal({ requests = [], onUpdateRequest, currentUser, onLogin, onLogout }) {
    const [isLoading, setIsLoading] = useState(false);
    const [authFormData, setAuthFormData] = useState({ email: '', password: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'completed'
    const [activeLancamentos, setActiveLancamentos] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showExpensesModal, setShowExpensesModal] = useState(false);
    const [selectedFlightForLog, setSelectedFlightForLog] = useState(null);
    const [activeUploadContext, setActiveUploadContext] = useState(null); // 'log' or 'expense'
    const [previewFile, setPreviewFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleAddFile = async (e) => {
        const file = e.target.files[0];
        if (file && selectedFlightForLog && activeUploadContext) {
            // Check file size (limit to 1MB for localStorage safety)
            if (file.size > 1024 * 1024) {
                alert('Arquivo muito grande! O limite para salvamento é de 1MB por arquivo.');
                return;
            }

            const convertToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            };

            try {
                const base64 = await convertToBase64(file);
                const newFile = {
                    id: `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    date: new Date().toLocaleString(),
                    url: base64 // Guardamos o Base64 para persistência real
                };

                const currentRequest = requests.find(r => r.id === selectedFlightForLog.id);
                if (currentRequest) {
                    const field = activeUploadContext === 'log' ? 'crewLogs' : 'crewExpenses';
                    const currentFiles = currentRequest[field] || [];

                    onUpdateRequest(currentRequest.id, currentRequest.status, null, {
                        ...currentRequest,
                        [field]: [...currentFiles, newFile]
                    });
                }
            } catch (err) {
                console.error('Erro ao processar arquivo:', err);
                alert('Erro ao processar o arquivo.');
            }
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const user = await authenticateCrew(authFormData.email, authFormData.password);
        setIsLoading(false);

        if (user) {
            onLogin(user);
        } else {
            alert('Falha na autenticação. Verifique seu e-mail e senha.');
        }
    };

    if (!currentUser) {
        return (
            <div className="container" style={{ padding: '80px 0', maxWidth: '500px' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism" style={{ padding: '48px', borderRadius: '32px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{ background: 'var(--primary-light)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Lock size={32} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Cockpit Operacional</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Acesse suas escalas e documentos técnicos.</p>
                    </div>

                    <form onSubmit={handleAuth}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">E-mail Corporativo</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="email" 
                                    className="input-field" 
                                    style={{ paddingLeft: '48px' }} 
                                    placeholder="seu@milaviacao.com" 
                                    required 
                                    value={authFormData.email} 
                                    onChange={e => setAuthFormData({ ...authFormData, email: e.target.value })} 
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label className="form-label">Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    style={{ paddingLeft: '48px' }} 
                                    placeholder="••••••••" 
                                    required 
                                    value={authFormData.password} 
                                    onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="premium-button" 
                            style={{ width: '100%', justifyContent: 'center', height: '56px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Autenticando...' : 'Acessar Cockpit'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    const removeFile = (fileId, type = 'log') => {
        const currentRequest = requests.find(r => r.id === selectedFlightForLog.id);
        if (currentRequest) {
            const field = type === 'log' ? 'crewLogs' : 'crewExpenses';
            const currentFiles = currentRequest[field] || [];

            onUpdateRequest(currentRequest.id, currentRequest.status, null, {
                ...currentRequest,
                [field]: currentFiles.filter(f => f.id !== fileId)
            });
        }
    };

    const getAirportLabel = (icao) => {
        const ap = brazilianAirports.find(a => a.icao === icao || a.iata === icao);
        return ap ? ap.label : icao;
    };

    const today = new Date().toISOString().split('T')[0];

    // Filter and sort requests
    const filteredRequests = requests.filter(req => {
        // First, check if current crew is assigned to this flight
        const isAssigned = req.crew_assignment?.some(c => c.id === currentUser.id || c.name === currentUser.name);
        if (!isAssigned) return false;

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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
                    <button 
                        onClick={onLogout}
                        className="premium-button"
                        style={{ 
                            background: 'rgba(248, 113, 113, 0.1)', 
                            color: '#f87171', 
                            border: '1px solid rgba(248, 113, 113, 0.2)',
                            height: '56px',
                            padding: '0 20px'
                        }}
                    >
                        <LogOut size={18} />
                    </button>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {/* Aircraft and Requesting Company Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'inline-block'
                                    }}>
                                        <div style={{ fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: '1' }}>
                                            {req.aircraft?.name || 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.7 }}>
                                            {req.aircraft?.name?.includes('PT-RBZ') ? 'RBF TÁXI AÉREO' : 'MIL AVIAÇÃO'}
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: '1.1rem',
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        opacity: 0.9,
                                        borderLeft: '2px solid var(--primary)',
                                        paddingLeft: '16px'
                                    }}>
                                        {req.name}
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Dropdown Lançamentos */}
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveLancamentos(activeLancamentos === req.id ? null : req.id);
                                                }}
                                                className="premium-button"
                                                style={{
                                                    padding: '10px 18px',
                                                    fontSize: '0.75rem',
                                                    background: activeLancamentos === req.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    color: activeLancamentos === req.id ? '#000' : '#fff',
                                                    borderRadius: '10px',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    height: '38px',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <Database size={16} color={activeLancamentos === req.id ? '#000' : 'var(--primary)'} />
                                                LANÇAMENTOS
                                                <ChevronDown
                                                    size={14}
                                                    style={{
                                                        transform: activeLancamentos === req.id ? 'rotate(180deg)' : 'rotate(0)',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                />
                                            </button>

                                            <AnimatePresence>
                                                {activeLancamentos === req.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '45px',
                                                            right: 0,
                                                            zIndex: 100,
                                                            background: 'rgba(15, 15, 20, 0.95)',
                                                            backdropFilter: 'blur(10px)',
                                                            border: '1px solid var(--primary)',
                                                            borderRadius: '12px',
                                                            padding: '8px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '4px',
                                                            minWidth: '180px',
                                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedFlightForLog(req);
                                                                setShowLogModal(true);
                                                                setActiveUploadContext('log');
                                                                setActiveLancamentos(null);
                                                            }}
                                                            style={{
                                                                padding: '10px 16px',
                                                                fontSize: '0.8rem',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#fff',
                                                                borderRadius: '8px',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            <BookOpen size={16} color="var(--primary)" /> Diário de Bordo
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedFlightForLog(req);
                                                                setShowExpensesModal(true);
                                                                setActiveUploadContext('expense');
                                                                setActiveLancamentos(null);
                                                            }}
                                                            style={{
                                                                padding: '10px 16px',
                                                                fontSize: '0.8rem',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: '#fff',
                                                                borderRadius: '8px',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            <DollarSign size={16} color="#f87171" /> Lançar Gastos
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{
                                            padding: '8px 20px',
                                            borderRadius: '24px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: status.bg,
                                            color: status.color,
                                            border: `2px solid ${status.color}`,
                                            whiteSpace: 'nowrap',
                                            letterSpacing: '1px',
                                            boxShadow: `0 0 10px ${status.color}15`
                                        }}>
                                            {status.label.toUpperCase()}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.8, fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                                        {req.timestamp}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Stages List - Full Width */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                {req.legs.map((leg, legIdx) => (
                                    <div key={legIdx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#fff',
                                        fontSize: '0.8rem',
                                        fontFamily: 'Arial, sans-serif',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        gap: '12px'
                                    }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', width: '90px', flexShrink: 0 }}>{legIdx + 1}ª ETAPA</span>

                                        <div style={{ display: 'flex', alignItems: 'center', width: '330px', flexShrink: 0 }}>
                                            <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>ORIGEM:</span>
                                            <span style={{ color: '#fff' }}>{getAirportLabel(leg.origin)}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', width: '330px', flexShrink: 0 }}>
                                            <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>DESTINO:</span>
                                            <span style={{ color: '#fff' }}>{getAirportLabel(leg.destination)}</span>
                                        </div>

                                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
                                            <span style={{ color: '#fff', opacity: 0.9 }}>{formatDateTime(leg.date, leg.time)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <ChevronRight size={20} color="var(--text-muted)" />
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

                                            {/* Fuel Section */}
                                            <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <DollarSign size={16} /> COMBUSTÍVEL:
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                                    <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--primary)' }}>{leg.fuelLocation || leg.origin || 'Não informado'}</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {leg.fuelShell && <p style={{ margin: 0 }}>Shell: <span style={{ color: 'var(--primary)' }}>R$ {leg.fuelShell}</span></p>}
                                                        {leg.fuelBR && <p style={{ margin: 0 }}>BR: <span style={{ color: 'var(--primary)' }}>R$ {leg.fuelBR}</span></p>}
                                                        {leg.fuelAirBp && <p style={{ margin: 0 }}>AirBp: <span style={{ color: 'var(--primary)' }}>R$ {leg.fuelAirBp}</span></p>}
                                                        {leg.fuelSign && <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', opacity: 0.6 }}>*{leg.fuelSign}*</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hotel Section */}
                                            <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={16} /> HOTEL:
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                                    {leg.hasHotel !== false ? (
                                                        <>
                                                            <div style={{ 
                                                                padding: '4px 10px', 
                                                                borderRadius: '4px', 
                                                                background: leg.hotelStatus === 'reservado' ? '#22c55e' : '#ef4444',
                                                                display: 'inline-block',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 'bold',
                                                                marginBottom: '8px'
                                                            }}>
                                                                {(leg.hotelStatus || 'PENDENTE').toUpperCase()}
                                                            </div>
                                                            {leg.hotelName && <p style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{leg.hotelName}</p>}
                                                            {leg.hotelDetails && <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>{leg.hotelDetails}</p>}
                                                        </>
                                                    ) : (
                                                        <p style={{ margin: 0, opacity: 0.6 }}>Não necessário / Não solicitado</p>
                                                    )}
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

            {/* Modal de Diário de Bordo / Gerenciamento de Arquivos */}
            <AnimatePresence>
                {showLogModal && selectedFlightForLog && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogModal(false)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.85)',
                                backdropFilter: 'blur(8px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'rgba(15, 15, 20, 0.98)',
                                border: '1px solid var(--primary)',
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <BookOpen color="var(--primary)" size={24} /> Diário de Bordo
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {selectedFlightForLog.aircraft?.name} - {selectedFlightForLog.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowLogModal(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Lista de Arquivos Salvos */}
                            <div style={{
                                minHeight: '150px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '16px'
                            }}>
                                {(!requests.find(r => r.id === selectedFlightForLog.id)?.crewLogs || requests.find(r => r.id === selectedFlightForLog.id).crewLogs.length === 0) ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5, gap: '12px' }}>
                                        <BookOpen size={40} />
                                        <span>Nenhum diário enviado.</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {requests.find(r => r.id === selectedFlightForLog.id).crewLogs.map(file => (
                                            <div key={file.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                                onClick={() => setPreviewFile(file)}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(201, 168, 106, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {file.type.startsWith('image/') ? (
                                                            <img src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                                                        ) : (
                                                            <FileText size={20} color="var(--primary)" />
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>{file.name}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{file.date} • {file.size}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Eye size={18} color="var(--text-muted)" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(file.id, 'log');
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botão de Enviar Arquivo */}
                            <button
                                onClick={() => {
                                    setActiveUploadContext('log');
                                    fileInputRef.current.click();
                                }}
                                className="premium-button"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '16px',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: 'var(--primary)',
                                    color: '#000'
                                }}
                            >
                                <Upload size={20} /> ENVIAR NOVO ARQUIVO
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Lançar Gastos / Gerenciamento de Recibos */}
            <AnimatePresence>
                {showExpensesModal && selectedFlightForLog && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowExpensesModal(false)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.85)',
                                backdropFilter: 'blur(8px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'rgba(15, 15, 20, 0.98)',
                                border: '1px solid #f87171',
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <DollarSign color="#f87171" size={24} /> Lançar Gastos
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {selectedFlightForLog.aircraft?.name} - {selectedFlightForLog.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowExpensesModal(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Lista de Recibos Salvos */}
                            <div style={{
                                minHeight: '150px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '16px'
                            }}>
                                {(!requests.find(r => r.id === selectedFlightForLog.id)?.crewExpenses || requests.find(r => r.id === selectedFlightForLog.id).crewExpenses.length === 0) ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5, gap: '12px' }}>
                                        <DollarSign size={40} />
                                        <span>Nenhum comprovante enviado.</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {requests.find(r => r.id === selectedFlightForLog.id).crewExpenses.map(file => (
                                            <div key={file.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                                onClick={() => setPreviewFile(file)}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(248, 113, 113, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {file.type.startsWith('image/') ? (
                                                            <img src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                                                        ) : (
                                                            <FileText size={20} color="#f87171" />
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>{file.name}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{file.date} • {file.size}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Eye size={18} color="var(--text-muted)" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(file.id, 'expense');
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botão de Enviar Recibo */}
                            <button
                                onClick={() => {
                                    setActiveUploadContext('expense');
                                    fileInputRef.current.click();
                                }}
                                className="premium-button"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '16px',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: '#f87171',
                                    color: '#fff',
                                    border: 'none'
                                }}
                            >
                                <Upload size={20} /> ENVIAR COMPROVANTE
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Preview de Arquivo */}
            <AnimatePresence>
                {previewFile && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 30000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewFile(null)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.95)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                position: 'relative',
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <button
                                onClick={() => setPreviewFile(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: 0,
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <X size={32} />
                            </button>

                            {previewFile.type.startsWith('image/') ? (
                                <img
                                    src={previewFile.url}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '80vh',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                    alt={previewFile.name}
                                />
                            ) : (previewFile.type === 'application/pdf' || previewFile.type.startsWith('text/')) ? (
                                <div style={{ width: '85vw', height: '80vh', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
                                    <iframe
                                        src={previewFile.url}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title={previewFile.name}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    background: 'rgba(15, 15, 20, 0.95)',
                                    padding: '60px',
                                    borderRadius: '24px',
                                    border: '1px solid var(--primary)',
                                    textAlign: 'center',
                                    color: '#fff',
                                    maxWidth: '400px'
                                }}>
                                    <FileText size={80} color="var(--primary)" style={{ marginBottom: '24px' }} />
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{previewFile.name}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Este tipo de arquivo (Office/Outros) requer download para visualização.</p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                                        <a
                                            href={previewFile.url}
                                            download={previewFile.name}
                                            style={{
                                                padding: '12px 24px',
                                                background: 'var(--primary)',
                                                color: '#000',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            BAIXAR AGORA
                                        </a>
                                        <button
                                            onClick={() => setPreviewFile(null)}
                                            style={{
                                                padding: '12px 24px',
                                                background: 'rgba(255,255,255,0.1)',
                                                color: '#fff',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            FECHAR
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div style={{ marginTop: '20px', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                                {previewFile.name}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Input oculto para upload do Diário de Bordo */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAddFile}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            />
        </div>
    );
}
