'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OrdemServico } from '@/lib/types-rotas';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapaRotasProps {
  ordensServico: OrdemServico[];
  onMarkerClick?: (os: OrdemServico) => void;
}

export function MapaRotas({ ordensServico, onMarkerClick }: MapaRotasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Inicializar mapa centrado em Porto Alegre
    const map = L.map(mapContainerRef.current).setView([-30.0346, -51.2177], 12);

    // Adicionar camada do OpenStreetMap (gratuito)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Limpar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Criar ícones customizados por prioridade
    const getIconByPriority = (prioridade: OrdemServico['prioridade']) => {
      const colors: Record<OrdemServico['prioridade'], string> = {
        baixa: '#22c55e',
        media: '#eab308',
        alta: '#f97316',
        urgente: '#ef4444'
      };

      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${colors[prioridade]};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
          ">
            OS
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    // Adicionar marcadores para cada O.S.
    ordensServico.forEach(os => {
      const marker = L.marker(
        [os.endereco.coordenadas.lat, os.endereco.coordenadas.lng],
        { icon: getIconByPriority(os.prioridade) }
      );

      // Popup com informações da O.S.
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${os.numero_os}</h3>
          <p style="margin: 4px 0;"><strong>Cliente:</strong> ${os.cliente_nome}</p>
          <p style="margin: 4px 0;"><strong>Bairro:</strong> ${os.endereco.bairro}</p>
          <p style="margin: 4px 0;"><strong>Tipo:</strong> ${os.tipo_servico}</p>
          <p style="margin: 4px 0;"><strong>Prioridade:</strong> ${os.prioridade}</p>
          ${os.tecnico_nome ? `<p style="margin: 4px 0;"><strong>Técnico:</strong> ${os.tecnico_nome}</p>` : ''}
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">${os.descricao}</p>
        </div>
      `);

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(os);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (ordensServico.length > 0) {
      const bounds = L.latLngBounds(
        ordensServico.map(os => [os.endereco.coordenadas.lat, os.endereco.coordenadas.lng])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [ordensServico, onMarkerClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg overflow-hidden border border-gray-200"
      style={{ minHeight: '500px' }}
    />
  );
}
