import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Mail, Building2, CheckCircle, Clock, Edit, Trash2, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimestamp } from '../utils/dateUtils';

const AVAILABLE_COMPANIES = [
    'MRV&CO',
    'BANCO INTER',
    'RBF Participações',
    'LATAM Airlines',
    'Azul Linhas Aéreas',
    'GOL Linhas Aéreas'
];

import { getRequesters, upsertClient, deleteClient } from '../utils/supabaseClients';

export default function ManageRequesters({ onBack, currentCoordinator }) {
    const [requesters, setRequesters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companies: []
    });
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Sincronização inicial
    useEffect(() => {
        async function loadData() {
            const data = await getRequesters();
            if (data) {
                setRequesters(data);
                localStorage.setItem('requesters', JSON.stringify(data));
            } else {
                const stored = localStorage.getItem('requesters');
                if (stored) setRequesters(JSON.parse(stored));
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    const generateToken = () => {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.companies.length === 0) {
            alert('Selecione pelo menos uma empresa');
            return;
        }

        const emailExists = requesters.some(r =>
            r.email === formData.email && r.id !== editingId
        );
        if (emailExists) {
            alert('Este email já está cadastrado');
            return;
        }

        const token = generateToken();
        const link = `${window.location.origin}/?token=${token}`;

        const requesterData = editingId 
            ? { ...requesters.find(r => r.id === editingId), ...formData }
            : {
                ...formData,
                status: 'approved',
                token: token,
                createdAt: getTimestamp(),
                createdBy: currentCoordinator
            };

        const result = await upsertClient(requesterData);
        if (result) {
            if (editingId) {
                setRequesters(requesters.map(r => r.id === editingId ? result : r));
                setEditingId(null);
            } else {
                setRequesters([...requesters, result]);
                setGeneratedLink(link);
                setShowEmailModal(true);
            }
            setFormData({ name: '', email: '', password: '', companies: [] });
            setShowForm(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja excluir este solicitante?')) {
            const ok = await deleteClient(id);
            if (ok) {
                setRequesters(requesters.filter(r => r.id !== id));
            }
        }
    };

    const handleEdit = (requester) => {
        setFormData({
            name: requester.name,
            email: requester.email,
            companies: requester.companies
        });
        setEditingId(requester.id);
        setShowForm(true);
    };

    const handleResendInvite = (requester) => {
        const link = `${window.location.origin}/?token=${requester.token}`;
        setGeneratedLink(link);
        setShowEmailModal(true);
    };

    const toggleCompany = (company) => {
        setFormData(prev => ({
            ...prev,
            companies: prev.companies.includes(company)
                ? prev.companies.filter(c => c !== company)
                : [...prev.companies, company]
        }));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const pendingCount = requesters.filter(r => r.status === 'pending').length;

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Gerenciar Solicitantes</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        {requesters.length} {requesters.length === 1 ? 'solicitante cadastrado' : 'solicitantes cadastrados'}
                        {pendingCount > 0 && ` • ${pendingCount} ${pendingCount === 1 ? 'pendente' : 'pendentes'}`}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="premium-button"
                    style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                        color: '#fff',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {showForm ? <X size={18} /> : <UserPlus size={18} />}
                    {showForm ? 'Cancelar' : 'Novo Solicitante'}
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-morphism"
                        style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px', border: '2px solid #a855f7' }}
                    >
                        <h3 style={{ marginBottom: '24px', color: '#a855f7' }}>
                            {editingId ? 'Editar Solicitante' : 'Cadastrar Novo Solicitante'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label className="input-label">Nome Completo *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Email *</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Senha de Acesso *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        placeholder="Defina uma senha"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>
                                    Empresas que pode administrar *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {AVAILABLE_COMPANIES.map(company => (
                                        <label
                                            key={company}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px',
                                                background: formData.companies.includes(company) ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.05)',
                                                border: `2px solid ${formData.companies.includes(company) ? '#a855f7' : 'var(--glass-border)'}`,
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.companies.includes(company)}
                                                onChange={() => toggleCompany(company)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <Building2 size={16} color={formData.companies.includes(company) ? '#a855f7' : 'var(--text-muted)'} />
                                            <span style={{ fontSize: '0.9rem' }}>{company}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="premium-button"
                                style={{
                                    background: '#a855f7',
                                    color: '#fff',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <CheckCircle size={18} />
                                {editingId ? 'Salvar Alterações' : 'Cadastrar Solicitante'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {requesters.length === 0 ? (
                <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                    <UserPlus size={48} color="var(--primary)" style={{ margin: '0 auto 24px' }} />
                    <h3>Nenhum solicitante cadastrado</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Clique em "Novo Solicitante" para cadastrar.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {requesters.map(requester => (
                        <motion.div
                            key={requester.id}
                            whileHover={{ scale: 1.01, x: 5 }}
                            className="glass-morphism"
                            style={{
                                padding: '24px 32px',
                                borderRadius: '20px',
                                borderLeft: `4px solid ${requester.status === 'active' ? '#34d399' : '#f87171'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{requester.name}</h3>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            background: requester.status === 'active' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                            color: requester.status === 'active' ? '#34d399' : '#f87171',
                                            border: `1px solid ${requester.status === 'active' ? '#34d399' : '#f87171'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {requester.status === 'active' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {requester.status === 'active' ? 'ATIVO' : 'AGUARDANDO SENHA'}
                                        </div>
                                    </div>
                                    <p style={{ margin: '4px 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={16} /> {requester.email}
                                    </p>
                                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {requester.companies.map(company => (
                                            <span
                                                key={company}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: 'rgba(168, 85, 247, 0.1)',
                                                    border: '1px solid #a855f7',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    color: '#a855f7',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Building2 size={12} />
                                                {company}
                                            </span>
                                        ))}
                                    </div>
                                    <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Cadastrado em {requester.createdAt} por {requester.createdBy}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {requester.status === 'pending' && (
                                        <button
                                            onClick={() => handleResendInvite(requester)}
                                            className="premium-button"
                                            style={{
                                                background: 'rgba(248, 113, 113, 0.1)',
                                                border: '1px solid #f87171',
                                                color: '#f87171',
                                                padding: '8px 16px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <Mail size={16} /> Reenviar Convite
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(requester)}
                                        className="premium-button"
                                        style={{
                                            background: 'rgba(96, 165, 250, 0.1)',
                                            border: '1px solid #60a5fa',
                                            color: '#60a5fa',
                                            padding: '8px 16px'
                                        }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(requester.id)}
                                        className="premium-button"
                                        style={{
                                            background: 'rgba(248, 113, 113, 0.1)',
                                            border: '1px solid #f87171',
                                            color: '#f87171',
                                            padding: '8px 16px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Email Modal */}
            <AnimatePresence>
                {showEmailModal && (
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
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-morphism"
                            style={{
                                padding: '40px',
                                borderRadius: '32px',
                                maxWidth: '600px',
                                width: '100%',
                                border: '2px solid #a855f7'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px'
                                }}>
                                    <Mail size={40} color="#fff" />
                                </div>
                                <h2 style={{ marginBottom: '8px', color: '#a855f7' }}>✉️ Convite Enviado!</h2>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    O solicitante receberá um email com instruções para definir a senha.
                                </p>
                            </div>

                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '20px',
                                borderRadius: '16px',
                                marginBottom: '24px'
                            }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    Link de acesso:
                                </p>
                                <div style={{
                                    background: 'rgba(0,0,0,0.4)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    wordBreak: 'break-all',
                                    marginBottom: '12px',
                                    color: '#a855f7'
                                }}>
                                    {generatedLink}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="premium-button"
                                    style={{
                                        background: linkCopied ? '#34d399' : '#a855f7',
                                        color: '#fff',
                                        width: '100%',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {linkCopied ? <Check size={18} /> : <Copy size={18} />}
                                    {linkCopied ? 'Link Copiado!' : 'Copiar Link'}
                                </button>
                            </div>

                            <div style={{
                                background: 'rgba(248, 113, 113, 0.1)',
                                border: '1px solid #f87171',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px'
                            }}>
                                <p style={{ fontSize: '0.85rem', color: '#f87171', margin: 0 }}>
                                    ℹ️ Desenvolvimento Local: Como este é um ambiente de desenvolvimento,
                                    compartilhe este link manualmente com o solicitante.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="premium-button"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--glass-border)',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
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
