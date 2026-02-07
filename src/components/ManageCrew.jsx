import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Fingerprint, Trash2, Edit, CheckCircle, X, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, getTimestamp } from '../utils/dateUtils';

const docTypes = [
    { id: 'cma', label: 'CMA' },
    { id: 'ifr', label: 'IFR' },
    { id: 'mono', label: 'Mono' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'passport', label: 'Passaporte' },
    { id: 'icao', label: 'ICAO' }
];

import { getCrew, upsertCrewMember, deleteCrewMember } from '../utils/supabaseCrew';

export default function ManageCrew({ onBack }) {
    const [crew, setCrew] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editDocModal, setEditDocModal] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        anac: '',
        email: '',
        password: '',
        docs: docTypes.reduce((acc, doc) => ({
            ...acc,
            [doc.id]: { renewal: '', expiration: '' }
        }), {})
    });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Sincronização inicial com Supabase
    useEffect(() => {
        async function loadData() {
            const data = await getCrew();
            if (data) {
                setCrew(data);
                localStorage.setItem('crew_members', JSON.stringify(data));
            } else {
                const stored = localStorage.getItem('crew_members');
                if (stored) setCrew(JSON.parse(stored));
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    const handleDocUpdate = async (e) => {
        e.preventDefault();
        const member = crew.find(c => c.id === editDocModal.memberId);
        if (!member) return;

        const updatedMember = {
            ...member,
            docs: {
                ...(member.docs || {}),
                [editDocModal.docId]: {
                    renewal: editDocModal.renewal,
                    expiration: editDocModal.expiration
                }
            }
        };

        const result = await upsertCrewMember(updatedMember);
        if (result) {
            setCrew(crew.map(c => c.id === editDocModal.memberId ? updatedMember : c));
            setEditDocModal(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const anacExists = crew.some(c =>
            c.anac.toLowerCase() === formData.anac.toLowerCase() && c.id !== editingId
        );
        if (anacExists) {
            alert('Este código ANAC já está cadastrado para outro tripulante');
            return;
        }

        const memberData = editingId 
            ? { ...crew.find(c => c.id === editingId), ...formData }
            : {
                ...formData,
                createdAt: getTimestamp()
            };

        const result = await upsertCrewMember(memberData);
        if (result) {
            if (editingId) {
                setCrew(crew.map(c => c.id === editingId ? result : c));
                setEditingId(null);
            } else {
                setCrew([...crew, result]);
            }
            setFormData({ 
                name: '', 
                anac: '', 
                email: '', 
                password: '', 
                docs: docTypes.reduce((acc, doc) => ({ ...acc, [doc.id]: { renewal: '', expiration: '' } }), {}) 
            });
            setShowForm(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja remover este tripulante?')) {
            const ok = await deleteCrewMember(id);
            if (ok) {
                setCrew(crew.filter(c => c.id !== id));
            }
        }
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            anac: member.anac,
            docs: member.docs || docTypes.reduce((acc, doc) => ({
                ...acc,
                [doc.id]: { renewal: '', expiration: '' }
            }), {})
        });
        setEditingId(member.id);
        setShowForm(true);
    };

    const filteredCrew = crew.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.anac.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

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
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Gerenciar Tripulação</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        {crew.length} {crew.length === 1 ? 'tripulante cadastrado' : 'tripulantes cadastrados'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar tripulante..."
                            className="input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px', width: '250px', marginBottom: 0 }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (showForm) {
                                setEditingId(null);
                                setFormData({ 
                                    name: '', 
                                    anac: '', 
                                    email: '', 
                                    password: '', 
                                    docs: docTypes.reduce((acc, doc) => ({ ...acc, [doc.id]: { renewal: '', expiration: '' } }), {}) 
                                });
                            }
                            setShowForm(!showForm);
                        }}
                        className="premium-button"
                        style={{
                            background: 'var(--primary)',
                            color: '#000',
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {showForm ? <X size={18} /> : <UserPlus size={18} />}
                        {showForm ? 'Cancelar' : 'Novo Tripulante'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-morphism"
                        style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px', border: '1px solid var(--primary)' }}
                    >
                        <h3 style={{ marginBottom: '24px', color: 'var(--primary)' }}>
                            {editingId ? 'Editar Tripulante' : 'Cadastrar Novo Tripulante'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label className="input-label">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: Wellington Oliveira"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label className="input-label">Código ANAC</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.anac}
                                        onChange={(e) => setFormData({ ...formData, anac: e.target.value })}
                                        required
                                        placeholder="Ex: 123456"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label className="input-label">E-mail Corporativo</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="ex@milaviacao.com"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label className="input-label">Senha de Acesso</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '24px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                marginBottom: '24px'
                            }}>
                                {docTypes.map(doc => (
                                    <div key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {doc.label}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RENOVAÇÃO</label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    value={formData.docs[doc.id]?.renewal || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        docs: {
                                                            ...formData.docs,
                                                            [doc.id]: { ...(formData.docs[doc.id] || {}), renewal: e.target.value }
                                                        }
                                                    })}
                                                    style={{ height: '40px', fontSize: '0.8rem', padding: '0 12px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VENCIMENTO</label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    value={formData.docs[doc.id]?.expiration || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        docs: {
                                                            ...formData.docs,
                                                            [doc.id]: { ...(formData.docs[doc.id] || {}), expiration: e.target.value }
                                                        }
                                                    })}
                                                    style={{ height: '40px', fontSize: '0.8rem', padding: '0 12px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="premium-button"
                                style={{
                                    width: '100%',
                                    height: '56px',
                                    justifyContent: 'center'
                                }}
                            >
                                <CheckCircle size={18} />
                                {editingId ? 'Salvar Alterações do Tripulante' : 'Finalizar Cadastro de Tripulante'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {filteredCrew.length === 0 ? (
                <div className="glass-morphism" style={{ padding: '80px 48px', borderRadius: '32px', textAlign: 'center' }}>
                    <Fingerprint size={48} color="var(--primary)" style={{ margin: '0 auto 24px' }} />
                    <h3>Nenhum tripulante encontrado</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {searchTerm ? 'Tente outro termo de busca.' : 'Comece cadastrando um novo tripulante.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredCrew.map(member => (
                        <motion.div
                            key={member.id}
                            layout
                            className="glass-morphism"
                            style={{
                                padding: '24px 32px',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{member.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '1rem', fontFamily: 'monospace' }}>
                                            <Fingerprint size={16} /> ANAC: {member.anac}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Cadastrado em {member.createdAt.split(',')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="premium-button"
                                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="premium-button"
                                        style={{ padding: '8px 16px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Documents Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '12px'
                            }}>
                                {docTypes.map(doc => {
                                    const data = member.docs?.[doc.id];
                                    const hasData = data?.renewal || data?.expiration;

                                    // Check if nearly expired
                                    const isExpired = data?.expiration && new Date(data.expiration) < new Date();
                                    const isExpiringSoon = data?.expiration && !isExpired && (new Date(data.expiration) - new Date()) / (1000 * 60 * 60 * 24) < 30;

                                    return (
                                        <motion.div
                                            key={doc.id}
                                            onClick={() => setEditDocModal({
                                                memberId: member.id,
                                                memberName: member.name,
                                                docId: doc.id,
                                                docLabel: doc.label,
                                                renewal: data?.renewal || '',
                                                expiration: data?.expiration || ''
                                            })}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '16px',
                                                padding: '16px',
                                                border: isExpired ? '1px solid #f87171' : isExpiringSoon ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                        >
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: isExpired ? '#f87171' : isExpiringSoon ? '#fbbf24' : 'var(--primary)',
                                                marginBottom: '8px',
                                                letterSpacing: '1px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                {doc.label}
                                                <Edit size={10} style={{ opacity: 0.5 }} />
                                            </div>

                                            {hasData ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>REN:</span>
                                                        <span>{data.renewal ? formatDate(data.renewal) : '---'}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>VENC:</span>
                                                        {data.expiration ? formatDate(data.expiration) : '---'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.1)', fontStyle: 'italic' }}>
                                                    Clique para cadastrar
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Document Update Modal */}
            <AnimatePresence>
                {editDocModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
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
                            onClick={() => setEditDocModal(null)}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(8px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-morphism"
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '32px',
                                borderRadius: '32px',
                                position: 'relative',
                                background: 'rgba(10, 10, 12, 0.95)',
                                border: '1px solid var(--primary)'
                            }}
                        >
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <Calendar size={14} /> Atualização de Documento
                                </div>
                                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{editDocModal.docLabel}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tripulante: {editDocModal.memberName}</p>
                            </div>

                            <form onSubmit={handleDocUpdate}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label className="input-label">Data de Renovação</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={editDocModal.renewal}
                                        onChange={(e) => setEditDocModal({ ...editDocModal, renewal: e.target.value })}
                                        style={{ height: '50px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '32px' }}>
                                    <label className="input-label">Data de Vencimento</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={editDocModal.expiration}
                                        onChange={(e) => setEditDocModal({ ...editDocModal, expiration: e.target.value })}
                                        style={{ height: '50px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditDocModal(null)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px', borderRadius: '16px', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="premium-button"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        <CheckCircle size={18} /> Salvar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
