import React from 'react'; // Importa a biblioteca React
import { Plane, Users, Fuel, Gauge } from 'lucide-react'; // Importa ícones da biblioteca lucide-react
import { motion } from 'framer-motion'; // Importa motion para animações da biblioteca framer-motion
import rbzImage from '../assets/PT-RBZ.jpg'; // Importa a imagem da aeronave PT-RBZ
import mepImage from '../assets/PS-MEP.jpg'; // Importa a imagem da aeronave PS-MEP
import krtImage from '../assets/PR-KRT.jpg'; // Importa a imagem da aeronave PR-KRT
import mibImage from '../assets/PS-MIB.jpg'; // Importa a imagem da aeronave PS-MIB

// Define a lista de aeronaves disponíveis com suas especificações
const aircrafts = [
  {
    id: 1, // Identificador único da aeronave
    name: 'PT-RBZ | Global 6000', // Nome e modelo da aeronave
    type: 'Ultra Long Range', // Tipo de alcance da aeronave
    passengers: 13, // Capacidade de passageiros
    range: '6,000 nm', // Alcance máximo
    speed: '513 ktas', // Velocidade de cruzeiro
    image: rbzImage // Referência para a imagem importada
  },
  {
    id: 2, // Identificador único
    name: 'PS-MEP | Citation CJ4', // Nome e modelo
    type: 'Light Jet', // Tipo: Jato leve
    passengers: 10, // Capacidade de passageiros
    range: '2,165 nm', // Alcance
    speed: '451 ktas', // Velocidade
    image: mepImage // Imagem
  },
  {
    id: 3, // Identificador único
    name: 'PR-KRT | Citation CJ2+', // Nome e modelo
    type: 'Light Jet', // Tipo: Jato leve
    passengers: 8, // Capacidade de passageiros
    range: '1,530 nm', // Alcance
    speed: '418 ktas', // Velocidade
    image: krtImage // Imagem
  },
  {
    id: 4, // Identificador único
    name: 'PS-MIB | Citation M2', // Nome e modelo
    type: 'Entry Level Jet', // Tipo: Jato de entrada
    passengers: 6, // Capacidade de passageiros
    range: '1,550 nm', // Alcance
    speed: '404 ktas', // Velocidade
    image: mibImage // Imagem
  }
];

// Componente principal para seleção de aeronave
export default function AircraftSelector({ selectedId, onSelect }) {
  return (
    <div>
      {/* Título da seção de escolha de aeronave */}
      <h2 style={{ marginBottom: '40px', textAlign: 'center', fontSize: '2.5rem' }}>Escolha sua Aeronave</h2>

      {/* Grade que contém os cartões das aeronaves */}
      <div className="aircraft-grid">
        {/* Mapeia o array de aeronaves para criar um cartão para cada uma */}
        {aircrafts.map((ac) => (
          <motion.div
            key={ac.id} // Chave única para o React
            whileHover={{ y: -5 }} // Efeito de subir 5px ao passar o mouse
            onClick={() => onSelect(ac)} // Chama a função de seleção ao clicar
            className={`glass-morphism aircraft-card ${selectedId === ac.id ? 'active' : ''}`} // Classes CSS dinâmicas baseadas na seleção
          >
            {/* Contêiner da imagem da aeronave */}
            <div className="aircraft-image-wrapper">
              <img src={ac.image} alt={ac.name} loading="lazy" /> {/* Imagem da aeronave com carregamento tardio */}
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
        ))}
      </div>
    </div>
  );
}

