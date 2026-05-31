import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { cores } from '../tema';

interface Props {
  /** Diâmetro do brasão circular. */
  tamanho?: number;
  /** Exibe o wordmark "viajebrasil" e o slogan abaixo do brasão. */
  comTexto?: boolean;
  /** Usa cores claras para fundos escuros. */
  claro?: boolean;
}

/**
 * Brasão da marca ViajeBrasil: anel em degradê (verde→azul), sol e a
 * "estrada" sinuosa em amarelo, evocando o mapa do Brasil da logo original.
 */
export function LogoMarca({ tamanho = 72, comTexto = false, claro = false }: Props) {
  const r = tamanho / 2;
  return (
    <View style={styles.container}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="anel" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={cores.verde} />
            <Stop offset="0.5" stopColor={cores.amarelo} />
            <Stop offset="1" stopColor={cores.azul} />
          </LinearGradient>
          <LinearGradient id="estrada" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={cores.amarelo} />
            <Stop offset="1" stopColor={cores.laranja} />
          </LinearGradient>
        </Defs>

        {/* Anel externo em degradê */}
        <Circle cx="50" cy="50" r="48" fill="url(#anel)" />
        <Circle cx="50" cy="50" r="42" fill={cores.superficie} />

        {/* Mar / céu */}
        <Path d="M50 70 C62 64 74 62 86 66 L86 50 C74 54 62 56 50 60 Z" fill={cores.azulCeu} opacity={0.9} />

        {/* Estrada sinuosa */}
        <Path
          d="M18 64 C34 58 40 50 58 44 C70 40 78 38 84 40 L84 50 C76 49 70 51 60 55 C44 61 36 66 22 70 Z"
          fill="url(#estrada)"
        />

        {/* Faixa verde (mata) */}
        <Path
          d="M16 60 C30 52 38 44 56 38 C66 35 74 34 82 36 L84 40 C78 38 70 40 58 44 C40 50 34 58 18 64 Z"
          fill={cores.verde}
        />

        {/* Sol */}
        <Circle cx="62" cy="38" r="9" fill={cores.amarelo} />
        <Circle cx="62" cy="38" r="5.5" fill="#FFE9A8" />
      </Svg>

      {comTexto && (
        <View style={styles.texto}>
          <Text style={styles.wordmark}>
            <Text style={{ color: claro ? cores.textoInverso : cores.azulMarinho }}>viaje</Text>
            <Text style={{ color: cores.verde }}>brasil</Text>
          </Text>
          <Text style={[styles.slogan, claro && { color: cores.textoInverso }]}>
            REALIZANDO SONHOS
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  texto: { alignItems: 'center', marginTop: 8 },
  wordmark: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  slogan: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    color: cores.azulMarinho,
    marginTop: 2,
  },
});
