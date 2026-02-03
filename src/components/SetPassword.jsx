import React, { useState } from 'react';
import { Lock, Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetPassword({ token, onPasswordSet }) {
    const [requester] = useState(() => {
        if (!token) return null;
        const stored = localStorage.getItem('requesters');
        if (!stored) return null;
        const requesters = JSON.parse(stored);
        return requesters.find(r => r.token === token && r.status === 'pending') || null;
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState(() => {
        if (!token) return ''; // Handled by separate check in render
        const stored = localStorage.getItem('requesters');
        if (!stored) return 'Token inválido ou expirado';
        const requesters = JSON.parse(stored);
        const found = requesters.find(r => r.token === token && r.status === 'pending');
        if (!found) return 'Token inválido ou já utilizado';
        return '';
    });
    const [success, setSuccess] = useState(false);



    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        // Update requester with password and active status
        const stored = localStorage.getItem('requesters');
        const requesters = JSON.parse(stored);
        const updated = requesters.map(r =>
            r.id === requester.id
                ? { ...r, password, status: 'active', token: null }
                : r
        );
        localStorage.setItem('requesters', JSON.stringify(updated));

        setSuccess(true);

        // Redirect to login after 2 seconds
        setTimeout(() => {
            onPasswordSet();
        }, 2000);
    };

    if (!token) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div className="glass-morphism" style={{
                    padding: '48px',
                    borderRadius: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    border: '2px solid #f87171'
                }}>
                    <AlertCircle size={64} color="#f87171" style={{ margin: '0 auto 24px' }} />
                    <h2 style={{ marginBottom: '16px', color: '#f87171' }}>Link Inválido</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        O link de ativação não foi fornecido ou é inválido.
                        Por favor, verifique o link recebido por email.
                    </p>
                </div>
            </div>
        );
    }

    if (error && !requester) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div className="glass-morphism" style={{
                    padding: '48px',
                    borderRadius: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    border: '2px solid #f87171'
                }}>
                    <AlertCircle size={64} color="#f87171" style={{ margin: '0 auto 24px' }} />
                    <h2 style={{ marginBottom: '16px', color: '#f87171' }}>Erro na Validação</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="premium-button"
                        style={{
                            background: 'var(--primary)',
                            color: '#000',
                            width: '100%',
                            justifyContent: 'center'
                        }}
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-morphism"
                    style={{
                        padding: '48px',
                        borderRadius: '32px',
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        border: '2px solid #34d399'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        <CheckCircle size={64} color="#34d399" style={{ margin: '0 auto 24px' }} />
                    </motion.div>
                    <h2 style={{ marginBottom: '16px', color: '#34d399' }}>Senha Definida com Sucesso!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Sua conta foi ativada. Redirecionando para o login...
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!requester) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div className="glass-morphism" style={{ padding: '48px', borderRadius: '32px' }}>
                    <p>Validando token...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-morphism"
                style={{
                    padding: '48px',
                    borderRadius: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    border: '2px solid var(--primary)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <Lock size={40} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Defina sua Senha</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Bem-vindo(a), <strong>{requester.name}</strong>!<br />
                        Crie uma senha para acessar o sistema.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label">Email</label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <Mail size={20} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-muted)' }}>{requester.email}</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label">Nova Senha *</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label">Confirmar Senha *</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Digite a senha novamente"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(248, 113, 113, 0.1)',
                            border: '1px solid #f87171',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#f87171'
                        }}>
                            <AlertCircle size={16} />
                            <span style={{ fontSize: '0.9rem' }}>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="premium-button"
                        style={{
                            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                            color: '#000',
                            width: '100%',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}
                    >
                        Definir Senha e Ativar Conta <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(96, 165, 250, 0.1)',
                    border: '1px solid #60a5fa',
                    borderRadius: '12px'
                }}>
                    <p style={{ fontSize: '0.85rem', color: '#60a5fa', margin: 0, lineHeight: '1.5' }}>
                        <strong>Empresas autorizadas:</strong><br />
                        {requester.companies.join(', ')}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
