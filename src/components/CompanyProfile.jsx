import React from 'react'; // Importa a biblioteca React
import { motion, AnimatePresence } from 'framer-motion'; // Importa componentes de animação
import { ArrowLeft, Plane, Shield, Award, MapPin, Users, Fuel, Gauge, X, Info, Zap, Wind } from 'lucide-react'; // Importa ícones
import logoMil from '../assets/logo-mil-real.png'; // Importa logo da MIL Aviação
import logoRbf from '../assets/logo-rbf.png'; // Importa logo da RBF Táxi Aéreo

// Importa imagens das aeronaves
import rbzImage from '../assets/PT-RBZ.jpg'; // Imagem do Global 6000
import mepImage from '../assets/PS-MEP.jpg'; // Imagem do Citation CJ4
import krtImage from '../assets/PR-KRT.jpg'; // Imagem do Citation CJ2+
import mibImage from '../assets/PS-MIB.jpg'; // Imagem do Citation M2

// Dados das empresas (MIL Aviação e RBF Táxi Aéreo) com suas frotas e características
const COMPANY_DATA = {
    mil: { // Dados da empresa MIL Aviação
        name: 'MIL Aviação', // Nome da empresa
        logo: logoMil, // Logo da empresa
        description: `A MIL Aviação é referência em aviação executiva, oferecendo serviços de fretamento com excelência e segurança. Com uma frota moderna e diversificada, atendemos às necessidades de mobilidade corporativa e lazer com o mais alto padrão de qualidade. Nossa equipe altamente qualificada garante uma experiência de voo impecável, do planejamento ao desembarque.`, // Descrição da empresa
        features: ['Segurança Certificada', 'Atendimento Personalizado', 'Frota Moderna', 'Cobertura Nacional'], // Características principais
        aircrafts: [ // Lista de aeronaves da MIL Aviação
            {
                id: 2,
                name: 'PS-MEP | Citation CJ4',
                type: 'Jato Leve',
                passengers: 10,
                range: '2,165 nm',
                speed: '451 ktas',
                image: mepImage
            },
            {
                id: 3,
                name: 'PR-KRT | Citation CJ2+',
                type: 'Jato Leve',
                passengers: 8,
                range: '1,530 nm',
                speed: '418 ktas',
                image: krtImage
            },
            {
                id: 4,
                name: 'PS-MIB | Citation M2',
                type: 'Jato de Entrada',
                passengers: 6,
                range: '1,550 nm',
                speed: '404 ktas',
                image: mibImage
            }
        ]
    },
    rbf: { // Dados da empresa RBF Táxi Aéreo
        name: 'RBF Táxi Aéreo', // Nome da empresa
        logo: logoRbf, // Logo da empresa
        description: `A RBF Táxi Aéreo destaca-se no mercado pela operação de aeronaves de longo alcance e alto desempenho. Especializada em voos internacionais e intercontinentais, a RBF oferece conforto inigualável e eficiência operacional. Nossa missão é conectar o mundo com agilidade, proporcionando aos nossos clientes o máximo em privacidade e exclusividade.`, // Descrição da empresa
        features: ['Voos Internacionais', 'Longo Alcance', 'Cabine Premium', 'Privacidade Total'], // Características principais
        aircrafts: [ // Lista de aeronaves da RBF Táxi Aéreo
            {
                id: 1,
                name: 'PT-RBZ | Global 6000',
                type: 'Ultra Longo Alcance',
                passengers: 13,
                range: '6,000 nm',
                speed: '513 ktas',
                image: rbzImage
            }
        ]
    }
};

// Componente principal que exibe o perfil de uma empresa (MIL ou RBF)
export default function CompanyProfile({ companyId, onBack }) { // Recebe o ID da empresa e função de voltar
    const [selectedAircraft, setSelectedAircraft] = React.useState(null); // Estado para controlar qual aeronave está selecionada
    const company = COMPANY_DATA[companyId]; // Busca os dados da empresa pelo ID

    if (!company) return null; // Se a empresa não existir, não renderiza nada

    return (
        <div className="container company-profile-container">
            {/* Header / Back Button */}
            <div className="company-back-btn-wrapper">
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                >
                    <ArrowLeft size={20} /> Voltar
                </button>
            </div>

            {/* Hero Section */}
            <div className="glass-morphism company-profile-hero">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '40px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <img src={company.logo} alt={company.name} style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </motion.div>

                <h1 className="company-profile-title">
                    {company.name}
                </h1>

                <p className="company-profile-desc">
                    {company.description}
                </p>

                <div className="company-profile-features-grid">
                    {company.features.map((feature, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '24px',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '12px'
                        }}>
                            <Award size={32} color="var(--primary)" />
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fleet Section */}
            <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }} className="hero-title">
                <Plane size={36} color="var(--primary)" /> Conheça nossas aeronaves
            </h2>

            <div className="aircraft-grid">
                {company.aircrafts.map((ac) => (
                    <motion.div
                        key={ac.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedAircraft(ac)}
                        className="glass-morphism aircraft-card"
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="aircraft-image-wrapper">
                            <img src={ac.image} alt={ac.name} loading="lazy" />
                        </div>
                        <div className="aircraft-card-body">
                            <div className="aircraft-card-header">
                                <h3 className="aircraft-card-title">{ac.name}</h3>
                                <span className="aircraft-card-type">{ac.type}</span>
                            </div>

                            <div className="aircraft-specs">
                                <div className="aircraft-spec-item">
                                    <Users size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.passengers} pax
                                </div>
                                <div className="aircraft-spec-item">
                                    <Fuel size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.range}
                                </div>
                                <div className="aircraft-spec-item">
                                    <Gauge size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.speed}
                                </div>
                                <div className="aircraft-spec-item">
                                    <Plane size={16} className="feature-icon" style={{ marginBottom: 0 }} /> Jet
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Aircraft Detail Modal */}
            <AnimatePresence>
                {selectedAircraft && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="aircraft-modal-overlay"
                        onClick={() => setSelectedAircraft(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-morphism aircraft-modal-card"
                        >
                            <button
                                onClick={() => setSelectedAircraft(null)}
                                style={{
                                    position: 'absolute',
                                    top: '24px',
                                    right: '24px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                <X size={24} />
                            </button>

                            <div className="aircraft-modal-image-col">
                                <img
                                    src={selectedAircraft.image}
                                    alt={selectedAircraft.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '40px',
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'
                                }}>
                                    <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>{selectedAircraft.name}</h2>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedAircraft.type}</span>
                                </div>
                            </div>

                            <div className="aircraft-modal-content-col">
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '32px', color: 'var(--text-muted)' }}>Especificações Técnicas</h3>

                                <div className="aircraft-specs-grid">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                                            <Users size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Passageiros</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedAircraft.passengers} Pax</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                                            <Fuel size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Alcance Máximo</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedAircraft.range}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                                            <Gauge size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Velocidade de Cruzeiro</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedAircraft.speed}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                                            <Plane size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categoria</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Jato Executivo</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '48px', padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <Info size={20} color="var(--primary)" />
                                        <h4 style={{ fontSize: '1.1rem' }}>Destaques da Operação</h4>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                        {selectedAircraft.id === 1 && "O Global 6000 oferece a cabine mais espaçosa de sua categoria, combinando alcance intercontinental com conforto excepcional para voos de longa duração."}
                                        {selectedAircraft.id === 2 && "O Citation CJ4 redefine a flexibilidade, oferecendo desempenho de jato médio com a economia de um jato leve."}
                                        {selectedAircraft.id === 3 && "Eficiência e versatilidade marcam o CJ2+, sendo a escolha ideal para missões executivas rápidas e diretas."}
                                        {selectedAircraft.id === 4 && "O Citation M2 é a entrada perfeita no mundo dos jatos, oferecendo tecnologia de ponta e facilidade de operação."}
                                    </p>
                                </div>

                                <button
                                    className="premium-button"
                                    style={{ width: '100%', marginTop: '40px', padding: '18px' }}
                                    onClick={() => setSelectedAircraft(null)}
                                >
                                    Fechar Detalhes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
