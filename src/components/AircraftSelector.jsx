import React, { useState, useEffect } from 'react'; // Importa a biblioteca React
import { Plane, Users, Fuel, Gauge, Loader2 } from 'lucide-react'; // Importa ícones da biblioteca lucide-react
import { motion } from 'framer-motion'; // Importa motion para animações da biblioteca framer-motion
import { fetchFleet } from '../utils/supabaseFleet';

// Importa as imagens para garantir que o Vite as processe corretamente
import rbzImage from '../assets/PT-RBZ.jpg';
import mepImage from '../assets/PS-MEP.jpg';
import krtImage from '../assets/PR-KRT.jpg';
import mibImage from '../assets/PS-MIB.jpg';

// Mapa de imagens para converter o nome/ID do banco para o asset importado
const imageMap = {
  'PT-RBZ': rbzImage,
  'PS-MEP': mepImage,
  'PR-KRT': krtImage,
  'PS-MIB': mibImage,
  '/assets/PT-RBZ.jpg': rbzImage,
  '/assets/PS-MEP.jpg': mepImage,
  '/assets/PR-KRT.jpg': krtImage,
  '/assets/PS-MIB.jpg': mibImage
};

// Componente principal para seleção de aeronave
export default function AircraftSelector({ selectedId, onSelect }) {
  const [aircrafts, setAircrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFleet() {
      const data = await fetchFleet();
      if (data && data.length > 0) {
        setAircrafts(data);
      } else {
        // Fallback para dados estáticos se o banco falhar
        console.warn('Usando fallback estático para a frota');
        setAircrafts([
          { id: 1, name: 'PT-RBZ | Global 6000', type: 'Ultra Long Range', passengers: 13, range: '6,000 nm', speed: '513 ktas', image_url: 'PT-RBZ' },
          { id: 2, name: 'PS-MEP | Citation CJ4', type: 'Light Jet', passengers: 10, range: '2,165 nm', speed: '451 ktas', image_url: 'PS-MEP' },
          { id: 3, name: 'PR-KRT | Citation CJ2+', type: 'Light Jet', passengers: 8, range: '1,530 nm', speed: '418 ktas', image_url: 'PR-KRT' },
          { id: 4, name: 'PS-MIB | Citation M2', type: 'Entry Level Jet', passengers: 6, range: '1,550 nm', speed: '404 ktas', image_url: 'PS-MIB' }
        ]);
      }
      setIsLoading(false);
    }
    loadFleet();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div>
      {/* Título da seção de escolha de aeronave */}
      <h2 style={{ marginBottom: '40px', textAlign: 'center', fontSize: '2.5rem' }}>Escolha sua Aeronave</h2>

      {/* Grade que contém os cartões das aeronaves */}
      <div className="aircraft-grid">
        {/* Mapeia o array de aeronaves para criar um cartão para cada uma */}
        {aircrafts.map((ac) => {
          // Resolve a imagem: usa o mapa se existir, ou tenta o link direto
          const displayImage = imageMap[ac.image_url] || imageMap[ac.name.split(' | ')[0]] || ac.image_url;

          return (
            <motion.div
              key={ac.id} // Chave única para o React
              whileHover={{ y: -5 }} // Efeito de subir 5px ao passar o mouse
              onClick={() => onSelect(ac)} // Chama a função de seleção ao clicar
              className={`glass-morphism aircraft-card ${selectedId === ac.id ? 'active' : ''}`} // Classes CSS dinâmicas baseadas na seleção
            >
              {/* Contêiner da imagem da aeronave */}
              <div className="aircraft-image-wrapper">
                <img src={displayImage} alt={ac.name} loading="lazy" /> {/* Imagem da aeronave com carregamento tardio */}
              </div>

              {/* Corpo do cartão com informações detalhadas */}
              <div className="aircraft-card-body">
                <div className="aircraft-card-header">
                  <h3 className="aircraft-card-title">{ac.name}</h3> {/* Exibe o nome da aeronave */}
                  <span className="aircraft-card-type">{ac.type}</span> {/* Exibe o tipo da aeronave */}
                </div>

                {/* Seção de especificações técnicas */}
                <div className="aircraft-specs">
                  {/* Item: Capacidade de passageiros */}
                  <div className="aircraft-spec-item">
                    <Users size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.passengers} pax
                  </div>
                  {/* Item: Alcance da aeronave */}
                  <div className="aircraft-spec-item">
                    <Fuel size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.range}
                  </div>
                  {/* Item: Velocidade da aeronave */}
                  <div className="aircraft-spec-item">
                    <Gauge size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.speed}
                  </div>
                  {/* Item: Categoria (Jato) */}
                  <div className="aircraft-spec-item">
                    <Plane size={16} className="feature-icon" style={{ marginBottom: 0 }} /> Jet
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

