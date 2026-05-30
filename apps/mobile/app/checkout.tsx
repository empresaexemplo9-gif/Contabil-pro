import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cores, raio, sombra } from '../src/tema';
import { t } from '../src/i18n';
import { Botao } from '../src/componentes';
import { useCarrinho } from '../src/contextos/CarrinhoContext';

type Pagamento = 'cartao' | 'pix' | 'boleto';

export default function Checkout() {
  const router = useRouter();
  const { itens, total, limpar } = useCarrinho();
  const [pagamento, setPagamento] = useState<Pagamento>('pix');
  const [concluido, setConcluido] = useState(false);
  const [processando, setProcessando] = useState(false);

  const pagar = () => {
    setProcessando(true);
    setTimeout(() => {
      limpar();
      setProcessando(false);
      setConcluido(true);
    }, 1200);
  };

  if (concluido) {
    return (
      <View style={styles.sucesso}>
        <Stack.Screen options={{ title: '', headerShown: false }} />
        <View style={styles.sucessoIcone}>
          <Ionicons name="checkmark" size={56} color={cores.textoInverso} />
        </View>
        <Text style={styles.sucessoTitulo}>{t.checkout.sucessoTitulo}</Text>
        <Text style={styles.sucessoTexto}>{t.checkout.sucessoTexto}</Text>
        <Botao
          titulo={t.checkout.voltarInicio}
          aoPressionar={() => router.replace('/')}
          estilo={{ alignSelf: 'stretch', marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <Stack.Screen options={{ title: t.checkout.titulo }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Dados do viajante */}
        <Text style={styles.secao}>{t.checkout.dadosPassageiro}</Text>
        <View style={styles.formulario}>
          <Entrada placeholder={t.checkout.nomeCompleto} icone="person-outline" />
          <Entrada placeholder={t.checkout.cpf} icone="card-outline" teclado="numeric" />
          <Entrada placeholder={t.checkout.email} icone="mail-outline" teclado="email-address" />
          <Entrada placeholder={t.checkout.telefone} icone="call-outline" teclado="phone-pad" />
        </View>

        {/* Forma de pagamento */}
        <Text style={styles.secao}>{t.checkout.formaPagamento}</Text>
        <OpcaoPagamento
          icone="qr-code-outline"
          rotulo={t.checkout.pix}
          descricao="Aprovação imediata"
          ativo={pagamento === 'pix'}
          aoTocar={() => setPagamento('pix')}
        />
        <OpcaoPagamento
          icone="card-outline"
          rotulo={t.checkout.cartao}
          descricao="Visa, Mastercard, Elo · até 12x"
          ativo={pagamento === 'cartao'}
          aoTocar={() => setPagamento('cartao')}
        />
        <OpcaoPagamento
          icone="barcode-outline"
          rotulo={t.checkout.boleto}
          descricao="Compensação em até 3 dias úteis"
          ativo={pagamento === 'boleto'}
          aoTocar={() => setPagamento('boleto')}
        />

        {/* Resumo */}
        <Text style={styles.secao}>{t.checkout.resumo}</Text>
        <View style={styles.resumo}>
          {itens.map((i) => (
            <View key={i.chave} style={styles.resumoLinha}>
              <Text style={styles.resumoItem} numberOfLines={1}>{i.titulo}</Text>
              <Text style={styles.resumoValor}>{t.comum.reais(i.preco)}</Text>
            </View>
          ))}
          <View style={styles.divisor} />
          <View style={styles.resumoLinha}>
            <Text style={styles.totalRotulo}>{t.reservas.total}</Text>
            <Text style={styles.totalValor}>{t.comum.reais(total)}</Text>
          </View>
        </View>

        <View style={styles.seguranca}>
          <Ionicons name="lock-closed" size={16} color={cores.verde} />
          <Text style={styles.segurancaTexto}>{t.seguranca.bancos}</Text>
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        <Botao
          titulo={`${t.checkout.pagar} ${t.comum.reais(total)}`}
          aoPressionar={pagar}
          carregando={processando}
          desabilitado={itens.length === 0}
        />
      </View>
    </View>
  );
}

function Entrada({
  placeholder,
  icone,
  teclado = 'default',
}: {
  placeholder: string;
  icone: keyof typeof Ionicons.glyphMap;
  teclado?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.entrada}>
      <Ionicons name={icone} size={20} color={cores.azul} />
      <TextInput
        style={styles.entradaInput}
        placeholder={placeholder}
        placeholderTextColor={cores.textoClaro}
        keyboardType={teclado}
      />
    </View>
  );
}

function OpcaoPagamento({
  icone,
  rotulo,
  descricao,
  ativo,
  aoTocar,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  descricao: string;
  ativo: boolean;
  aoTocar: () => void;
}) {
  return (
    <Pressable style={[styles.opcao, ativo && styles.opcaoAtiva]} onPress={aoTocar}>
      <Ionicons name={icone} size={22} color={ativo ? cores.azul : cores.textoSuave} />
      <View style={{ flex: 1 }}>
        <Text style={styles.opcaoRotulo}>{rotulo}</Text>
        <Text style={styles.opcaoDescricao}>{descricao}</Text>
      </View>
      <Ionicons
        name={ativo ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={ativo ? cores.azul : cores.textoClaro}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  secao: { fontSize: 16, fontWeight: '800', color: cores.azulMarinho, marginTop: 20, marginBottom: 12 },
  formulario: { gap: 10 },
  entrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: 14,
  },
  entradaInput: { flex: 1, fontSize: 15, color: cores.azulMarinho, fontWeight: '600', paddingVertical: 14 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.borda,
    padding: 14,
    marginBottom: 10,
  },
  opcaoAtiva: { borderColor: cores.azul, backgroundColor: '#F2F8FD' },
  opcaoRotulo: { fontSize: 15, fontWeight: '800', color: cores.azulMarinho },
  opcaoDescricao: { fontSize: 12, color: cores.textoSuave, fontWeight: '600', marginTop: 2 },
  resumo: { backgroundColor: cores.superficie, borderRadius: raio.lg, padding: 16, gap: 10, ...sombra },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  resumoItem: { flex: 1, fontSize: 14, color: cores.texto, fontWeight: '600' },
  resumoValor: { fontSize: 14, fontWeight: '700', color: cores.azulMarinho },
  divisor: { height: 1, backgroundColor: cores.borda },
  totalRotulo: { fontSize: 16, fontWeight: '800', color: cores.azulMarinho },
  totalValor: { fontSize: 20, fontWeight: '800', color: cores.verde },
  seguranca: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 4 },
  segurancaTexto: { flex: 1, fontSize: 12, color: cores.textoSuave, fontWeight: '600' },
  rodape: {
    backgroundColor: cores.superficie,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  sucesso: { flex: 1, backgroundColor: cores.superficie, alignItems: 'center', justifyContent: 'center', padding: 32 },
  sucessoIcone: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: cores.verde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sucessoTitulo: { fontSize: 24, fontWeight: '800', color: cores.azulMarinho, marginTop: 24 },
  sucessoTexto: { fontSize: 15, color: cores.textoSuave, textAlign: 'center', marginTop: 8, fontWeight: '500', lineHeight: 22 },
});
