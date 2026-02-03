import React, { useState } from 'react';
import { ShieldAlert, Send, CheckCircle, Clock, ListChecks, User, Mail, Calendar, MapPin, Coffee, FileText, ChevronRight, ArrowLeft, Plane, Users, AlertCircle, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingForm from './BookingForm';
import AircraftSelector from './AircraftSelector';
import CoordinatorHome from './CoordinatorHome';
import FlightsByClient from './FlightsByClient';
import ManageRequesters from './ManageRequesters';
import ManageCrew from './ManageCrew';
import { Fingerprint as FingerprintIcon } from 'lucide-react';
import { formatDate, getTimestamp, formatDateTime } from '../utils/dateUtils';
import { brazilianAirports } from '../data/airports';

export default function CoordinatorDashboard({ requests = [], onUpdateStatus }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isPendingApproval, setIsPendingApproval] = useState(false);
    const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
    const [authError, setAuthError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingReason, setPendingReason] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedRequest, setEditedRequest] = useState(null);
    const [showRefusalModal, setShowRefusalModal] = useState(false);
    const [refusalReason, setRefusalReason] = useState('');
    const [viewingDetails, setViewingDetails] = useState(null); // { type: 'pax' | 'catering' | 'full', leg, idx }
    const [showManualFlightModal, setShowManualFlightModal] = useState(false);
    const [manualFlightStep, setManualFlightStep] = useState('aircraft'); // 'aircraft' or 'form'
    const [selectedAircraftForManual, setSelectedAircraftForManual] = useState(null);
    const [manualFlightPendingData, setManualFlightPendingData] = useState(null);
    const [showManualPendingModal, setShowManualPendingModal] = useState(false);
    const [manualPendingReason, setManualPendingReason] = useState('');
    const [currentView, setCurrentView] = useState('home'); // 'home', 'flight-panel', 'by-client'
    const [crewDatabase] = useState(() => {
        const stored = localStorage.getItem('crew_members');
        return stored ? JSON.parse(stored) : [];
    });
    const [activeAutocomplete, setActiveAutocomplete] = useState({ index: null, field: null, results: [] });

    // Scroll to top on internal navigation
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentView, selectedRequest, viewingDetails]);

    const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    React.useEffect(() => {
        const checkSession = () => {
            const session = localStorage.getItem('coordinatorSession');
            if (session) {
                const { timestamp } = JSON.parse(session);
                const now = new Date().getTime();

                if (now - timestamp < SESSION_DURATION) {
                    setIsAuthorized(true);
                    // Optional: Refresh session timestamp on active use? 
                    // For now, strict 2 hours from login as requested.
                } else {
                    localStorage.removeItem('coordinatorSession');
                    setIsAuthorized(false);
                }
            }
        };
        checkSession();
    }, [SESSION_DURATION]);

    const getStoredCoordinators = () => {
        const stored = localStorage.getItem('coordinators');
        return stored ? JSON.parse(stored) : [
            { email: 'wellingtonmota87@gmail.com', password: 'Joziele#280289', name: 'Wellington Mota', status: 'approved' }
        ];
    };

    const handleAuth = (e) => {
        e.preventDefault();
        setAuthError('');
        const coordinators = getStoredCoordinators();

        if (isRegistering) {
            if (coordinators.find(c => c.email === authData.email)) {
                setAuthError('Este e-mail já está cadastrado.');
                return;
            }
            const newCoordinator = { ...authData, status: 'pending' };
            const updatedCoordinators = [...coordinators, newCoordinator];
            localStorage.setItem('coordinators', JSON.stringify(updatedCoordinators));
            setIsPendingApproval(true);
            setIsRegistering(false);
        } else {
            const user = coordinators.find(c => c.email === authData.email && c.password === authData.password);
            if (!user) {
                setAuthError('E-mail ou senha incorretos.');
                return;
            }
            if (user.status === 'pending') {
                setIsPendingApproval(true);
                return;
            }

            // Login successful - Create Session
            const sessionData = {
                user: { name: user.name, email: user.email },
                timestamp: new Date().getTime()
            };
            localStorage.setItem('coordinatorSession', JSON.stringify(sessionData));
            localStorage.setItem('currentCoordinator', user.name || 'Coordenador'); // Maintain compatibility

            setIsAuthorized(true);
        }
    };




    const handleAction = (status, observation = null) => {
        onUpdateStatus(selectedRequest.id, status, observation);
        setSelectedRequest(null);
        setShowPendingModal(false);
        setPendingReason('');
        setShowRefusalModal(false);
        setRefusalReason('');
        setIsEditing(false);
        setEditedRequest(null);
    };

    const handleStartEdit = () => {
        setEditedRequest(JSON.parse(JSON.stringify(selectedRequest)));
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedRequest(null);
    };

    const handleSaveEdit = () => {
        // When coordinator saves, we also reset status to 'novo' to ensure full re-evaluation
        const finalizedRequest = {
            ...editedRequest,
            status: 'novo',
            oldData: { ...selectedRequest },
            timestamp: getTimestamp()
        };
        onUpdateStatus(selectedRequest.id, 'novo', selectedRequest.observation, finalizedRequest);
        setSelectedRequest(finalizedRequest);
        setIsEditing(false);
        setEditedRequest(null);
    };

    const isModified = (field, currentVal, legIndex = null) => {
        if (!selectedRequest.oldData) return false;

        if (legIndex !== null) {
            const oldLeg = selectedRequest.oldData.legs?.[legIndex];
            if (!oldLeg) return true;
            return oldLeg[field] !== currentVal;
        }

        return selectedRequest.oldData[field] !== currentVal;
    };

    const handleEditChange = (field, value) => {
        setEditedRequest(prev => ({ ...prev, [field]: value }));
    };

    const handleEditLegChange = (index, field, value) => {
        const newLegs = [...editedRequest.legs];
        const upperValue = value.toUpperCase();
        newLegs[index] = { ...newLegs[index], [field]: upperValue };
        setEditedRequest({ ...editedRequest, legs: newLegs });

        if (field === 'origin' || field === 'destination') {
            const results = brazilianAirports.filter(ap =>
                ap.icao.includes(upperValue) ||
                (ap.iata && ap.iata.includes(upperValue)) ||
                ap.name.toUpperCase().includes(upperValue) ||
                ap.city.toUpperCase().includes(upperValue)
            ).slice(0, 5);
            setActiveAutocomplete({ index, field, results });
        }
    };

    const handleEditCrewChange = (index, field, value) => {
        const newCrew = [...(editedRequest.crew || [{}, {}])];
        newCrew[index] = { ...newCrew[index], [field]: value };

        // Auto-fill ANAC if name matches exactly or we find a perfect match
        if (field === 'name') {
            const member = crewDatabase.find(c => c.name.toLowerCase() === value.toLowerCase());
            if (member) {
                newCrew[index].anac = member.anac;
            }
        }

        setEditedRequest({ ...editedRequest, crew: newCrew });
    };

    const handleOpenManualFlight = () => {
        setShowManualFlightModal(true);
        setManualFlightStep('aircraft');
        setSelectedAircraftForManual(null);
    };

    const handleAircraftSelect = (aircraft) => {
        setSelectedAircraftForManual(aircraft);
        setManualFlightStep('form');
    };

    const handleManualFlightSubmit = (status, data) => {
        if (status === 'pendente') {
            // Store data and show pending observation modal
            setManualFlightPendingData(data);
            setShowManualPendingModal(true);
        } else {
            // Create approved manual flight directly
            const newRequest = {
                id: Date.now(),
                userId: 'coordinator-manual',
                timestamp: getTimestamp(),
                ...data,
                aircraft: selectedAircraftForManual,
                status: 'aprovado'
            };
            onUpdateStatus(newRequest.id, 'aprovado', null, newRequest);
            setShowManualFlightModal(false);
            setManualFlightStep('aircraft');
            setSelectedAircraftForManual(null);
        }
    };

    const handleConfirmManualPending = () => {
        const newRequest = {
            id: Date.now(),
            userId: 'coordinator-manual',
            timestamp: getTimestamp(),
            ...manualFlightPendingData,
            aircraft: selectedAircraftForManual,
            status: 'pendente',
            observation: manualPendingReason
        };
        onUpdateStatus(newRequest.id, 'pendente', manualPendingReason, newRequest);
        setShowManualFlightModal(false);
        setManualFlightStep('aircraft');
        setSelectedAircraftForManual(null);
        setShowManualPendingModal(false);
        setManualPendingReason('');
        setManualFlightPendingData(null);
    };

    const handleCancelManualFlight = () => {
        setShowManualFlightModal(false);
        setManualFlightStep('aircraft');
        setSelectedAircraftForManual(null);
    };



    const getStatusInfo = (status, request = null) => {
        if (status === 'novo' && request?.oldData) {
            return { label: 'Edição Solicitada', color: '#a855f7' }; // Lilac
        }
        switch (status) {
            case 'aprovado': return { label: 'Aprovado', color: '#34d399' };
            case 'pendente': return { label: 'Pendência', color: '#fbbf24' };
            case 'concluido': return { label: 'Concluído', color: '#60a5fa' };
            case 'alteracao_solicitada': return { label: 'Alteração Solicitada', color: '#a855f7' };
            case 'recusado': return { label: 'Recusado', color: '#f87171' };
            case 'cancelamento': return { label: 'Cancelamento Solicitado', color: '#dc2626' }; // Red
            case 'cancelado': return { label: 'Voo Cancelado', color: '#94a3b8' }; // Slate 400 (Grey)
            default: return { label: 'Nova Solicitação', color: '#f87171', isNew: true };
        }
    };

    if (!isAuthorized) {
        return (
            <div className="container" style={{ padding: '80px 0', maxWidth: '500px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-morphism"
                    style={{ padding: '48px', borderRadius: '32px' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            background: isPendingApproval ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: isPendingApproval ? '#fbbf24' : '#34d399'
                        }}>
                            {isPendingApproval ? <Clock size={40} /> : <ShieldAlert size={40} />}
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
                            {isPendingApproval ? 'Aguardando Liberação' : (isRegistering ? 'Cadastro de Coordenador' : 'Acesso Restrito')}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {isPendingApproval ? 'Sua solicitação foi enviada. O administrador enviará um e-mail após validar seu acesso.' : 'Painel exclusivo para equipe de coordenação operacional.'}
                        </p>
                    </div>

                    {!isPendingApproval ? (
                        <form onSubmit={handleAuth}>
                            {isRegistering && (
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">Nome Completo</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            style={{ paddingLeft: '48px' }}
                                            required
                                            value={authData.name}
                                            onChange={e => setAuthData({ ...authData, name: e.target.value })}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">E-mail Corporativo</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        style={{ paddingLeft: '48px' }}
                                        required
                                        value={authData.email}
                                        onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                        placeholder="seu@empresa.com"
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '32px' }}>
                                <label className="form-label">Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <Edit size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ paddingLeft: '48px' }}
                                        required
                                        value={authData.password}
                                        onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {authError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{authError}</p>}

                            <button className="premium-button" type="submit" style={{ width: '100%', justifyContent: 'center', marginBottom: '20px' }}>
                                {isRegistering ? 'Solicitar Acesso' : 'Entrar no Painel'} <ChevronRight size={18} />
                            </button>

                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {isRegistering ? 'Já possui autorização?' : 'Novo na equipe?'} {' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                                >
                                    {isRegistering ? 'Fazer Login' : 'Cadastrar-se'}
                                </button>
                            </p>
                        </form>
                    ) : (
                        <button
                            className="premium-button"
                            onClick={() => setIsPendingApproval(false)}
                            style={{ width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
                        >
                            <ArrowLeft size={18} /> Voltar ao Login
                        </button>
                    )}
                </motion.div>
            </div>
        );
    }

    if (selectedRequest) {
        const updateLeg = (field, value) => {
            let newLeg;
            if (typeof field === 'object' && field !== null) {
                newLeg = { ...viewingDetails.leg, ...field };
            } else {
                newLeg = { ...viewingDetails.leg, [field]: value };
            }

            if (field === 'passengers' || newLeg.passengers !== viewingDetails.leg.passengers) {
                const count = parseInt(newLeg.passengers) || 0;
                let currentList = Array.isArray(newLeg.passengerData) ? [...newLeg.passengerData] : [];

                if (count > 0) {
                    newLeg.isEmptyLeg = false;
                }

                if (currentList.length < count) {
                    for (let i = currentList.length; i < count; i++) {
                        currentList.push({ name: '', document: '' });
                    }
                } else if (currentList.length > count) {
                    currentList = currentList.slice(0, count);
                }
                newLeg.passengerData = currentList;
                newLeg.passengerList = currentList.map((p, i) => `${i + 1} - ${p.name} - ${p.document}`).join('\n');
            } else if (field === 'isEmptyLeg' || newLeg.isEmptyLeg !== viewingDetails.leg.isEmptyLeg) {
                if (newLeg.isEmptyLeg === true) {
                    newLeg.passengers = 0;
                    newLeg.passengerData = [];
                    newLeg.passengerList = '';
                }
            }

            const newLegs = [...selectedRequest.legs];
            newLegs[viewingDetails.idx] = newLeg;
            const updatedRequest = { ...selectedRequest, legs: newLegs };
            onUpdateStatus(selectedRequest.id, selectedRequest.status, selectedRequest.observation, updatedRequest);
            setSelectedRequest(updatedRequest);
            setViewingDetails({ ...viewingDetails, leg: newLeg });

            if (field === 'origin' || field === 'destination') {
                const upperValue = value.toUpperCase();
                const results = brazilianAirports.filter(ap =>
                    ap.icao.includes(upperValue) ||
                    (ap.iata && ap.iata.includes(upperValue)) ||
                    ap.name.toUpperCase().includes(upperValue) ||
                    ap.city.toUpperCase().includes(upperValue)
                ).slice(0, 5);
                setActiveAutocomplete({ index: viewingDetails.idx, field, results });
            }
        };

        const selectAirport = (index, field, airport, isViewingDetails = false) => {
            if (isViewingDetails) {
                updateLeg(field, airport.label);
            } else {
                handleEditLegChange(index, field, airport.label);
            }
            setActiveAutocomplete({ index: null, field: null, results: [] });
        };

        const updatePassenger = (index, field, value) => {
            const currentData = Array.isArray(viewingDetails.leg.passengerData) ? [...viewingDetails.leg.passengerData] : [];
            if (!currentData[index]) return;
            currentData[index] = { ...currentData[index], [field]: value };

            const newLeg = {
                ...viewingDetails.leg,
                passengerData: currentData,
                passengerList: currentData.map((p, i) => `${i + 1} - ${p.name} - ${p.document}`).join('\n')
            };

            const newLegs = [...selectedRequest.legs];
            newLegs[viewingDetails.idx] = newLeg;
            const updatedRequest = { ...selectedRequest, legs: newLegs };
            onUpdateStatus(selectedRequest.id, selectedRequest.status, selectedRequest.observation, updatedRequest);
            setSelectedRequest(updatedRequest);
            setViewingDetails({ ...viewingDetails, leg: newLeg });
        };

        const updateNotam = (index, value) => {
            const currentData = Array.isArray(viewingDetails.leg.notamData) ? [...viewingDetails.leg.notamData] : [];
            currentData[index] = value;

            const newLeg = {
                ...viewingDetails.leg,
                notamData: currentData,
                notam: currentData.filter(n => n.trim() !== '').join('\n')
            };

            const newLegs = [...selectedRequest.legs];
            newLegs[viewingDetails.idx] = newLeg;
            const updatedRequest = { ...selectedRequest, legs: newLegs };
            onUpdateStatus(selectedRequest.id, selectedRequest.status, selectedRequest.observation, updatedRequest);
            setSelectedRequest(updatedRequest);
            setViewingDetails({ ...viewingDetails, leg: newLeg });
        };

        const addNotamField = () => {
            const currentData = Array.isArray(viewingDetails.leg.notamData) ? [...viewingDetails.leg.notamData] : [];
            currentData.push('');

            const newLeg = { ...viewingDetails.leg, notamData: currentData, hasNotam: true };
            const newLegs = [...selectedRequest.legs];
            newLegs[viewingDetails.idx] = newLeg;
            const updatedRequest = { ...selectedRequest, legs: newLegs };
            onUpdateStatus(selectedRequest.id, selectedRequest.status, selectedRequest.observation, updatedRequest);
            setSelectedRequest(updatedRequest);
            setViewingDetails({ ...viewingDetails, leg: newLeg });
        };

        const removeNotamField = (index) => {
            const currentData = Array.isArray(viewingDetails.leg.notamData) ? [...viewingDetails.leg.notamData] : [];
            if (currentData.length <= 1) {
                updateLeg('hasNotam', false);
                updateLeg('notamData', []);
                return;
            }

            const newData = currentData.filter((_, i) => i !== index);
            const newLeg = {
                ...viewingDetails.leg,
                notamData: newData,
                notam: newData.filter(n => n.trim() !== '').join('\n')
            };

            const newLegs = [...selectedRequest.legs];
            newLegs[viewingDetails.idx] = newLeg;
            const updatedRequest = { ...selectedRequest, legs: newLegs };
            onUpdateStatus(selectedRequest.id, selectedRequest.status, selectedRequest.observation, updatedRequest);
            setSelectedRequest(updatedRequest);
            setViewingDetails({ ...viewingDetails, leg: newLeg });
        };

        return (
            <div className="container" style={{ padding: '80px 0' }}>
                <button
                    onClick={() => { setSelectedRequest(null); setViewingDetails(null); }}
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
                    <ArrowLeft size={20} /> Voltar para a lista
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism" style={{ padding: '40px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Detalhes da Solicitação</h2>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Recebido em: {selectedRequest.timestamp} • <strong>Voo em: {selectedRequest.legs?.[0]?.date}</strong>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ padding: '12px 24px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}>
                                {isEditing ? editedRequest.aircraft?.name : selectedRequest.aircraft?.name}
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={handleStartEdit}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-muted)',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease',
                                        fontWeight: '500'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                >
                                    <Edit size={14} /> Editar Solicitação
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="premium-button"
                                        style={{ background: '#34d399', color: '#000', padding: '12px 24px' }}
                                    >
                                        <Save size={18} /> Salvar
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="premium-button"
                                        style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', padding: '12px 24px' }}
                                    >
                                        <X size={18} /> Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {selectedRequest.observation && (
                        <div style={{ marginBottom: '32px', padding: '20px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '16px', color: '#fbbf24' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                                <AlertCircle size={18} /> Observação da Pendência:
                            </div>
                            <p style={{ margin: 0, fontStyle: 'italic' }}>"{selectedRequest.observation}"</p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '48px' }}>
                        <div className="glass-morphism" style={{ padding: '24px', borderRadius: '20px' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={18} /> Dados do Cliente
                            </h4>
                            {isEditing ? (
                                <>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome:</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={editedRequest.name}
                                            onChange={(e) => handleEditChange('name', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Solicitante:</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={editedRequest.requestor || ''}
                                            onChange={(e) => handleEditChange('requestor', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>E-mail:</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            value={editedRequest.email}
                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p style={{ marginBottom: '8px', padding: isModified('name', selectedRequest.name) ? '4px 8px' : '0', background: isModified('name', selectedRequest.name) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                        <strong>Cliente:</strong> {selectedRequest.name} {isModified('name', selectedRequest.name) && <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '8px' }}>(ALTERADO)</span>}
                                    </p>
                                    <p style={{ marginBottom: '8px', padding: isModified('requestor', selectedRequest.requestor) ? '4px 8px' : '0', background: isModified('requestor', selectedRequest.requestor) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                        <strong>Solicitante:</strong> {selectedRequest.requestor || 'Não informado'} {isModified('requestor', selectedRequest.requestor) && <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '8px' }}>(ALTERADO)</span>}
                                    </p>
                                    <p style={{ padding: isModified('email', selectedRequest.email) ? '4px 8px' : '0', background: isModified('email', selectedRequest.email) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                        <strong>E-mail:</strong> {selectedRequest.email} {isModified('email', selectedRequest.email) && <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '8px' }}>(ALTERADO)</span>}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="glass-morphism" style={{ padding: '24px', borderRadius: '20px' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plane size={18} /> Aeronave
                            </h4>
                            <p style={{ marginBottom: '8px' }}><strong>Modelo:</strong> {isEditing ? editedRequest.aircraft?.name : selectedRequest.aircraft?.name}</p>
                            <p><strong>Configuração:</strong> {isEditing ? editedRequest.aircraft?.passengers : selectedRequest.aircraft?.passengers} PAX / {isEditing ? editedRequest.aircraft?.type : selectedRequest.aircraft?.type}</p>
                        </div>
                    </div>

                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Cronograma de Voo ({isEditing ? editedRequest.legs?.length : selectedRequest.legs?.length} Trechos)
                    </h3>

                    {(isEditing ? editedRequest.legs : selectedRequest.legs)?.map((leg, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '20px',
                            padding: '32px',
                            marginBottom: '24px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <span style={{ background: 'var(--primary)', color: '#000', width: '24px', height: '24px', borderRadius: '50%', textAlign: 'center', fontSize: '0.8rem', lineHeight: '24px', fontWeight: 'bold' }}>{idx + 1}</span>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={leg.origin}
                                                onChange={(e) => handleEditLegChange(idx, 'origin', e.target.value)}
                                                placeholder="Origem"
                                                style={{ width: '100%' }}
                                                onFocus={() => leg.origin && handleEditLegChange(idx, 'origin', leg.origin)}
                                            />
                                            {activeAutocomplete.index === idx && activeAutocomplete.field === 'origin' && activeAutocomplete.results.length > 0 && (
                                                <div className="autocomplete-dropdown" style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 1000,
                                                    background: '#1a1a1a',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    marginTop: '4px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {activeAutocomplete.results.map((ap) => (
                                                        <div
                                                            key={ap.icao}
                                                            onClick={() => selectAirport(idx, 'origin', ap)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                fontSize: '0.85rem'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(251, 191, 36, 0.1)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            {ap.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ color: 'var(--primary)' }}>→</span>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={leg.destination}
                                                onChange={(e) => handleEditLegChange(idx, 'destination', e.target.value)}
                                                placeholder="Destino"
                                                style={{ width: '100%' }}
                                                onFocus={() => leg.destination && handleEditLegChange(idx, 'destination', leg.destination)}
                                            />
                                            {activeAutocomplete.index === idx && activeAutocomplete.field === 'destination' && activeAutocomplete.results.length > 0 && (
                                                <div className="autocomplete-dropdown" style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 1000,
                                                    background: '#1a1a1a',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    marginTop: '4px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {activeAutocomplete.results.map((ap) => (
                                                        <div
                                                            key={ap.icao}
                                                            onClick={() => selectAirport(idx, 'destination', ap)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                fontSize: '0.85rem'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = 'rgba(251, 191, 36, 0.1)'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            {ap.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <h4 style={{ margin: 0, padding: (isModified('origin', leg.origin, idx) || isModified('destination', leg.destination, idx)) ? '4px 8px' : '0', background: (isModified('origin', leg.origin, idx) || isModified('destination', leg.destination, idx)) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                        {leg.origin} → {leg.destination} {(isModified('origin', leg.origin, idx) || isModified('destination', leg.destination, idx)) && <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '8px' }}>(ROTA ALTERADA)</span>}
                                    </h4>
                                )}
                            </div>

                            {isEditing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Data</p>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={leg.date}
                                            onChange={(e) => handleEditLegChange(idx, 'date', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Hora</p>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={leg.time}
                                            onChange={(e) => handleEditLegChange(idx, 'time', e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Passageiros</p>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={leg.passengers}
                                            onChange={(e) => handleEditLegChange(idx, 'passengers', e.target.value)}
                                            min="1"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Catering</p>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={leg.catering || ''}
                                            onChange={(e) => handleEditLegChange(idx, 'catering', e.target.value)}
                                            placeholder="Ex: Frutas e Sanduíches..."
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Lista de Passageiros</p>
                                        <textarea
                                            className="input-field"
                                            value={leg.passengerList || ''}
                                            onChange={(e) => handleEditLegChange(idx, 'passengerList', e.target.value)}
                                            placeholder="Nome e RG de cada passageiro..."
                                            style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Data e Hora</p>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: (isModified('date', leg.date, idx) || isModified('time', leg.time, idx)) ? '4px 8px' : '0', background: (isModified('date', leg.date, idx) || isModified('time', leg.time, idx)) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                                <Calendar size={16} color="var(--primary)" /> {leg.date} às {leg.time} {(isModified('date', leg.date, idx) || isModified('time', leg.time, idx)) && <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 'bold' }}>(EDITADO)</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Passageiros</p>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: (isModified('passengers', leg.passengers, idx) || isModified('passengerList', leg.passengerList, idx)) ? '4px 8px' : '0', background: (isModified('passengers', leg.passengers, idx) || isModified('passengerList', leg.passengerList, idx)) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                                <Users size={16} color="var(--primary)" /> {leg.passengers} PAX {(isModified('passengers', leg.passengers, idx) || isModified('passengerList', leg.passengerList, idx)) && <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 'bold' }}>(EDITADO)</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Catering</p>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: isModified('catering', leg.catering, idx) ? '4px 8px' : '0', background: isModified('catering', leg.catering, idx) ? 'rgba(251, 191, 36, 0.15)' : 'transparent', borderRadius: '4px' }}>
                                                <Coffee size={16} color="var(--primary)" /> {leg.catering || 'Padrão'} {isModified('catering', leg.catering, idx) && <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: 'bold' }}>(EDITADO)</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewingDetails({ type: 'full', leg, idx })}
                                        className="premium-button"
                                        style={{ width: '100%', justifyContent: 'center', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.9rem' }}
                                    >
                                        <FileText size={18} /> Detalhes do Voo
                                    </button>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Tripulação do Voo Section */}
                    <div className="glass-morphism" style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px', border: '1px solid var(--primary-light)' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FingerprintIcon size={20} /> TRIPULAÇÃO DO VOO
                        </h4>

                        {isEditing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {[0, 1].map((idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                            {idx === 0 ? 'Comandante' : 'Co-Piloto'}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input
                                                type="text"
                                                list="crew-list"
                                                className="input-field"
                                                placeholder="Nome Completo"
                                                value={editedRequest.crew?.[idx]?.name || ''}
                                                onChange={(e) => handleEditCrewChange(idx, 'name', e.target.value)}
                                                style={{ marginBottom: 0 }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Código ANAC"
                                                value={editedRequest.crew?.[idx]?.anac || ''}
                                                onChange={(e) => handleEditCrewChange(idx, 'anac', e.target.value)}
                                                style={{ marginBottom: 0 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <datalist id="crew-list">
                                    {crewDatabase.map(c => <option key={c.id} value={c.name} />)}
                                </datalist>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace' }}>
                                {selectedRequest.crew && selectedRequest.crew.some(c => c.name) ? (
                                    selectedRequest.crew.map((member, idx) => member.name && (
                                        <div key={idx} style={{ fontSize: '1.1rem', color: '#fff' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{idx + 1} - </span>
                                            <span style={{ fontWeight: 'bold' }}>{member.name}</span>
                                            <span style={{ color: 'var(--text-muted)' }}> - </span>
                                            <span style={{ color: 'var(--primary)' }}>{member.anac || '---'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum tripulante escalado para este voo.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedRequest.status === 'cancelamento' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '40px' }}>
                            <button
                                onClick={() => handleAction('cancelado', 'Cancelamento solicitado pelo cliente e confirmado pela coordenação.')}
                                className="premium-button"
                                style={{ background: '#ef4444', color: '#fff', justifyContent: 'center' }}
                            >
                                <CheckCircle size={20} /> Aprovar Cancelamento
                            </button>
                            <button
                                onClick={() => handleAction('aprovado', 'Solicitação de cancelamento recusada. Voo mantido.')}
                                className="premium-button"
                                style={{ background: 'transparent', border: '1px solid #34d399', color: '#34d399', justifyContent: 'center' }}
                            >
                                <X size={20} /> Recusar Cancelamento
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '40px' }}>
                            <button
                                onClick={() => handleAction('aprovado')}
                                className="premium-button"
                                style={{ background: '#34d399', color: '#000', justifyContent: 'center', opacity: isEditing ? 0.5 : 1 }}
                                disabled={isEditing}
                            >
                                <CheckCircle size={20} /> {selectedRequest.status === 'alteracao_solicitada' ? 'Aprovar Alteração' : 'Aprovar Solicitação'}
                            </button>
                            <button
                                onClick={() => {
                                    setPendingReason(selectedRequest.observation || '');
                                    setShowPendingModal(true);
                                }}
                                className="premium-button"
                                style={{ background: '#fbbf24', color: '#000', justifyContent: 'center', opacity: isEditing ? 0.5 : 1 }}
                                disabled={isEditing}
                            >
                                <AlertCircle size={20} /> Agendado com Pendência
                            </button>
                            <button
                                onClick={() => {
                                    setRefusalReason('');
                                    setShowRefusalModal(true);
                                }}
                                className="premium-button"
                                style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', justifyContent: 'center', opacity: isEditing ? 0.5 : 1 }}
                                disabled={isEditing}
                            >
                                <ShieldAlert size={20} /> Recusar
                            </button>
                        </div>
                    )
                    }

                </motion.div>

                <AnimatePresence>
                    {showPendingModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999, // Very high z-index
                            padding: '24px',
                            backdropFilter: 'blur(8px)' // Premium feel
                        }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-morphism"
                                style={{
                                    padding: '40px',
                                    borderRadius: '32px',
                                    maxWidth: '500px',
                                    width: '100%',
                                    border: '1px solid var(--primary)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24' }}>
                                        <AlertCircle /> Observação da Pendência
                                    </h3>
                                </div>

                                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '1rem' }}>
                                    Descreva abaixo o motivo da pendência para controle da coordenação.
                                </p>

                                <textarea
                                    className="input-field"
                                    style={{
                                        height: '140px',
                                        marginBottom: '32px',
                                        resize: 'none',
                                        padding: '16px',
                                        fontSize: '1rem',
                                        background: 'rgba(0,0,0,0.2)'
                                    }}
                                    placeholder="Ex: Aguardando disponibilidade da tripulação ou confirmação de slot..."
                                    value={pendingReason}
                                    onChange={(e) => setPendingReason(e.target.value)}
                                    autoFocus
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <button
                                        className="premium-button"
                                        style={{ background: '#fbbf24', color: '#000', justifyContent: 'center' }}
                                        onClick={() => handleAction('pendente', pendingReason)}
                                    >
                                        Gravar e Salvar
                                    </button>
                                    <button
                                        className="premium-button"
                                        style={{ background: 'transparent', border: '1px solid var(--glass-border)', justifyContent: 'center' }}
                                        onClick={() => {
                                            setShowPendingModal(false);
                                            setPendingReason('');
                                        }}
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                    }

                    {/* Refusal Reason Modal */}
                    {
                        showRefusalModal && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                padding: '24px',
                                backdropFilter: 'blur(8px)'
                            }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-morphism"
                                    style={{
                                        padding: '40px',
                                        borderRadius: '32px',
                                        maxWidth: '500px',
                                        width: '100%',
                                        border: '1px solid #f87171',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#f87171' }}>
                                            <ShieldAlert /> Motivo da Recusa
                                        </h3>
                                    </div>

                                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '1rem' }}>
                                        Informe o motivo pelo qual este voo não poderá ser realizado para que o cliente seja notificado.
                                    </p>

                                    <textarea
                                        className="input-field"
                                        style={{
                                            height: '140px',
                                            marginBottom: '32px',
                                            resize: 'none',
                                            padding: '16px',
                                            fontSize: '1rem',
                                            background: 'rgba(0,0,0,0.2)'
                                        }}
                                        placeholder="Ex: Aeronave em manutenção ou tripulação fora de jornada..."
                                        value={refusalReason}
                                        onChange={(e) => setRefusalReason(e.target.value)}
                                        autoFocus
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <button
                                            className="premium-button"
                                            style={{ background: '#f87171', color: '#fff', border: 'none', justifyContent: 'center' }}
                                            onClick={() => handleAction('recusado', refusalReason)}
                                        >
                                            Confirmar Recusa
                                        </button>
                                        <button
                                            className="premium-button"
                                            style={{ background: 'transparent', border: '1px solid var(--glass-border)', justifyContent: 'center' }}
                                            onClick={() => {
                                                setShowRefusalModal(false);
                                                setRefusalReason('');
                                            }}
                                        >
                                            Voltar
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )
                    }
                    {
                        viewingDetails && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism" style={{ padding: '40px', borderRadius: '32px', maxWidth: '600px', width: '100%', position: 'relative' }}>
                                    <button
                                        onClick={() => setViewingDetails(null)}
                                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        <X size={24} />
                                    </button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                        <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                                            {viewingDetails.type === 'pax' ? <Users size={24} color="var(--primary)" /> :
                                                viewingDetails.type === 'catering' ? <Coffee size={24} color="var(--primary)" /> :
                                                    <Plane size={24} color="var(--primary)" />}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0 }}>
                                                {viewingDetails.type === 'pax' ? 'Lista de Passageiros' :
                                                    viewingDetails.type === 'catering' ? 'Detalhes do Catering' :
                                                        'Detalhes e Edição do Voo'}
                                            </h3>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                Trecho {viewingDetails.idx + 1}: {viewingDetails.leg.origin} → {viewingDetails.leg.destination} • {viewingDetails.leg.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        border: '1px solid var(--glass-border)',
                                        maxHeight: '70vh',
                                        overflowY: 'auto',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
                                        {viewingDetails.type === 'full' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: 'monospace' }}>
                                                {/* 1ª ETAPA Header */}
                                                <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                    <div style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                                        {`|> ${viewingDetails.idx + 1}ª ETAPA <|`}
                                                    </div>
                                                    <div style={{ color: 'var(--glass-border)', marginTop: '-8px', marginBottom: '16px' }}>---------------------</div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Data:</span>
                                                            <input type="date" className="input-field" style={{ padding: '4px 8px', height: '32px', border: isModified('date', viewingDetails.leg.date, viewingDetails.idx) ? '1px solid #ef4444' : undefined, color: isModified('date', viewingDetails.leg.date, viewingDetails.idx) ? '#ef4444' : undefined }} value={viewingDetails.leg.date} onChange={(e) => updateLeg('date', e.target.value)} />
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Origem:</span>
                                                            <div style={{ position: 'relative' }}>
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '4px 8px', height: '32px', width: '100%', border: isModified('origin', viewingDetails.leg.origin, viewingDetails.idx) ? '1px solid #ef4444' : undefined, color: isModified('origin', viewingDetails.leg.origin, viewingDetails.idx) ? '#ef4444' : undefined }}
                                                                    value={viewingDetails.leg.origin}
                                                                    onChange={(e) => updateLeg('origin', e.target.value)}
                                                                    onFocus={() => viewingDetails.leg.origin && updateLeg('origin', viewingDetails.leg.origin)}
                                                                />
                                                                {activeAutocomplete.index === viewingDetails.idx && activeAutocomplete.field === 'origin' && activeAutocomplete.results.length > 0 && (
                                                                    <div className="autocomplete-dropdown" style={{
                                                                        position: 'absolute',
                                                                        top: '100%',
                                                                        left: 0,
                                                                        right: 0,
                                                                        zIndex: 1000,
                                                                        background: '#1a1a1a',
                                                                        border: '1px solid var(--glass-border)',
                                                                        borderRadius: '8px',
                                                                        marginTop: '4px',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                                        maxHeight: '200px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        {activeAutocomplete.results.map((ap) => (
                                                                            <div
                                                                                key={ap.icao}
                                                                                onClick={() => selectAirport(viewingDetails.idx, 'origin', ap, true)}
                                                                                style={{
                                                                                    padding: '8px 12px',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                                    fontSize: '0.85rem'
                                                                                }}
                                                                                onMouseEnter={(e) => e.target.style.background = 'rgba(251, 191, 36, 0.1)'}
                                                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                                            >
                                                                                {ap.label}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>DESTINO:</span>
                                                            <div style={{ position: 'relative' }}>
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '4px 8px', height: '32px', width: '100%', border: isModified('destination', viewingDetails.leg.destination, viewingDetails.idx) ? '1px solid #ef4444' : undefined, color: isModified('destination', viewingDetails.leg.destination, viewingDetails.idx) ? '#ef4444' : undefined }}
                                                                    value={viewingDetails.leg.destination}
                                                                    onChange={(e) => updateLeg('destination', e.target.value)}
                                                                    onFocus={() => viewingDetails.leg.destination && updateLeg('destination', viewingDetails.leg.destination)}
                                                                />
                                                                {activeAutocomplete.index === viewingDetails.idx && activeAutocomplete.field === 'destination' && activeAutocomplete.results.length > 0 && (
                                                                    <div className="autocomplete-dropdown" style={{
                                                                        position: 'absolute',
                                                                        top: '100%',
                                                                        left: 0,
                                                                        right: 0,
                                                                        zIndex: 1000,
                                                                        background: '#1a1a1a',
                                                                        border: '1px solid var(--glass-border)',
                                                                        borderRadius: '8px',
                                                                        marginTop: '4px',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                                        maxHeight: '200px',
                                                                        overflowY: 'auto'
                                                                    }}>
                                                                        {activeAutocomplete.results.map((ap) => (
                                                                            <div
                                                                                key={ap.icao}
                                                                                onClick={() => selectAirport(viewingDetails.idx, 'destination', ap, true)}
                                                                                style={{
                                                                                    padding: '8px 12px',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                                                    fontSize: '0.85rem'
                                                                                }}
                                                                                onMouseEnter={(e) => e.target.style.background = 'rgba(251, 191, 36, 0.1)'}
                                                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                                            >
                                                                                {ap.label}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Horário:</span>
                                                            <input type="time" className="input-field" style={{ padding: '4px 8px', height: '32px', border: isModified('time', viewingDetails.leg.time, viewingDetails.idx) ? '1px solid #ef4444' : undefined, color: isModified('time', viewingDetails.leg.time, viewingDetails.idx) ? '#ef4444' : undefined }} value={viewingDetails.leg.time} onChange={(e) => updateLeg('time', e.target.value)} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>Plano de voo:</span>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    {['pendente', 'em_analise', 'aprovado'].map((status) => {
                                                                        const isSelected = viewingDetails.leg.flightPlanStatus === status;
                                                                        let bg = 'transparent';
                                                                        let color = 'var(--text-muted)';
                                                                        let border = 'var(--glass-border)';

                                                                        if (isSelected) {
                                                                            if (status === 'pendente') {
                                                                                bg = '#ef4444'; // Red
                                                                                color = '#fff';
                                                                                border = '#ef4444';
                                                                            } else {
                                                                                bg = 'var(--primary)';
                                                                                color = '#000';
                                                                                border = 'var(--primary)';
                                                                            }
                                                                        }

                                                                        return (
                                                                            <button
                                                                                key={status}
                                                                                onClick={() => updateLeg('flightPlanStatus', status)}
                                                                                style={{
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '4px',
                                                                                    border: `1px solid ${border}`,
                                                                                    background: bg,
                                                                                    color: color,
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.7rem',
                                                                                    fontWeight: 'bold',
                                                                                    textTransform: 'uppercase'
                                                                                }}
                                                                            >
                                                                                {status.replace('_', ' ')}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                            {viewingDetails.leg.flightPlanStatus === 'aprovado' && (
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '4px 8px', height: '32px', width: '100%' }}
                                                                    placeholder="Cole o link ou código do plano..."
                                                                    value={viewingDetails.leg.flightPlan || ''}
                                                                    onChange={(e) => updateLeg('flightPlan', e.target.value)}
                                                                    autoFocus
                                                                />
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Slot Alocado:</span>
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button
                                                                        onClick={() => updateLeg('hasAllocatedSlot', true)}
                                                                        style={{
                                                                            padding: '2px 10px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid var(--primary)',
                                                                            background: viewingDetails.leg.hasAllocatedSlot !== false ? 'var(--primary)' : 'transparent',
                                                                            color: viewingDetails.leg.hasAllocatedSlot !== false ? '#000' : 'var(--primary)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.65rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        SIM
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            updateLeg({
                                                                                hasAllocatedSlot: false,
                                                                                allocatedSlot: '',
                                                                                allocatedSlotType: ''
                                                                            });
                                                                        }}
                                                                        style={{
                                                                            padding: '2px 10px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid var(--text-muted)',
                                                                            background: viewingDetails.leg.hasAllocatedSlot === false ? 'var(--text-muted)' : 'transparent',
                                                                            color: viewingDetails.leg.hasAllocatedSlot === false ? '#000' : 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.65rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        NÃO
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {viewingDetails.leg.hasAllocatedSlot !== false && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo:</span>
                                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                                            <button
                                                                                onClick={() => updateLeg('allocatedSlotType', 'PRINCIPAL')}
                                                                                style={{
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid ' + (viewingDetails.leg.allocatedSlotType === 'PRINCIPAL' ? 'var(--primary)' : 'var(--glass-border)'),
                                                                                    background: viewingDetails.leg.allocatedSlotType === 'PRINCIPAL' ? 'var(--primary)' : 'transparent',
                                                                                    color: viewingDetails.leg.allocatedSlotType === 'PRINCIPAL' ? '#000' : 'var(--text-muted)',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.6rem',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            >
                                                                                PRINCIPAL
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateLeg('allocatedSlotType', 'AUXILIAR')}
                                                                                style={{
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid ' + (viewingDetails.leg.allocatedSlotType === 'AUXILIAR' ? 'var(--primary)' : 'var(--glass-border)'),
                                                                                    background: viewingDetails.leg.allocatedSlotType === 'AUXILIAR' ? 'var(--primary)' : 'transparent',
                                                                                    color: viewingDetails.leg.allocatedSlotType === 'AUXILIAR' ? '#000' : 'var(--text-muted)',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.6rem',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            >
                                                                                AUXILIAR
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        className="input-field"
                                                                        style={{ padding: '4px 8px', height: '30px', width: '100%', fontSize: '0.8rem' }}
                                                                        placeholder="Identificação do slot..."
                                                                        value={viewingDetails.leg.allocatedSlot || ''}
                                                                        onChange={(e) => updateLeg('allocatedSlot', e.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 193, 7, 0.1)', paddingTop: '12px' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>Notam:</span>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!viewingDetails.leg.hasNotam) {
                                                                                addNotamField();
                                                                            }
                                                                            updateLeg({ hasNotam: true, notamStatus: 'sim' });
                                                                        }}
                                                                        style={{
                                                                            padding: '4px 12px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid ' + (viewingDetails.leg.notamStatus === 'sim' ? 'var(--primary)' : 'var(--glass-border)'),
                                                                            background: viewingDetails.leg.notamStatus === 'sim' ? 'var(--primary)' : 'transparent',
                                                                            color: viewingDetails.leg.notamStatus === 'sim' ? '#000' : 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        SIM
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            updateLeg({
                                                                                hasNotam: false,
                                                                                notamStatus: 'nao',
                                                                                notamData: [],
                                                                                notam: 'NENHUM NOTAM QUE IMPACTE NA OPERAÇÃO'
                                                                            });
                                                                        }}
                                                                        style={{
                                                                            padding: '4px 12px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid ' + (viewingDetails.leg.notamStatus === 'nao' ? 'var(--text-muted)' : 'var(--glass-border)'),
                                                                            background: viewingDetails.leg.notamStatus === 'nao' ? 'var(--text-muted)' : 'transparent',
                                                                            color: viewingDetails.leg.notamStatus === 'nao' ? '#000' : 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        NÃO
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateLeg({ notamStatus: 'pendente', hasNotam: true })}
                                                                        style={{
                                                                            padding: '4px 12px',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid ' + ((viewingDetails.leg.notamStatus === 'pendente' || !viewingDetails.leg.notamStatus) ? '#ef4444' : 'var(--glass-border)'),
                                                                            background: (viewingDetails.leg.notamStatus === 'pendente' || !viewingDetails.leg.notamStatus) ? '#ef4444' : 'transparent',
                                                                            color: (viewingDetails.leg.notamStatus === 'pendente' || !viewingDetails.leg.notamStatus) ? '#fff' : 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        PENDENTE
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {viewingDetails.leg.hasNotam === false && (
                                                            <div style={{ paddingLeft: '12px', marginTop: '12px' }}>
                                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>NENHUM NOTAM QUE IMPACTE NA OPERAÇÃO</p>
                                                            </div>
                                                        )}

                                                        {viewingDetails.leg.hasNotam && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px', marginTop: '12px' }}>
                                                                {(Array.isArray(viewingDetails.leg.notamData) ? viewingDetails.leg.notamData : []).map((ntm, nIdx) => (
                                                                    <div key={nIdx} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: '8px', alignItems: 'center' }}>
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{nIdx + 1}.</span>
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            style={{ padding: '4px 8px', height: '32px' }}
                                                                            placeholder="Descreva o NOTAM..."
                                                                            value={ntm}
                                                                            onChange={(e) => updateNotam(nIdx, e.target.value)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                                    <button
                                                                        onClick={addNotamField}
                                                                        style={{
                                                                            alignSelf: 'flex-start',
                                                                            background: 'none',
                                                                            border: '1px dashed var(--glass-border)',
                                                                            color: 'var(--text-muted)',
                                                                            padding: '4px 12px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '0.7rem',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        + ADICIONAR NOTAM
                                                                    </button>
                                                                    {Array.isArray(viewingDetails.leg.notamData) && viewingDetails.leg.notamData.length > 0 && (
                                                                        <button
                                                                            onClick={() => removeNotamField((viewingDetails.leg.notamData || []).length - 1)}
                                                                            style={{
                                                                                alignSelf: 'flex-start',
                                                                                background: 'rgba(248, 113, 113, 0.1)',
                                                                                border: '1px solid rgba(248, 113, 113, 0.2)',
                                                                                color: '#f87171',
                                                                                padding: '4px 12px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.7rem',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            - REMOVER ÚLTIMO
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px', width: '80px', fontStyle: 'italic', marginTop: '8px' }} placeholder="*SIG*" value={viewingDetails.leg.notamSign || ''} onChange={(e) => updateLeg('notamSign', e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* Combustível Section */}
                                                <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', marginBottom: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>COMBUSTÍVEL:</span>
                                                        <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px' }} value={viewingDetails.leg.fuelLocation || viewingDetails.leg.origin || ''} onChange={(e) => updateLeg('fuelLocation', e.target.value)} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                                                        {(() => {
                                                            const prices = [
                                                                { id: 'fuelShell', label: '- Shell:', val: viewingDetails.leg.fuelShell },
                                                                { id: 'fuelBR', label: '- BR:', val: viewingDetails.leg.fuelBR },
                                                                { id: 'fuelAirBp', label: '- AirBp:', val: viewingDetails.leg.fuelAirBp }
                                                            ].map(p => {
                                                                const num = parseFloat(p.val?.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
                                                                return { ...p, numeric: isNaN(num) || num === 0 ? Infinity : num };
                                                            });

                                                            const minPrice = Math.min(...prices.map(p => p.numeric));
                                                            const cheapestId = minPrice !== Infinity ? prices.find(p => p.numeric === minPrice)?.id : null;

                                                            return prices.map((p) => (
                                                                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                                                                    <span style={{
                                                                        color: p.id === cheapestId ? '#22c55e' : 'var(--text-muted)',
                                                                        fontWeight: p.id === cheapestId ? 'bold' : 'normal'
                                                                    }}>
                                                                        {p.label} {p.id === cheapestId && ' (MELHOR)'}
                                                                    </span>
                                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                        <span style={{
                                                                            position: 'absolute',
                                                                            left: '10px',
                                                                            color: 'var(--text-muted)',
                                                                            fontSize: '0.8rem',
                                                                            pointerEvents: 'none'
                                                                        }}>
                                                                            R$
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            style={{
                                                                                padding: '4px 8px 4px 30px',
                                                                                height: '32px',
                                                                                width: '100%',
                                                                                border: p.id === cheapestId ? '1px solid #22c55e' : '1px solid var(--glass-border)',
                                                                                boxShadow: p.id === cheapestId ? '0 0 10px rgba(34, 197, 94, 0.1)' : 'none'
                                                                            }}
                                                                            placeholder="0,00"
                                                                            value={p.val || ''}
                                                                            onChange={(e) => updateLeg(p.id, e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                        <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px', width: '80px', fontStyle: 'italic', marginTop: '4px' }} placeholder="*SIG*" value={viewingDetails.leg.fuelSign || ''} onChange={(e) => updateLeg('fuelSign', e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* Passageiros Section */}
                                                <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px', marginBottom: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>PASSAGEIROS:</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', marginBottom: '24px' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Total PAX:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <input
                                                                type="number"
                                                                className="input-field"
                                                                style={{ padding: '4px 8px', height: '32px', width: '80px' }}
                                                                value={viewingDetails.leg.isEmptyLeg ? 0 : viewingDetails.leg.passengers}
                                                                onChange={(e) => {
                                                                    updateLeg('passengers', e.target.value);
                                                                }}
                                                                disabled={viewingDetails.leg.isEmptyLeg}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    updateLeg('isEmptyLeg', !viewingDetails.leg.isEmptyLeg);
                                                                }}
                                                                style={{
                                                                    padding: '4px 16px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid ' + (viewingDetails.leg.isEmptyLeg ? 'var(--primary)' : 'var(--glass-border)'),
                                                                    background: viewingDetails.leg.isEmptyLeg ? 'var(--primary)' : 'transparent',
                                                                    color: viewingDetails.leg.isEmptyLeg ? '#000' : 'var(--text-muted)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                TRANSLADO
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {viewingDetails.leg.isEmptyLeg ? (
                                                            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                                                <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>VOO DE TRANSLADO</p>
                                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Nenhum passageiro a bordo para este trecho.</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {(Array.isArray(viewingDetails.leg.passengerData) ? viewingDetails.leg.passengerData : []).map((pax, pIdx) => (
                                                                    <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{pIdx + 1}.</span>
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            placeholder="Nome do Passageiro"
                                                                            style={{ padding: '4px 8px', height: '36px' }}
                                                                            value={pax.name || ''}
                                                                            onChange={(e) => updatePassenger(pIdx, 'name', e.target.value)}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            placeholder="Documento (CPF/RG)"
                                                                            style={{ padding: '4px 8px', height: '36px' }}
                                                                            value={pax.document || ''}
                                                                            onChange={(e) => updatePassenger(pIdx, 'document', e.target.value)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                                {(!viewingDetails.leg.passengerData || viewingDetails.leg.passengerData.length === 0) && (
                                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Defina a quantidade de passageiros acima.</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Comissaria Section */}
                                                <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>COMISSARIA:</div>
                                                        <button
                                                            onClick={() => {
                                                                const isStandard = !viewingDetails.leg.isStandardCatering;
                                                                updateLeg({
                                                                    isStandardCatering: isStandard,
                                                                    catering: isStandard ? 'PADRAO' : '',
                                                                    cateringEstablishment: isStandard ? 'PADRAO' : ''
                                                                });
                                                            }}
                                                            style={{
                                                                padding: '4px 12px',
                                                                borderRadius: '4px',
                                                                border: '1px solid ' + (viewingDetails.leg.isStandardCatering ? 'var(--primary)' : 'var(--glass-border)'),
                                                                background: viewingDetails.leg.isStandardCatering ? 'var(--primary)' : 'transparent',
                                                                color: viewingDetails.leg.isStandardCatering ? '#000' : 'var(--text-muted)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            PADRAO
                                                        </button>
                                                    </div>

                                                    {viewingDetails.leg.isStandardCatering ? (
                                                        <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px' }}>PADRAO</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', marginBottom: '12px' }}>
                                                                <span style={{ color: 'var(--text-muted)' }}>ESTABELECIMENTO:</span>
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }}
                                                                    placeholder="CATERING"
                                                                    value={viewingDetails.leg.cateringEstablishment || ''}
                                                                    onChange={(e) => updateLeg('cateringEstablishment', e.target.value)}
                                                                />
                                                            </div>
                                                            <textarea
                                                                className="input-field"
                                                                style={{ minHeight: '80px', width: '100%', padding: '12px' }}
                                                                placeholder="Detalhes do catering..."
                                                                value={viewingDetails.leg.catering || ''}
                                                                onChange={(e) => updateLeg('catering', e.target.value)}
                                                            />
                                                            <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px', width: '80px', fontStyle: 'italic', marginTop: '8px' }} placeholder="*SIG*" value={viewingDetails.leg.cateringSign || ''} onChange={(e) => updateLeg('cateringSign', e.target.value)} />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Hotel Section */}
                                                <div style={{ background: 'rgba(255, 193, 7, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>HOTEL PARA A TRIPULAÇÃO:</div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => updateLeg('hasHotel', true)}
                                                                style={{
                                                                    padding: '4px 16px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--primary)',
                                                                    background: viewingDetails.leg.hasHotel !== false ? 'var(--primary)' : 'transparent',
                                                                    color: viewingDetails.leg.hasHotel !== false ? '#000' : 'var(--primary)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                SIM
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    updateLeg({
                                                                        hasHotel: false,
                                                                        hotelName: '',
                                                                        hotelDetails: ''
                                                                    });
                                                                }}
                                                                style={{
                                                                    padding: '4px 16px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--text-muted)',
                                                                    background: viewingDetails.leg.hasHotel === false ? 'var(--text-muted)' : 'transparent',
                                                                    color: viewingDetails.leg.hasHotel === false ? '#000' : 'var(--text-muted)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                NÃO
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {viewingDetails.leg.hasHotel === false ? (
                                                        <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '2px' }}>NÃO</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', width: 'fit-content' }}>
                                                                <button
                                                                    onClick={() => updateLeg('hotelStatus', 'pendente')}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid ' + ((viewingDetails.leg.hotelStatus === 'pendente' || !viewingDetails.leg.hotelStatus) ? '#ef4444' : 'transparent'),
                                                                        background: (viewingDetails.leg.hotelStatus === 'pendente' || !viewingDetails.leg.hotelStatus) ? '#ef4444' : 'transparent',
                                                                        color: (viewingDetails.leg.hotelStatus === 'pendente' || !viewingDetails.leg.hotelStatus) ? '#fff' : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'bold',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    PENDENTE
                                                                </button>
                                                                <button
                                                                    onClick={() => updateLeg('hotelStatus', 'reservado')}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid ' + (viewingDetails.leg.hotelStatus === 'reservado' ? 'var(--primary)' : 'transparent'),
                                                                        background: viewingDetails.leg.hotelStatus === 'reservado' ? 'var(--primary)' : 'transparent',
                                                                        color: viewingDetails.leg.hotelStatus === 'reservado' ? '#000' : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'bold',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    RESERVADO
                                                                </button>
                                                            </div>

                                                            {viewingDetails.leg.hotelStatus === 'reservado' && (
                                                                <>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', marginBottom: '12px' }}>
                                                                        <span style={{ color: 'var(--text-muted)' }}>NOME DO HOTEL:</span>
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            style={{ padding: '4px 8px', height: '32px' }}
                                                                            placeholder="Nome do estabelecimento"
                                                                            value={viewingDetails.leg.hotelName || ''}
                                                                            onChange={(e) => updateLeg('hotelName', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <textarea
                                                                        className="input-field"
                                                                        style={{ minHeight: '80px', width: '100%', padding: '12px' }}
                                                                        placeholder="Informações de reserva e hotel..."
                                                                        value={viewingDetails.leg.hotelDetails || ''}
                                                                        onChange={(e) => updateLeg('hotelDetails', e.target.value)}
                                                                    />
                                                                </>
                                                            )}
                                                            <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px', width: '80px', fontStyle: 'italic', marginTop: '8px' }} placeholder="*SIG*" value={viewingDetails.leg.hotelSign || ''} onChange={(e) => updateLeg('hotelSign', e.target.value)} />
                                                        </>
                                                    )}
                                                </div>

                                                {/* FBO Section */}
                                                <div style={{ background: 'rgba(34, 197, 94, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderLeft: '3px solid var(--primary)', paddingLeft: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.5px' }}>FBO:</span>
                                                            {viewingDetails.leg.hasFbo !== false && (
                                                                <input
                                                                    type="text"
                                                                    className="input-field"
                                                                    style={{ padding: '4px 8px', height: '32px', flex: 1, maxWidth: '300px', fontSize: '0.8rem' }}
                                                                    placeholder="EMPRESA OU HANGAR"
                                                                    value={viewingDetails.leg.fboCity || ''}
                                                                    onChange={(e) => updateLeg('fboCity', e.target.value)}
                                                                />
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                                            <button
                                                                onClick={() => updateLeg('hasFbo', true)}
                                                                style={{
                                                                    padding: '4px 16px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--primary)',
                                                                    background: viewingDetails.leg.hasFbo !== false ? 'var(--primary)' : 'transparent',
                                                                    color: viewingDetails.leg.hasFbo !== false ? '#000' : 'var(--primary)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                SIM
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    updateLeg({
                                                                        hasFbo: false,
                                                                        fboCity: '',
                                                                        fboDetails: '',
                                                                        fboStatus: ''
                                                                    });
                                                                }}
                                                                style={{
                                                                    padding: '4px 16px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid var(--text-muted)',
                                                                    background: viewingDetails.leg.hasFbo === false ? 'var(--text-muted)' : 'transparent',
                                                                    color: viewingDetails.leg.hasFbo === false ? '#000' : 'var(--text-muted)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                NÃO
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {viewingDetails.leg.hasFbo === false ? (
                                                        <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '2px' }}>NÃO</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', width: 'fit-content' }}>
                                                                <button
                                                                    onClick={() => updateLeg('fboStatus', 'pendente')}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid ' + ((viewingDetails.leg.fboStatus === 'pendente' || !viewingDetails.leg.fboStatus) ? '#ef4444' : 'transparent'),
                                                                        background: (viewingDetails.leg.fboStatus === 'pendente' || !viewingDetails.leg.fboStatus) ? '#ef4444' : 'transparent',
                                                                        color: (viewingDetails.leg.fboStatus === 'pendente' || !viewingDetails.leg.fboStatus) ? '#fff' : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'bold',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    PENDENTE
                                                                </button>
                                                                <button
                                                                    onClick={() => updateLeg('fboStatus', 'agendado')}
                                                                    style={{
                                                                        padding: '4px 12px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid ' + (viewingDetails.leg.fboStatus === 'agendado' ? '#22c55e' : 'transparent'),
                                                                        background: viewingDetails.leg.fboStatus === 'agendado' ? '#22c55e' : 'transparent',
                                                                        color: viewingDetails.leg.fboStatus === 'agendado' ? '#fff' : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'bold',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    AGENDADO
                                                                </button>
                                                            </div>

                                                            <textarea
                                                                className="input-field"
                                                                style={{ minHeight: '80px', width: '100%', padding: '12px' }}
                                                                placeholder="Endereço, contatos e informações FBO..."
                                                                value={viewingDetails.leg.fboDetails || ''}
                                                                onChange={(e) => updateLeg('fboDetails', e.target.value)}
                                                            />
                                                            <input type="text" className="input-field" style={{ padding: '4px 8px', height: '32px', width: '80px', fontStyle: 'italic', marginTop: '8px' }} placeholder="*SIG*" value={viewingDetails.leg.fboSign || ''} onChange={(e) => updateLeg('fboSign', e.target.value)} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                fontSize: '1.1rem',
                                                lineHeight: '1.6',
                                                color: '#fff',
                                                fontFamily: 'var(--font-main)'
                                            }}>
                                                {viewingDetails.type === 'pax'
                                                    ? (viewingDetails.leg.passengerList || 'Nenhum passageiro listado.')
                                                    : (viewingDetails.leg.catering || 'Catering padrão solicitado.')}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="premium-button"
                                        style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }}
                                        onClick={() => setViewingDetails(null)}
                                    >
                                        Fechar e Salvar
                                    </button>
                                </motion.div >
                            </div >
                        )
                    }
                </AnimatePresence >
            </div >
        );
    }


    const sortedRequests = [...requests].sort((a, b) => {
        // Prioridade de grupos: 
        // 1: Novo (Triagem imediata)
        // 2: Operational (Pendentes e Aprovados misturados por data)
        // 3: Concluido
        // 4: Recusado
        const getPriority = (status) => {
            if (status === 'novo' || status === 'cancelamento' || status === 'alteracao_solicitada') return 1;
            if (status === 'pendente' || status === 'aprovado') return 2;
            if (status === 'concluido') return 3;
            if (status === 'recusado' || status === 'cancelado') return 4;
            return 99;
        };

        const pA = getPriority(a.status);
        const pB = getPriority(b.status);

        if (pA !== pB) return pA - pB;

        // Dentro do mesmo grupo de prioridade, ordenar por data do primeiro trecho (ASC - mais próximo primeiro)
        const dateA = a.legs?.[0]?.date || '';
        const dateB = b.legs?.[0]?.date || '';

        // Para concluídos e recusados, talvez faça mais sentido o mais recente primeiro (DESC)? 
        // Mas o pedido focou em "mais próximo no topo" para pendentes/confirmados.
        return dateA.localeCompare(dateB);
    });

    const pendingCount = requests.filter(r => r.status === 'novo').length;
    const hasPending = pendingCount > 0;

    // Render home view
    if (currentView === 'home') {
        return <CoordinatorHome requests={sortedRequests} onNavigate={setCurrentView} />;
    }

    // Render flights by client view
    if (currentView === 'by-client') {
        return (
            <FlightsByClient
                requests={sortedRequests}
                onBack={() => setCurrentView('home')}
                onSelectRequest={setSelectedRequest}
            />
        );
    }

    // Render manage requesters view
    if (currentView === 'manage-requesters') {
        return (
            <ManageRequesters
                onBack={() => setCurrentView('home')}
                currentCoordinator={localStorage.getItem('currentCoordinator') || 'coordenador'}
            />
        );
    }

    // Render manage crew view
    if (currentView === 'manage-crew') {
        return (
            <ManageCrew
                onBack={() => setCurrentView('home')}
            />
        );
    }

    // Render flight panel view (original content)
    return (
        <div className="container" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
            <button
                onClick={() => setCurrentView('home')}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    marginBottom: 'clamp(16px, 4vw, 32px)',
                    fontSize: '1rem',
                    fontWeight: '600'
                }}
            >
                <ArrowLeft size={20} /> Voltar ao Painel
            </button>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(16px, 4vw, 32px)',
                marginBottom: 'clamp(32px, 8vw, 64px)',
                textAlign: 'center',
                width: '100%'
            }}>
                <h1 style={{
                    fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                    margin: 0,
                    lineHeight: '1.2',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    Controle de Solicitação de Voo
                </h1>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: '800px'
                }}>
                    <button
                        onClick={handleOpenManualFlight}
                        className="premium-button"
                        style={{
                            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                            color: '#000',
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            minWidth: 'clamp(160px, 45%, 200px)',
                            justifyContent: 'center'
                        }}
                    >
                        <Plus size={16} /> ADICIONAR VOO MANUAL
                    </button>
                    <div
                        className="glass-morphism"
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            background: hasPending ? 'rgba(248, 113, 113, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            border: hasPending ? '1px solid #f87171' : '1px solid rgba(148, 163, 184, 0.3)',
                            color: hasPending ? '#f87171' : '#94a3b8',
                            transition: 'all 0.3s ease',
                            fontWeight: hasPending ? 'bold' : 'normal',
                            minWidth: '140px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Clock size={16} style={{ marginRight: '8px' }} /> {pendingCount} Pendentes
                    </div>
                </div>
            </div>

            {hasPending && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                        border: '2px solid #ef4444',
                        padding: '24px',
                        borderRadius: '20px',
                        marginBottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)',
                        animation: 'pulse-border 2s infinite'
                    }}
                >
                    <div style={{ background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '2px' }}>ALERTA</div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Existem novas solicitações aguardando análise!</h3>
                </motion.div>
            )}

            {sortedRequests.length === 0 ? (
                <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                    <ListChecks size={48} color="var(--primary)" style={{ marginBottom: '24px', margin: '0 auto 24px' }} />
                    <h3>Nenhuma solicitação de voo encontrada</h3>
                    <p style={{ color: 'var(--text-muted)' }}>As solicitações enviadas pelos clientes aparecerão aqui para sua revisão.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {sortedRequests.map((req) => {
                        const statusInfo = getStatusInfo(req.status, req);

                        // User requested categories: Em Analise, Pendente, Aprovado, recusado
                        const getSimplifiedStatus = () => {
                            if (req.status === 'alteracao_solicitada' || (req.status === 'novo' && req.oldData)) return 'ALTERAÇÃO SOLICITADA';
                            if (req.status === 'novo') return 'EM ANÁLISE';
                            if (req.status === 'pendente') return 'PENDENTE';
                            if (req.status === 'aprovado' || req.status === 'concluido') return 'APROVADO';
                            if (req.status === 'recusado' || req.status === 'cancelado' || req.status === 'cancelamento') return 'RECUSADO';
                            return statusInfo.label.toUpperCase();
                        };

                        return (
                            <motion.div
                                key={req.id}
                                whileHover={{ scale: 1.01, x: 5 }}
                                onClick={() => setSelectedRequest(req)}
                                className="glass-morphism"
                                style={{
                                    padding: '24px 32px',
                                    borderRadius: '24px',
                                    cursor: 'pointer',
                                    fontFamily: 'Arial, sans-serif',
                                    borderLeft: `6px solid ${statusInfo.color}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1', minWidth: '300px' }}>
                                        {/* Aircraft and Requesting Company Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid var(--glass-border)',
                                                display: 'inline-block'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: '1' }}>
                                                    {req.aircraft?.name}
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

                                        {/* Stages List - Compact and Clean */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {(req.legs || []).map((leg, idx) => (
                                                <div key={idx} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: '#fff',
                                                    fontSize: '0.8rem',
                                                    fontFamily: 'Arial, sans-serif',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px'
                                                }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', minWidth: '75px' }}>{idx + 1}ª ETAPA -</span>
                                                    <span>{leg.origin}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
                                                    <span>{leg.destination}</span>
                                                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                                                    <span style={{ color: '#fff', opacity: 0.9 }}>{formatDateTime(leg.date, leg.time)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status Section with Timestamp Above */}
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6, fontFamily: 'Arial, sans-serif' }}>
                                            {req.timestamp}
                                        </div>
                                        <div style={{
                                            padding: '8px 20px',
                                            borderRadius: '24px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: `${statusInfo.color}15`,
                                            color: statusInfo.color,
                                            border: `2px solid ${statusInfo.color}`,
                                            whiteSpace: 'nowrap',
                                            letterSpacing: '1px',
                                            boxShadow: `0 0 10px ${statusInfo.color}15`
                                        }}>
                                            {getSimplifiedStatus()}
                                        </div>
                                        <ChevronRight size={24} color="var(--text-muted)" style={{ marginTop: 'auto' }} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Manual Flight Modal */}
            <AnimatePresence>
                {showManualFlightModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '24px',
                        backdropFilter: 'blur(8px)',
                        overflowY: 'auto'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-morphism"
                            style={{
                                padding: '40px',
                                borderRadius: '32px',
                                maxWidth: manualFlightStep === 'aircraft' ? '1200px' : '900px',
                                width: '100%',
                                border: '1px solid var(--primary)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={handleCancelManualFlight}
                                style={{
                                    position: 'absolute',
                                    top: '24px',
                                    right: '24px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', padding: '12px', borderRadius: '12px' }}>
                                    <Plus size={32} color="#000" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Adicionar Voo Manual</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {manualFlightStep === 'aircraft' ? 'Selecione a aeronave para o voo' : 'Preencha os dados do voo'}
                                    </p>
                                </div>
                            </div>

                            {manualFlightStep === 'aircraft' ? (
                                <>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1rem' }}>
                                        Escolha a aeronave que realizará este voo manual.
                                    </p>
                                    <AircraftSelector onSelect={handleAircraftSelect} />
                                </>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Plane size={20} color="var(--primary)" />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aeronave Selecionada:</p>
                                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedAircraftForManual?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <BookingForm
                                        selectedAircraft={selectedAircraftForManual}
                                        onSubmit={handleManualFlightSubmit}
                                        isManualFlight={true}
                                        onManualFlightSubmit={handleManualFlightSubmit}
                                    />
                                </>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Manual Pending Observation Modal */}
                {showManualPendingModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '24px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-morphism"
                            style={{
                                padding: '40px',
                                borderRadius: '32px',
                                maxWidth: '500px',
                                width: '100%',
                                border: '1px solid #fbbf24',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24' }}>
                                    <AlertCircle /> Observação do Voo Pendente
                                </h3>
                            </div>

                            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '1rem' }}>
                                Descreva o motivo da pendência deste voo manual para controle da coordenação.
                            </p>

                            <textarea
                                className="input-field"
                                style={{
                                    height: '140px',
                                    marginBottom: '32px',
                                    resize: 'none',
                                    padding: '16px',
                                    fontSize: '1rem',
                                    background: 'rgba(0,0,0,0.2)'
                                }}
                                placeholder="Ex: Aguardando confirmação do cliente ou disponibilidade da tripulação..."
                                value={manualPendingReason}
                                onChange={(e) => setManualPendingReason(e.target.value)}
                                autoFocus
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button
                                    className="premium-button"
                                    style={{ background: '#fbbf24', color: '#000', justifyContent: 'center' }}
                                    onClick={handleConfirmManualPending}
                                >
                                    Criar Voo Pendente
                                </button>
                                <button
                                    className="premium-button"
                                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', justifyContent: 'center' }}
                                    onClick={() => {
                                        setShowManualPendingModal(false);
                                        setManualPendingReason('');
                                    }}
                                >
                                    Voltar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
