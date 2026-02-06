import React from 'react';
import { Plane, ShieldCheck, ArrowRight, UserCircle, Calendar, Navigation2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import logoRbf from '../assets/logo-rbf.png';
import logoMil from '../assets/logo-mil-real.png';

export default function PortalHome({ onNavigate, onCompanySelect }) {
    return (
        <div className="container" style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '80px',
            paddingInline: '20px',
            width: '100%'
        }}>
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
                style={{ textAlign: 'center', marginBottom: '60px', position: 'relative', width: '100%' }}
            >
                <h1 style={{
                    fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                    marginBottom: '16px',
                    color: 'var(--primary)',
                    fontWeight: '800'
                }}>Terminal de Acesso</h1>
                {/* Desktop Welcome Text */}
                <p className="desktop-only" style={{
                    color: 'var(--text-muted)',
                    fontSize: '1.25rem',
                    maxWidth: '800px',
                    margin: '0 auto',
                    lineHeight: '1.4',
                    marginBottom: '60px', /* Aumentado de 48px */
                    paddingInline: '20px'
                }}>
                    Bem-vindo à plataforma de <span style={{ color: '#fff', fontWeight: 'bold' }}>Elite</span><br />
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.5rem', display: 'block', margin: '8px 0' }}>
                        Mil aviação & RBF Táxi Aéreo.
                    </span>
                    Selecione o portal operacional para iniciar.
                </p>

                {/* Mobile Welcome Text (5-Line Requested Format) */}
                <p className="mobile-only" style={{
                    color: 'var(--text-muted)',
                    fontSize: '1.1rem',
                    margin: '0 auto',
                    lineHeight: '1.6',
                    marginBottom: '60px', /* Aumentado de 48px para dar mais espaço */
                    paddingInline: '15px'
                }}>
                    Bem-vindo à plataforma de <span style={{ color: '#fff', fontWeight: 'bold' }}>Elite</span><br />
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.6rem', display: 'block', marginTop: '12px' }}>Mil aviação</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.6rem', display: 'block' }}>&</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.6rem', display: 'block', marginBottom: '12px' }}>RBF Táxi Aéreo</span>
                    Selecione o portal operacional para iniciar
                </p>

                <div className="logos-container">
                    {/* MIL Aviação Block */}
                    <motion.div
                        whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                        onClick={() => onCompanySelect('mil')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <div style={{ width: '140px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logoMil} alt="MIL Aviação" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div className="mil-text-container">
                            <span className="mil-main">Mil</span>
                            <span className="mil-sub">aviação</span>
                        </div>
                    </motion.div>

                    <div className="logos-divider"></div>

                    {/* RBF Block */}
                    <motion.div
                        whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                        onClick={() => onCompanySelect('rbf')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <div style={{ width: '140px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={logoRbf} alt="RBF Táxi Aéreo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div className="rbf-text-container">
                            <span className="rbf-main">RBF</span>
                            <span className="rbf-sub">Táxi Aéreo</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Reduced min-width to help 5 items fit
                gap: '16px', // Reduced gap
                width: '100%',
                maxWidth: '1400px' // Increased max-width to give more room
            }}>
                {/* Calendar Path */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#34d399',
                        boxShadow: '0 0 30px rgba(52, 211, 153, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('fleet-calendar')}
                    className="glass-morphism"
                    style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(245, 158, 11, 0.2)'
                    }}>
                        <Calendar size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: '700' }}>Agenda de Frota</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Confira a disponibilidade de nossa frota em tempo real e escolha a melhor data para sua operação.
                    </p>
                    <div style={{ color: '#fbbf24', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                        Consultar Datas <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Client Path */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#34d399',
                        boxShadow: '0 0 30px rgba(52, 211, 153, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('client')}
                    className="glass-morphism"
                    style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, #fbbf24 100%)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(251, 191, 36, 0.2)'
                    }}>
                        <UserCircle size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: '700' }}>Área do Cliente</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Solicite voos exclusivos, escolha sua aeronave e planeje seus trechos com total privacidade.
                    </p>
                    <div style={{ color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                        Acessar Terminal <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Coordinator Path */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#34d399',
                        boxShadow: '0 0 30px rgba(52, 211, 153, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('coordinator')}
                    className="glass-morphism"
                    style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(52, 211, 153, 0.2)'
                    }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: '700' }}>Painel Coordenador</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Gerenciamento de solicitações, aprovação de voos e controle operacional da frota.
                    </p>
                    <div style={{ color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                        Acesso Restrito <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Crew Path */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: 'var(--primary)',
                        boxShadow: '0 0 30px rgba(201, 168, 106, 0.2)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('crew')}
                    className="glass-morphism"
                    style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(45, 212, 191, 0.2)'
                    }}>
                        <Navigation2 size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: '700' }}>Cockpit Operacional</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Acesso exclusivo para tripulação. Visualize planos de voo, manifestos e dados operacionais.
                    </p>
                    <div style={{ color: '#2dd4bf', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                        Entrar no Cockpit <ArrowRight size={18} />
                    </div>
                </motion.div>

                {/* Financial Path - NOVO */}
                <motion.div
                    whileHover={{
                        scale: 1.03,
                        translateY: -10,
                        borderColor: '#4ade80',
                        boxShadow: '0 0 30px rgba(74, 222, 128, 0.15)'
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    onClick={() => onNavigate('financial')}
                    className="glass-morphism"
                    style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: '2px solid transparent',
                        background: 'rgba(255, 255, 255, 0.03)',
                        transition: 'border-color 0.3s ease, background 0.3s ease'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: '#000',
                        boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)'
                    }}>
                        <DollarSign size={32} />
                    </div>
                    <h2 style={{ marginBottom: '8px', fontSize: '1.3rem', fontWeight: '700' }}>Financeiro</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '28px', fontSize: '1rem', lineHeight: '1.5' }}>
                        Acesse diários de bordo e comprovantes de despesas enviados pela tripulação.
                    </p>
                    <div style={{ color: '#4ade80', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.05rem' }}>
                        Ver Lançamentos <ArrowRight size={18} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
