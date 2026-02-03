import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ChevronRight, Plane, Clock, CheckCircle, AlertCircle, ShieldAlert, LogOut, Plus, ArrowLeft, Calendar, MapPin, Coffee, Users, Edit, FileText, X } from 'lucide-react';
import FleetCalendar from './FleetCalendar';
import { formatDateTime } from '../utils/dateUtils';
import { brazilianAirports } from '../data/airports';

export default function ClientPortal({ requests = [], currentUser, onLogin, onLogout, onNewRequest, onUpdateRequest, onEditRequest, onBack }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [viewingDetails, setViewingDetails] = useState(null); // { type: 'pax' | 'catering' | 'full', leg, idx }
    const [showCalendar, setShowCalendar] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [activeAutocomplete, setActiveAutocomplete] = useState({ index: null, field: null, results: [] });

    // Scroll to top on internal navigation
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedRequest, showCalendar, isEditing]);

    const handleStartEdit = () => {
        setEditingRequest(JSON.parse(JSON.stringify(selectedRequest)));
        setIsEditing(true);
    };

    const handleLegUpdate = (idx, field, value) => {
        if (!editingRequest) return;
        const newReq = { ...editingRequest };
        const upperValue = value.toUpperCase();

        if (newReq.legs && newReq.legs[idx]) {
            newReq.legs[idx][field] = upperValue;
            setEditingRequest(newReq);

            if (field === 'origin' || field === 'destination') {
                const results = brazilianAirports.filter(ap =>
                    ap.icao.includes(upperValue) ||
                    (ap.iata && ap.iata.includes(upperValue)) ||
                    ap.name.toUpperCase().includes(upperValue) ||
                    ap.city.toUpperCase().includes(upperValue)
                ).slice(0, 5);
                setActiveAutocomplete({ index: idx, field, results });
            }
        }
    };

    const selectAirport = (index, field, airport) => {
        handleLegUpdate(index, field, airport.label);
        setActiveAutocomplete({ index: null, field: null, results: [] });
    };

    const hasChanges = () => {
        if (!selectedRequest || !editingRequest) return false;
        return JSON.stringify(selectedRequest.legs) !== JSON.stringify(editingRequest.legs);
    };

    const validateDates = () => {
        if (!editingRequest || !editingRequest.legs) return { valid: true };
        for (let i = 0; i < editingRequest.legs.length - 1; i++) {
            const currentLeg = editingRequest.legs[i];
            const nextLeg = editingRequest.legs[i + 1];
            if (currentLeg.date > nextLeg.date) {
                return {
                    valid: false,
                    message: `Atenção: A data da etapa ${i + 1} (${currentLeg.date}) não pode ser posterior à etapa ${i + 2} (${nextLeg.date}). Por favor, ajuste as datas das etapas seguintes.`
                };
            }
        }
        return { valid: true };
    };

    const handleAuth = (e) => {
        e.preventDefault();
        // Generate a stable ID based on email to avoid disappearance on re-login
        const email = formData.email ? formData.email.toLowerCase().trim() : '';
        const stableId = btoa(email).replace(/=/g, '');
        onLogin({
            id: stableId,
            name: formData.name || 'Cliente Demo',
            email: email
        });
    };

    const getStatusInfo = (status, request = null) => {
        // Verifica se é uma edição (novo + oldData) ou status explícito de alteração
        if ((status === 'novo' && request?.oldData) || status === 'alteracao_solicitada') {
            return { label: 'Alteração Solicitada', color: '#a855f7', icon: <Edit size={16} /> }; // Lilac
        }
        switch (status) {
            case 'aprovado': return { label: 'Aprovado', color: '#34d399', icon: <CheckCircle size={16} /> };
            case 'pendente': return { label: 'Pendente', color: '#fbbf24', icon: <AlertCircle size={16} /> };
            case 'recusado': return { label: 'Recusado', color: '#f87171', icon: <ShieldAlert size={16} /> };
            case 'cancelamento': return { label: 'Cancelamento Solicitado', color: '#ef4444', icon: <ShieldAlert size={16} /> };
            // Caso explícito já coberto no if acima, mas mantido por segurança
            case 'alteracao_solicitada': return { label: 'Alteração Solicitada', color: '#a855f7', icon: <Edit size={16} /> };
            case 'cancelado': return { label: 'Voo Cancelado', color: '#94a3b8', icon: <ShieldAlert size={16} /> };
            default: return { label: 'Em Análise', color: '#60a5fa', icon: <Clock size={16} /> };
        }
    };

    if (!currentUser) {
        return (
            <div className="container" style={{ padding: '80px 0', maxWidth: '500px' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism" style={{ padding: '48px', borderRadius: '32px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{ background: 'var(--primary-light)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <User size={32} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{isRegistering ? 'Criar Conta' : 'Área do Cliente'}</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Acesse seus pedidos e acompanhe o status dos voos.</p>
                    </div>

                    <form onSubmit={handleAuth}>
                        {isRegistering && (
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">Nome Completo</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" className="input-field" style={{ paddingLeft: '48px' }} placeholder="Seu nome" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                            </div>
                        )}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">E-mail</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="email" className="input-field" style={{ paddingLeft: '48px' }} placeholder="seu@email.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '32px' }}>
                            <label className="form-label">Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" className="input-field" style={{ paddingLeft: '48px' }} placeholder="••••••••" required />
                            </div>
                        </div>

                        <button className="premium-button" type="submit" style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }}>
                            {isRegistering ? 'Cadastrar' : 'Entrar'} <ChevronRight size={18} />
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'} {' '}
                        <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>
                            {isRegistering ? 'Login' : 'Cadastre-se'}
                        </button>
                    </p>
                </motion.div>
            </div>
        );
    }

    if (selectedRequest) {
        const statusInfo = getStatusInfo(selectedRequest.status, selectedRequest);
        return (
            <div className="container" style={{ padding: '80px 0' }}>
                <button onClick={() => { setSelectedRequest(null); setViewingDetails(null); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px', fontSize: '1rem', fontWeight: '600' }}>
                    <ArrowLeft size={20} /> Voltar para o Dashboard
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism" style={{ padding: '24px', borderRadius: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>
                                    {isEditing ? 'Página de Alterações' : `Detalhes da Solicitação`}
                                </h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Status:</span> <strong style={{ color: statusInfo.color }}>{statusInfo.label}</strong>
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Aeronave:</span> <strong>{selectedRequest.aircraft?.name}</strong>
                                    </p>
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    onClick={handleStartEdit}
                                    className="premium-button"
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(52, 211, 153, 0.1)',
                                        borderRadius: '12px',
                                        border: '1px solid #34d399',
                                        color: '#34d399',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <Edit size={16} /> Solicitar Alteração
                                </button>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '12px', color: '#34d399', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={20} />
                                <span style={{ fontSize: '0.9rem' }}>Edite os detalhes abaixo e clique em Enviar Solicitação para notificar a coordenação.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => { setIsEditing(false); setEditingRequest(null); }}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        const validation = validateDates();
                                        if (!validation.valid) {
                                            alert(validation.message);
                                            return;
                                        }
                                        setShowConfirmation(true);
                                    }}
                                    disabled={!hasChanges()}
                                    className="premium-button"
                                    style={{
                                        padding: '8px 16px',
                                        background: hasChanges() ? '#34d399' : 'rgba(52, 211, 153, 0.2)',
                                        color: hasChanges() ? '#000' : 'rgba(255, 255, 255, 0.3)',
                                        border: hasChanges() ? 'none' : '1px solid rgba(52, 211, 153, 0.2)',
                                        cursor: hasChanges() ? 'pointer' : 'not-allowed',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Enviar Solicitação
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedRequest.observation && (
                        <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '20px', color: '#fbbf24' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '1rem' }}>
                                <AlertCircle size={20} /> Mensagem da Coordenação:
                            </div>
                            <p style={{ margin: 0, fontStyle: 'italic', lineHeight: '1.6', fontSize: '0.95rem' }}>"{selectedRequest.observation}"</p>
                        </div>
                    )}

                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.3rem' }}>
                        <Calendar size={20} color="var(--primary)" /> Itinerário
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedRequest.legs?.map((leg, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '20px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ background: 'var(--primary)', color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                        {idx + 1}ª ETAPA - <span style={{ fontWeight: 'normal', fontSize: '0.95rem' }}>{formatDateTime(leg.date, leg.time)}</span>
                                    </h4>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.75rem' }}>ORIGEM:</span> {leg.origin}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.75rem' }}>DESTINO:</span> {leg.destination}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setViewingDetails({ type: 'full', leg, idx })}
                                    className="premium-button"
                                    style={{ width: '100%', justifyContent: 'center', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', height: '44px', fontSize: '0.9rem' }}
                                >
                                    {isEditing ? (
                                        <><Edit size={16} /> Fazer Mudanças</>
                                    ) : (
                                        <><FileText size={16} /> Detalhes do Voo</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <AnimatePresence>
                    {viewingDetails && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-morphism" style={{ padding: '32px', borderRadius: '32px', maxWidth: '600px', width: '100%', position: 'relative' }}>
                                <button
                                    onClick={() => setViewingDetails(null)}
                                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px' }}>
                                        {viewingDetails.type === 'pax' ? <Users size={20} color="var(--primary)" /> :
                                            viewingDetails.type === 'catering' ? <Coffee size={20} color="var(--primary)" /> :
                                                <Plane size={20} color="var(--primary)" />}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                            {viewingDetails.type === 'pax' ? 'Lista de Passageiros' :
                                                viewingDetails.type === 'catering' ? 'Detalhes do Catering' :
                                                    'Detalhes Completos do Voo'}
                                        </h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Trecho {viewingDetails.idx + 1}: {viewingDetails.leg.origin} → {viewingDetails.leg.destination}</p>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    border: '1px solid var(--glass-border)',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {viewingDetails.type === 'full' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'monospace' }}>
                                            <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                                    {`|> ${viewingDetails.idx + 1}ª ETAPA <|`}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            <div className="form-group">
                                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Data</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                                    <input type="date" className="input-field" value={editingRequest?.legs?.[viewingDetails.idx]?.date || ''} onChange={(e) => handleLegUpdate(viewingDetails.idx, 'date', e.target.value)} style={{ paddingLeft: '40px', fontSize: '0.85rem' }} />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Origem</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                                    <input
                                                                        type="text"
                                                                        className="input-field"
                                                                        value={editingRequest?.legs?.[viewingDetails.idx]?.origin || ''}
                                                                        onChange={(e) => handleLegUpdate(viewingDetails.idx, 'origin', e.target.value)}
                                                                        style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Destino</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                                    <input
                                                                        type="text"
                                                                        className="input-field"
                                                                        value={editingRequest?.legs?.[viewingDetails.idx]?.destination || ''}
                                                                        onChange={(e) => handleLegUpdate(viewingDetails.idx, 'destination', e.target.value)}
                                                                        style={{ paddingLeft: '40px', fontSize: '0.85rem' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Horário</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                                    <input type="time" className="input-field" value={editingRequest?.legs?.[viewingDetails.idx]?.time || ''} onChange={(e) => handleLegUpdate(viewingDetails.idx, 'time', e.target.value)} style={{ paddingLeft: '40px', fontSize: '0.85rem' }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                                            <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Data e Horário:</span> {formatDateTime(viewingDetails.leg.date, viewingDetails.leg.time)}</p>
                                                            <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>ORIGEM:</span> {viewingDetails.leg.origin}</p>
                                                            <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>DESTINO:</span> {viewingDetails.leg.destination}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Passageiros Section */}
                                            <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                    PASSAGEIROS:
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                                    {isEditing ? (
                                                        <textarea
                                                            className="input-field"
                                                            rows="4"
                                                            value={editingRequest?.legs[viewingDetails.idx]?.passengerList || ''}
                                                            onChange={(e) => handleLegUpdate(viewingDetails.idx, 'passengerList', e.target.value)}
                                                            placeholder="Edite a lista de passageiros aqui..."
                                                            style={{ fontSize: '0.85rem' }}
                                                        />
                                                    ) : (
                                                        <div style={{ whiteSpace: 'pre-wrap' }}>
                                                            {viewingDetails.leg.passengerList || 'Nenhum passageiro listado.'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comissaria Section */}
                                            <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                    COMISSARIA:
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                                    {isEditing ? (
                                                        <textarea
                                                            className="input-field"
                                                            rows="3"
                                                            value={editingRequest?.legs[viewingDetails.idx]?.catering || ''}
                                                            onChange={(e) => handleLegUpdate(viewingDetails.idx, 'catering', e.target.value)}
                                                            placeholder="Descreva o catering desejado..."
                                                            style={{ fontSize: '0.85rem' }}
                                                        />
                                                    ) : (
                                                        <div style={{ whiteSpace: 'pre-wrap' }}>
                                                            {viewingDetails.leg.catering || 'Catering padrão solicitado.'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* FBO Section */}
                                            <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                    FBO {viewingDetails.leg.fboCity || ''}:
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                                    {viewingDetails.leg.fboDetails || 'Informações não cadastradas.'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#fff' }}>
                                            {viewingDetails.type === 'pax'
                                                ? (viewingDetails.leg.passengerList || 'Nenhum passageiro listado.')
                                                : (viewingDetails.leg.catering || 'Catering padrão solicitado.')}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '24px' }}>
                                    <button
                                        className="premium-button"
                                        style={{ width: '100%', height: '44px', justifyContent: 'center', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.9rem' }}
                                        onClick={() => setViewingDetails(null)}
                                    >
                                        Fechar Detalhes
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showConfirmation && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '20px' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-morphism" style={{ padding: '40px', borderRadius: '32px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                                <AlertCircle size={48} color="var(--primary)" style={{ marginBottom: '24px' }} />
                                <h3 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Confirmar Alteração</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                    Tem certeza que deseja solicitar estas alterações? O status do voo mudará para "Alteração Solicitada" e a coordenação será notificada.
                                </p>
                                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="premium-button"
                                        onClick={() => {
                                            if (onUpdateRequest) {
                                                onUpdateRequest(selectedRequest.id, 'alteracao_solicitada', null, editingRequest);
                                            }
                                            setShowConfirmation(false);
                                            setIsEditing(false);
                                            setViewingDetails(null);
                                        }}
                                        style={{ padding: '12px 24px', background: 'var(--primary)', color: '#000', border: 'none', fontSize: '1rem' }}
                                    >
                                        Confirmar Solicitação
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (showCalendar) {
        return (
            <div className="container" style={{ padding: '80px 0' }}>
                <button
                    onClick={() => setShowCalendar(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px', fontSize: '1rem', fontWeight: '600' }}
                >
                    <ArrowLeft size={20} /> Voltar para o Dashboard
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism" style={{ padding: '40px', borderRadius: '32px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                            <Calendar size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>Agenda de Frota</h2>
                        </div>
                    </div>

                    <div style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: '1px solid var(--glass-border)',
                        padding: '32px'
                    }}>
                        <FleetCalendar requests={requests} />
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle size={18} />
                        Este calendário é apenas para visualização de disponibilidade. Para solicitar um voo, use o botão "Novo Pedido de Voo".
                    </div>
                </motion.div>
            </div>
        );
    }

    const clientRequests = requests.filter(r => r.userId === currentUser.id);

    return (
        <div className="container" style={{ padding: '80px 0' }}>
            <header style={{ marginBottom: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 className="client-portal-title" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Painel do Cliente</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta, <strong>{currentUser.name}</strong></p>
                </div>
                <div className="mobile-stack" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="premium-button" onClick={() => setShowCalendar(true)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', minWidth: '200px', justifyContent: 'center' }}>
                        <Calendar size={18} /> Ver Agenda de Frota
                    </button>
                    <button className="premium-button" onClick={onNewRequest} style={{ minWidth: '200px', justifyContent: 'center' }}>
                        <Plus size={18} /> Novo Pedido de Voo
                    </button>
                    <div style={{ display: 'flex', gap: '16px', flex: '1 1 auto', minWidth: '280px' }}>
                        <button onClick={onBack} className="premium-button" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)', flex: 1, justifyContent: 'center', textTransform: 'none', minWidth: 0, padding: '14px 12px', whiteSpace: 'nowrap' }}>
                            <ArrowLeft size={18} /> Voltar Pagina
                        </button>
                        <button onClick={() => setShowLogoutConfirmation(true)} className="premium-button" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)', flex: 1, justifyContent: 'center', textTransform: 'none', minWidth: 0, padding: '14px 12px', whiteSpace: 'nowrap' }}>
                            <LogOut size={18} /> Sair da Conta
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '64px' }}>
                <div className="glass-morphism" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '16px' }}>Total de Pedidos</h4>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{clientRequests.length}</p>
                </div>
                <div className="glass-morphism" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '16px' }}>Em Análise</h4>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#60a5fa' }}>{clientRequests.filter(r => r.status === 'novo').length}</p>
                </div>
                <div className="glass-morphism" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '16px' }}>Aprovados</h4>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#34d399' }}>{clientRequests.filter(r => r.status === 'aprovado').length}</p>
                </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Minhas Solicitações</h3>

            {clientRequests.length === 0 ? (
                <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                    <Plane size={48} color="var(--primary)" style={{ marginBottom: '24px', margin: '0 auto 24px', opacity: 0.3 }} />
                    <h3>Nenhum pedido realizado</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Suas solicitações de voo aparecerão listadas aqui após serem enviadas.</p>
                    <button className="premium-button" onClick={onNewRequest} style={{ margin: '0 auto' }}>Fazer Primeiro Pedido</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {clientRequests.map(req => {
                        const statusInfo = getStatusInfo(req.status, req);
                        return (
                            <motion.div key={req.id} whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.02)' }} onClick={() => setSelectedRequest(req)} className="glass-morphism" style={{ padding: '24px 32px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${statusInfo.color}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                                        <Plane size={24} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <span><span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.75rem' }}>ORIGEM:</span> {req.legs?.[0]?.origin}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>|</span>
                                            <span><span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.75rem' }}>DESTINO:</span> {req.legs?.[0]?.destination}</span>
                                        </h4>
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {req.aircraft?.name} • {formatDateTime(req.legs?.[0]?.date, req.legs?.[0]?.time)}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                    <div style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {statusInfo.icon} {statusInfo.label.toUpperCase()}
                                    </div>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {showLogoutConfirmation && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-morphism" style={{ padding: '40px', borderRadius: '32px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                            <LogOut size={48} color="#f87171" style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Confirmar Saída</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                Tem certeza que deseja sair da sua conta?
                            </p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowLogoutConfirmation(false)}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="premium-button"
                                    onClick={onLogout}
                                    style={{ padding: '12px 24px', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid #f87171', fontSize: '1rem' }}
                                >
                                    Sair da Conta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
