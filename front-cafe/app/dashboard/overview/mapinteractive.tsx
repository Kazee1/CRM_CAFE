"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import brazilGeoJSON from "./brazil_geo.json";

// Definir tipos para o GeoJSON
interface GeoJSONFeature {
    type: string;
    id?: string;
    properties: {
        name?: string;
        sigla?: string;
        UF?: string;
        NOME?: string;
        [key: string]: any;
    };
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][][] | number[][][];
    };
}

interface GeoJSONData {
    type: string;
    features: GeoJSONFeature[];
}

interface EstadoData {
    estado: string;
    total: number;
    clientes: number;
}

interface InteractiveMapProps {
    data: EstadoData[];
    onStateClick: (estado: EstadoData) => void;
}

interface ProcessedEstado {
    id: string;
    name: string;
    path: string;
    simplifiedPath: string; // Path simplificado para melhor performance
    centroid: {
        x: number;
        y: number;
    };
}

const AMBER_SCALE = [
    "#fef3c7", // amber-100
    "#fde68a", // amber-200
    "#fcd34d", // amber-300
    "#fbbf24", // amber-400
    "#f59e0b", // amber-500
    "#d97706", // amber-600
    "#b45309", // amber-700
    "#92400e"  // amber-800
];

function hexToRgb(hex: string) {
    const cleanHex = hex.replace("#", "");
    const bigint = parseInt(cleanHex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function interpolateColor(color1: string, color2: string, factor: number) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));

    return `rgb(${r}, ${g}, ${b})`;
}

function getAmberGradient(normalized: number): string {
    const n = Math.max(0, Math.min(1, normalized));

    const steps = AMBER_SCALE.length - 1;
    const index = Math.floor(n * steps);
    const localT = (n * steps) - index;

    return interpolateColor(
        AMBER_SCALE[index],
        AMBER_SCALE[Math.min(index + 1, steps)],
        localT
    );
}


// Cache para os dados processados (static pois o GeoJSON não muda)
let cachedProcessedEstados: ProcessedEstado[] | null = null;
let cachedBounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null;

const InteractiveMap = ({ data, onStateClick }: InteractiveMapProps) => {
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fazer type assertion para o JSON importado
    const geoData = brazilGeoJSON as GeoJSONData;

    // Função auxiliar para extrair coordenadas - memoizada
    const getCoordinatesFromFeature = useCallback((feature: GeoJSONFeature): number[][][] => {
        if (!feature.geometry) return [];

        if (feature.geometry.type === "Polygon") {
            return feature.geometry.coordinates as number[][][];
        }

        if (feature.geometry.type === "MultiPolygon") {
            return (feature.geometry.coordinates as number[][][][]).flat();
        }

        return [];
    }, []);

    const estadosProcessados = useMemo(() => {
        // Usar cache se disponível
        if (cachedProcessedEstados) {
            return cachedProcessedEstados;
        }

        if (!geoData?.features) return [];

        // 1️⃣ Coletar TODAS as coordenadas (para escala) - otimizado
        const allCoords: number[] = [];
        const featureCount = geoData.features.length;

        for (let i = 0; i < featureCount; i++) {
            const feature = geoData.features[i];
            const polygons = getCoordinatesFromFeature(feature);

            for (let j = 0; j < polygons.length; j++) {
                const polygon = polygons[j];
                for (let k = 0; k < polygon.length; k++) {
                    const coord = polygon[k];
                    allCoords.push(coord[0], coord[1]);
                }
            }
        }

        if (allCoords.length === 0) return [];

        // 2️⃣ Calcular limites - otimizado
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < allCoords.length; i += 2) {
            const x = allCoords[i];
            const y = allCoords[i + 1];

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        // Cache dos bounds
        cachedBounds = { minX, maxX, minY, maxY };

        const width = 800;
        const height = 600;
        const padding = 40;

        const scaleX = (width - 2 * padding) / (maxX - minX);
        const scaleY = (height - 2 * padding) / (maxY - minY);
        const scale = Math.min(scaleX, scaleY);

        // Ajustar centralização
        const mapWidth = (maxX - minX) * scale;
        const mapHeight = (maxY - minY) * scale;
        const offsetX = (width - mapWidth) / 2;
        const offsetY = (height - mapHeight) / 2;

        // 3️⃣ Gerar paths corretamente COM SIMPLIFICAÇÃO
        const processed: ProcessedEstado[] = [];

        for (let i = 0; i < featureCount; i++) {
            const feature = geoData.features[i];

            const estadoId =
                feature.id ||
                feature.properties?.sigla ||
                feature.properties?.UF ||
                feature.properties?.name ||
                "";

            const estadoName =
                feature.properties?.name ||
                feature.properties?.NOME ||
                estadoId;

            const polygons = getCoordinatesFromFeature(feature);
            if (polygons.length === 0) continue;

            let path = "";
            let allPoints: { x: number, y: number }[] = [];
            let maxArea = 0;
            let mainPolygonIndex = 0;

            // Primeiro passo: processar todos os polígonos e encontrar o principal
            for (let j = 0; j < polygons.length; j++) {
                const polygon = polygons[j];
                let area = 0;

                // Calcular área usando fórmula de Shoelace
                for (let k = 0; k < polygon.length; k++) {
                    const curr = polygon[k];
                    const next = polygon[(k + 1) % polygon.length];
                    area += curr[0] * next[1] - next[0] * curr[1];
                }
                area = Math.abs(area) / 2;

                if (area > maxArea) {
                    maxArea = area;
                    mainPolygonIndex = j;
                }
            }

            // Segundo passo: construir o path SEM simplificação
            for (let j = 0; j < polygons.length; j++) {
                const polygon = polygons[j];

                for (let k = 0; k < polygon.length; k++) {
                    const coord = polygon[k];
                    const x = (coord[0] - minX) * scale + offsetX;
                    const y = height - ((coord[1] - minY) * scale) - offsetY;

                    // Coletar pontos apenas do polígono principal para centróide
                    if (j === mainPolygonIndex) {
                        allPoints.push({ x, y });
                    }

                    // Incluir TODOS os pontos sem simplificação
                    if (k === 0) {
                        path += `M${x.toFixed(3)},${y.toFixed(3)}`;
                    } else {
                        path += `L${x.toFixed(3)},${y.toFixed(3)}`;
                    }
                }

                // Fechar polígono
                path += `Z`;
            }

            // Calcular centróide real usando fórmula correta
            let centroidX = 0;
            let centroidY = 0;
            let signedArea = 0;

            const mainPolygon = polygons[mainPolygonIndex];
            for (let k = 0; k < mainPolygon.length; k++) {
                const curr = mainPolygon[k];
                const next = mainPolygon[(k + 1) % mainPolygon.length];

                const x0 = (curr[0] - minX) * scale + offsetX;
                const y0 = height - ((curr[1] - minY) * scale) - offsetY;
                const x1 = (next[0] - minX) * scale + offsetX;
                const y1 = height - ((next[1] - minY) * scale) - offsetY;

                const a = x0 * y1 - x1 * y0;
                signedArea += a;
                centroidX += (x0 + x1) * a;
                centroidY += (y0 + y1) * a;
            }

            signedArea *= 0.5;
            centroidX /= (6 * signedArea);
            centroidY /= (6 * signedArea);

            const mainPolygonCentroid = {
                x: centroidX,
                y: centroidY
            };

            processed.push({
                id: estadoId,
                name: estadoName,
                path,
                simplifiedPath: path,
                centroid: mainPolygonCentroid // Usar centróide do polígono principal
            });
        }

        cachedProcessedEstados = processed;
        return processed;
    }, [geoData, getCoordinatesFromFeature]);

    // Pré-calcular as cores para cada estado
    const estadoColors = useMemo(() => {
        const colors: Record<string, string> = {};
        const valores = data.map(d => d.total).filter(v => v > 0);

        if (valores.length === 0) {
            estadosProcessados.forEach(estado => {
                colors[estado.id] = "#e7e5e4";
            });
            return colors;
        }

        const maxValor = Math.max(...valores);
        const minValor = Math.min(...valores);

        estadosProcessados.forEach(estado => {
            const estadoData = data.find(d => d.estado === estado.id);
            if (!estadoData) {
                colors[estado.id] = "#e7e5e4";
                return;
            }

            if (maxValor === minValor) {
                colors[estado.id] = "#7c2d12";
                return;
            }

            const normalized = (estadoData.total - minValor) / (maxValor - minValor);
            colors[estado.id] = getAmberGradient(normalized);


        });

        return colors;
    }, [data, estadosProcessados]);

    // Criar mapa rápido de dados
    const estadoDataMap = useMemo(() => {
        const map = new Map<string, EstadoData>();
        data.forEach(item => {
            map.set(item.estado, item);
        });
        return map;
    }, [data]);

    const handleStateClick = useCallback((estadoId: string) => {
        const estadoData = estadoDataMap.get(estadoId);
        if (estadoData) {
            setSelectedState(estadoId);
            onStateClick(estadoData);
        }
    }, [estadoDataMap, onStateClick]);

    // Handler para hover com throttle
    const handleMouseEnter = useCallback((estadoId: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        setHoveredState(estadoId);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredState(null);
        }, 50); // Pequeno delay para evitar flickering
    }, []);

    // Se não houver estados processados, mostrar loading
    if (estadosProcessados.length === 0) {
        return (
            <div className="w-full h-[600px] flex items-center justify-center bg-amber-50 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <div className="text-amber-700 font-medium">Carregando mapa...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-amber-900">Mapa do Brasil</h2>
                    <p className="text-amber-700 mt-2">Clique em um estado para detalhes</p>
                </div>

                <div className="relative w-full h-auto min-h-[600px] bg-amber-50 rounded-lg overflow-hidden border border-amber-200">
                    <svg
                        viewBox="0 0 800 600"
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid meet"
                        style={{ shapeRendering: 'optimizeSpeed' }}
                    >
                        <rect width="800" height="600" fill="#fefce8" />

                        {/* Renderizar estados em camadas para melhor performance */}
                        <g>
                            {estadosProcessados.map((estado) => {
                                const isHovered = hoveredState === estado.id;
                                const isSelected = selectedState === estado.id;

                                return (
                                    <path
                                        key={estado.id}
                                        d={estado.simplifiedPath} // Usar path simplificado
                                        fill={estadoColors[estado.id] || "#e7e5e4"}
                                        stroke={isSelected ? "#451a03" : isHovered ? "#7c2d12" : "#92400e"}
                                        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                        style={{
                                            cursor: 'pointer',
                                            willChange: isHovered || isSelected ? 'stroke, stroke-width' : 'auto'
                                        }}
                                        onClick={() => handleStateClick(estado.id)}
                                        onMouseEnter={() => handleMouseEnter(estado.id)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                );
                            })}
                        </g>

                        {/* Textos em camada separada */}
                        <g>
                            {estadosProcessados.map((estado) => {
                                const isHovered = hoveredState === estado.id;
                                const isSelected = selectedState === estado.id;

                                return (
                                    <text
                                        key={`text-${estado.id}`}
                                        x={estado.centroid.x}
                                        y={estado.centroid.y}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={isSelected || isHovered ? "#451a03" : "#78350f"}
                                        fontSize="16"
                                        fontWeight="bold"
                                        stroke="#ffffff"
                                        strokeWidth="3"
                                        paintOrder="stroke"
                                        style={{
                                            pointerEvents: 'none',
                                            userSelect: 'none'
                                        }}
                                    >
                                        {estado.id}
                                    </text>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Tooltip */}
                    {hoveredState && (
                        <div className="absolute top-6 right-6 bg-white p-4 rounded-lg shadow-xl border border-amber-200 min-w-[200px] z-10">
                            <div className="font-bold text-lg text-amber-900 mb-2">
                                {estadosProcessados.find((e) => e.id === hoveredState)?.name}
                            </div>
                            {(() => {
                                const estadoData = estadoDataMap.get(hoveredState);
                                if (!estadoData) return (
                                    <div className="text-amber-600 italic">Sem dados</div>
                                );

                                return (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-amber-700">Total:</span>
                                                <span className="font-bold text-amber-900">{estadoData.total.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-amber-700">Clientes:</span>
                                                <span className="font-bold text-amber-900">{estadoData.clientes.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleStateClick(hoveredState)}
                                            className="w-full mt-3 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium transition-colors"
                                        >
                                            Ver Detalhes
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Legenda */}
                    <div className="absolute bottom-6 left-6 bg-white p-4 rounded-lg shadow-lg border border-amber-200">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Legenda</div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-sm bg-amber-200"></div>
                            <span className="text-sm text-amber-700">Baixo</span>
                            <div className="h-3 w-24 bg-gradient-to-r from-amber-200 to-amber-800 rounded mx-2"></div>
                            <div className="w-4 h-4 rounded-sm bg-amber-800"></div>
                            <span className="text-sm text-amber-700">Alto</span>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default InteractiveMap;