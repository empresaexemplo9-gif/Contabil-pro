"""
Gerador do PDF "Treinamento Completo de Trafego Pago - Do Zero ao Profissional".

Documento independente; nao tem relacao com o projeto deste repositorio.
Roda com: python3 treinamentos/gerar_trafego_pago.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# ---------------------------------------------------------------------------
# Cores e estilos
# ---------------------------------------------------------------------------

PRIMARIA = colors.HexColor("#0B2A4A")     # azul petroleo
SECUNDARIA = colors.HexColor("#1F6FEB")   # azul vibrante
ACENTO = colors.HexColor("#F59E0B")       # ambar
SUCESSO = colors.HexColor("#16A34A")
ERRO = colors.HexColor("#DC2626")
TEXTO = colors.HexColor("#111827")
CINZA = colors.HexColor("#6B7280")
CINZA_CLARO = colors.HexColor("#F3F4F6")
BORDA = colors.HexColor("#D1D5DB")

styles = getSampleStyleSheet()


def estilo(nome, **kwargs):
    return ParagraphStyle(name=nome, **kwargs)


ESTILO_CAPA_TITULO = estilo(
    "CapaTitulo",
    fontName="Helvetica-Bold",
    fontSize=34,
    leading=42,
    alignment=TA_LEFT,
    textColor=colors.white,
    spaceAfter=12,
)
ESTILO_CAPA_SUB = estilo(
    "CapaSub",
    fontName="Helvetica",
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    textColor=colors.white,
    spaceAfter=24,
)
ESTILO_CAPA_TAG = estilo(
    "CapaTag",
    fontName="Helvetica-Bold",
    fontSize=11,
    alignment=TA_LEFT,
    textColor=ACENTO,
    spaceAfter=8,
)
ESTILO_CAPA_RODAPE = estilo(
    "CapaRodape",
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    alignment=TA_LEFT,
    textColor=colors.white,
)

ESTILO_H1 = estilo(
    "H1",
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=28,
    textColor=PRIMARIA,
    spaceBefore=18,
    spaceAfter=14,
    keepWithNext=1,
)
ESTILO_H2 = estilo(
    "H2",
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=20,
    textColor=PRIMARIA,
    spaceBefore=14,
    spaceAfter=8,
    keepWithNext=1,
)
ESTILO_H3 = estilo(
    "H3",
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    textColor=SECUNDARIA,
    spaceBefore=10,
    spaceAfter=6,
    keepWithNext=1,
)
ESTILO_TEXTO = estilo(
    "Texto",
    fontName="Helvetica",
    fontSize=10.5,
    leading=15.5,
    alignment=TA_JUSTIFY,
    textColor=TEXTO,
    spaceAfter=8,
)
ESTILO_LISTA = estilo(
    "Lista",
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=TEXTO,
    spaceAfter=2,
)
ESTILO_BOX_TITULO = estilo(
    "BoxTitulo",
    fontName="Helvetica-Bold",
    fontSize=11,
    textColor=colors.white,
    leading=14,
)
ESTILO_BOX_TEXTO = estilo(
    "BoxTexto",
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    textColor=TEXTO,
    alignment=TA_LEFT,
)
ESTILO_TOC = estilo(
    "TOC",
    fontName="Helvetica",
    fontSize=11,
    leading=18,
    textColor=TEXTO,
)
ESTILO_TOC_MOD = estilo(
    "TOCMod",
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=18,
    textColor=PRIMARIA,
)
ESTILO_LEGENDA = estilo(
    "Legenda",
    fontName="Helvetica-Oblique",
    fontSize=9,
    textColor=CINZA,
    alignment=TA_CENTER,
    spaceAfter=8,
)


# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------


def p(texto, estilo_par=ESTILO_TEXTO):
    return Paragraph(texto, estilo_par)


def h1(texto):
    return Paragraph(texto, ESTILO_H1)


def h2(texto):
    return Paragraph(texto, ESTILO_H2)


def h3(texto):
    return Paragraph(texto, ESTILO_H3)


def bullets(itens, estilo_item=ESTILO_LISTA, bullet="•"):
    flow = [ListItem(Paragraph(i, estilo_item), leftIndent=10, value=bullet) for i in itens]
    return ListFlowable(
        flow,
        bulletType="bullet",
        start=bullet,
        leftIndent=12,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=10,
        spaceAfter=8,
    )


def numerada(itens, estilo_item=ESTILO_LISTA):
    flow = [ListItem(Paragraph(i, estilo_item), leftIndent=14) for i in itens]
    return ListFlowable(
        flow,
        bulletType="1",
        leftIndent=18,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=10,
        spaceAfter=8,
    )


def box(titulo, conteudo, cor_titulo=SECUNDARIA, cor_fundo=colors.HexColor("#EEF4FF")):
    """Caixa de destaque (dica, aviso, checklist)."""
    if isinstance(conteudo, str):
        corpo = [Paragraph(conteudo, ESTILO_BOX_TEXTO)]
    elif isinstance(conteudo, list) and conteudo and isinstance(conteudo[0], str):
        corpo = [bullets(conteudo, ESTILO_BOX_TEXTO)]
    else:
        corpo = conteudo

    tabela = Table(
        [
            [Paragraph(titulo, ESTILO_BOX_TITULO)],
            [corpo],
        ],
        colWidths=[16.5 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), cor_titulo),
                ("BACKGROUND", (0, 1), (0, 1), cor_fundo),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.5, cor_titulo),
            ]
        ),
    )
    return KeepTogether([tabela, Spacer(1, 10)])


def dica(conteudo):
    return box("DICA DO PROFISSIONAL", conteudo, cor_titulo=SECUNDARIA,
               cor_fundo=colors.HexColor("#EEF4FF"))


def aviso(conteudo):
    return box("ATENCAO", conteudo, cor_titulo=ERRO,
               cor_fundo=colors.HexColor("#FEF2F2"))


def checklist(conteudo, titulo="CHECKLIST"):
    return box(titulo, conteudo, cor_titulo=SUCESSO,
               cor_fundo=colors.HexColor("#ECFDF5"))


def formula(conteudo, titulo="FORMULA"):
    return box(titulo, conteudo, cor_titulo=ACENTO,
               cor_fundo=colors.HexColor("#FFFBEB"))


def tabela_simples(dados, larguras=None, header=True):
    estilo_tab = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDA),
        ("TEXTCOLOR", (0, 0), (-1, -1), TEXTO),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1),
         [colors.white, CINZA_CLARO]),
    ]
    if header:
        estilo_tab += [
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARIA),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    dados_par = [
        [Paragraph(str(c), ESTILO_BOX_TEXTO) if not isinstance(c, Paragraph) else c
         for c in linha]
        for linha in dados
    ]
    # Para header, usa fonte branca via estilo customizado
    if header:
        cabec = [Paragraph(f"<b><font color='white'>{c}</font></b>", ESTILO_BOX_TEXTO)
                 for c in dados[0]]
        dados_par[0] = cabec
    t = Table(dados_par, colWidths=larguras, style=TableStyle(estilo_tab))
    return KeepTogether([t, Spacer(1, 10)])


# ---------------------------------------------------------------------------
# Documento com capa, cabecalho, rodape e numeracao
# ---------------------------------------------------------------------------


class DocumentoTreinamento(BaseDocTemplate):
    def __init__(self, caminho):
        super().__init__(
            caminho,
            pagesize=A4,
            leftMargin=2.2 * cm,
            rightMargin=2.2 * cm,
            topMargin=2.4 * cm,
            bottomMargin=2.0 * cm,
            title="Treinamento Completo de Trafego Pago",
            author="Treinamento profissional",
        )

        capa_frame = Frame(0, 0, A4[0], A4[1], id="capa", showBoundary=0,
                           leftPadding=0, rightPadding=0,
                           topPadding=0, bottomPadding=0)

        conteudo_frame = Frame(
            self.leftMargin, self.bottomMargin,
            self.width, self.height,
            id="conteudo",
        )

        self.addPageTemplates([
            PageTemplate(id="capa", frames=[capa_frame],
                         onPage=self._desenhar_capa),
            PageTemplate(id="conteudo", frames=[conteudo_frame],
                         onPage=self._desenhar_cabecalho_rodape),
        ])

    def _desenhar_capa(self, canv, doc):
        canv.saveState()
        canv.setFillColor(PRIMARIA)
        canv.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)

        # faixa diagonal decorativa
        canv.setFillColor(SECUNDARIA)
        canv.setStrokeColor(SECUNDARIA)
        path = canv.beginPath()
        path.moveTo(0, A4[1] * 0.42)
        path.lineTo(A4[0], A4[1] * 0.55)
        path.lineTo(A4[0], A4[1] * 0.48)
        path.lineTo(0, A4[1] * 0.35)
        path.close()
        canv.drawPath(path, stroke=0, fill=1)

        canv.setFillColor(ACENTO)
        canv.rect(2.2 * cm, A4[1] - 3.2 * cm, 0.5 * cm, 1.8 * cm, stroke=0, fill=1)

        canv.restoreState()

    def _desenhar_cabecalho_rodape(self, canv, doc):
        canv.saveState()
        # Cabecalho
        canv.setStrokeColor(BORDA)
        canv.setLineWidth(0.5)
        canv.line(self.leftMargin, A4[1] - 1.5 * cm,
                  A4[0] - self.rightMargin, A4[1] - 1.5 * cm)

        canv.setFont("Helvetica-Bold", 9)
        canv.setFillColor(PRIMARIA)
        canv.drawString(self.leftMargin, A4[1] - 1.2 * cm,
                        "TREINAMENTO COMPLETO DE TRAFEGO PAGO")
        canv.setFont("Helvetica", 9)
        canv.setFillColor(CINZA)
        canv.drawRightString(A4[0] - self.rightMargin, A4[1] - 1.2 * cm,
                             "Do Zero ao Profissional")

        # Rodape
        canv.line(self.leftMargin, 1.4 * cm,
                  A4[0] - self.rightMargin, 1.4 * cm)
        canv.setFont("Helvetica", 8.5)
        canv.setFillColor(CINZA)
        canv.drawString(self.leftMargin, 1.0 * cm,
                        "Treinamento profissional - uso interno")
        canv.drawRightString(A4[0] - self.rightMargin, 1.0 * cm,
                             f"Pagina {doc.page - 1}")
        canv.restoreState()


# ---------------------------------------------------------------------------
# Conteudo
# ---------------------------------------------------------------------------


def construir_capa():
    elementos = []
    # agendar troca de template para o conteudo a partir da proxima pagina
    elementos.append(NextPageTemplate("conteudo"))
    # espaco superior (a faixa decorativa cuida do visual)
    elementos.append(Spacer(1, 6.5 * cm))
    capa_tabela = Table(
        [
            [Paragraph("TREINAMENTO PROFISSIONAL", ESTILO_CAPA_TAG)],
            [Paragraph("Trafego Pago", ESTILO_CAPA_TITULO)],
            [Paragraph("Do Zero ao Profissional", ESTILO_CAPA_TITULO)],
            [Spacer(1, 8)],
            [Paragraph(
                "O passo a passo completo para planejar, lancar, otimizar e escalar "
                "campanhas pagas em Meta Ads, Google Ads e TikTok Ads com padrao de mercado.",
                ESTILO_CAPA_SUB,
            )],
            [Spacer(1, 60)],
            [Paragraph(
                "Conteudo: estrategia, estrutura de contas, rastreamento, "
                "criativos, leitura de dados, escala, relatorios e precificacao.",
                ESTILO_CAPA_RODAPE,
            )],
            [Spacer(1, 8)],
            [Paragraph("25 modulos &nbsp;|&nbsp; Checklists &nbsp;|&nbsp; "
                       "Formulas &nbsp;|&nbsp; Plano de 90 dias", ESTILO_CAPA_RODAPE)],
        ],
        colWidths=[A4[0] - 4.4 * cm],
        style=TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * cm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * cm),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]),
    )
    elementos.append(capa_tabela)
    elementos.append(PageBreak())
    return elementos


def construir_sumario():
    el = []
    el.append(h1("Sumario"))
    modulos = [
        ("Sobre este treinamento", "como usar, para quem e o que voce vai conseguir"),
        ("Modulo 1", "O que e trafego pago e por que ele funciona"),
        ("Modulo 2", "O ecossistema: plataformas, formatos e quando usar cada uma"),
        ("Modulo 3", "Vocabulario, metricas e formulas essenciais"),
        ("Modulo 4", "Funil de vendas e jornada do cliente"),
        ("Modulo 5", "Diagnostico do cliente e pesquisa de mercado"),
        ("Modulo 6", "Persona, oferta e proposta de valor"),
        ("Modulo 7", "Estrutura de contas, campanhas e nomenclatura"),
        ("Modulo 8", "Pixel, GTM, API de Conversoes e rastreamento confiavel"),
        ("Modulo 9", "Criativos: copywriting, roteiro e producao"),
        ("Modulo 10", "Meta Ads (Facebook e Instagram) - passo a passo"),
        ("Modulo 11", "Google Ads (Search, PMax, Display, YouTube) - passo a passo"),
        ("Modulo 12", "TikTok Ads - passo a passo"),
        ("Modulo 13", "Publicos, segmentacao e Lookalikes"),
        ("Modulo 14", "Orcamento, lances, CBO e ABO"),
        ("Modulo 15", "Otimizacao e leitura de dados"),
        ("Modulo 16", "Escala vertical e horizontal"),
        ("Modulo 17", "Remarketing e retargeting que vendem"),
        ("Modulo 18", "Relatorios profissionais para o cliente"),
        ("Modulo 19", "Precificacao, contrato e relacionamento"),
        ("Modulo 20", "Stack de ferramentas do gestor"),
        ("Modulo 21", "Rotina profissional - diaria, semanal e mensal"),
        ("Modulo 22", "Erros mais comuns e como evitar"),
        ("Modulo 23", "Estudos de caso e exemplos praticos"),
        ("Modulo 24", "LGPD, politicas das plataformas e boas praticas"),
        ("Modulo 25", "Plano de 90 dias e proximos passos"),
        ("Anexo A", "Glossario de trafego pago"),
        ("Anexo B", "Checklists imprimiveis"),
    ]
    linhas = []
    for titulo, desc in modulos:
        linhas.append([
            Paragraph(titulo, ESTILO_TOC_MOD),
            Paragraph(desc, ESTILO_TOC),
        ])
    t = Table(linhas, colWidths=[3.6 * cm, 12.9 * cm],
              style=TableStyle([
                  ("VALIGN", (0, 0), (-1, -1), "TOP"),
                  ("LEFTPADDING", (0, 0), (-1, -1), 0),
                  ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                  ("TOPPADDING", (0, 0), (-1, -1), 4),
                  ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                  ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDA),
              ]))
    el.append(t)
    el.append(PageBreak())
    return el


def construir_sobre():
    el = []
    el.append(h1("Sobre este treinamento"))
    el.append(p(
        "Este material foi escrito para quem quer atuar como gestor de trafego pago "
        "de forma <b>profissional</b> - prestando servico para clientes, conduzindo "
        "campanhas com metodo e responsabilidade financeira. Nao e um curso de "
        "'apertar botoes'. E um guia de processo: do diagnostico inicial ate a "
        "entrega de relatorios e a escala de resultados."
    ))
    el.append(h2("Para quem e este treinamento"))
    el.append(bullets([
        "Iniciantes que querem entender a logica de ponta a ponta antes de "
        "investir dinheiro do cliente.",
        "Freelancers e gestores juniores que ja sabem o basico e precisam "
        "estruturar a operacao.",
        "Equipes de marketing in-house que vao internalizar a midia paga.",
        "Empreendedores que querem entender o trabalho que estao contratando "
        "para nao serem enganados por 'agencias' sem metodo.",
    ]))
    el.append(h2("O que voce vai conseguir fazer ao final"))
    el.append(numerada([
        "Diagnosticar um cliente: produto, oferta, margens, ticket medio, "
        "ciclo de venda e estagio do funil.",
        "Definir objetivo, KPI principal e meta realista para cada campanha.",
        "Estruturar conta, campanhas, conjuntos e anuncios com nomenclatura "
        "limpa que sobrevive a 6 meses de operacao.",
        "Configurar pixel, eventos, API de Conversoes e GTM para ter dado "
        "confiavel.",
        "Produzir briefings de criativo, hooks, ganchos e variacoes que sao "
        "efetivamente testados em volume.",
        "Lancar campanhas em Meta Ads, Google Ads e TikTok com checklist de "
        "pre-publicacao.",
        "Ler os numeros e tomar decisoes - duplicar, pausar, otimizar, escalar.",
        "Apresentar relatorios que o cliente entende e que justificam o "
        "investimento.",
        "Precificar seu trabalho e fechar contratos com previsibilidade.",
    ]))
    el.append(dica(
        "Use este PDF como livro de cabeceira nos primeiros 90 dias. Volte em "
        "modulos especificos sempre que enfrentar uma situacao nova - oferta "
        "ruim, queda de performance, cliente questionando resultado, escala "
        "estagnada. Cada modulo termina com checklist e exemplos."
    ))
    el.append(aviso(
        "Trafego pago nao e magica e nao salva oferta ruim. Se o produto, a "
        "oferta, o atendimento ou a entrega tem problema estrutural, a midia "
        "paga vai apenas acelerar a percepcao desse problema. Sempre comece "
        "pelo diagnostico do Modulo 5 antes de gastar 1 real."
    ))
    el.append(PageBreak())
    return el


def modulo_1():
    el = []
    el.append(h1("Modulo 1 - O que e trafego pago e por que ele funciona"))
    el.append(h2("Definicao pratica"))
    el.append(p(
        "Trafego pago e o ato de comprar atencao qualificada de pessoas para um "
        "destino digital (site, perfil, landing page, WhatsApp, app) com o "
        "objetivo de gerar uma acao mensuravel - visualizacao, lead, venda, "
        "instalacao, agendamento. Diferente do trafego organico, que depende "
        "de algoritmo e tempo, o trafego pago e <b>previsivel</b>: voce paga, "
        "as plataformas entregam, e voce mede."
    ))
    el.append(h2("Por que funciona"))
    el.append(bullets([
        "<b>Volume</b> - voce alcanca milhares de pessoas em horas, nao em "
        "meses.",
        "<b>Segmentacao</b> - voce escolhe quem ve seu anuncio com base em "
        "interesses, comportamento, geografia e dados proprios.",
        "<b>Mensuracao</b> - cada real gasto pode ser rastreado ate o "
        "resultado, desde que o setup esteja correto.",
        "<b>Aprendizado das plataformas</b> - os algoritmos otimizam "
        "entregas para quem tem mais chance de converter, com base no que "
        "voce ja vendeu.",
        "<b>Escala</b> - operacoes que funcionam podem dobrar, triplicar, "
        "decuplicar com gestao adequada.",
    ]))
    el.append(h2("Trafego pago vs trafego organico vs influenciador"))
    el.append(tabela_simples([
        ["Criterio", "Pago", "Organico", "Influenciador"],
        ["Velocidade", "Alta", "Baixa", "Media"],
        ["Custo", "Variavel direto", "Tempo + producao", "Fee + producao"],
        ["Previsibilidade", "Alta", "Baixa", "Media"],
        ["Escala", "Linear ate certo ponto", "Exponencial mas demorada",
         "Pontual"],
        ["Aprendizado de marca", "Direto via dados", "Indireto", "Indireto"],
    ], larguras=[3.5 * cm, 3.7 * cm, 3.7 * cm, 3.7 * cm]))
    el.append(h2("A premissa que sustenta tudo"))
    el.append(p(
        "Trafego pago funciona quando existe <b>unidade economica positiva</b>: "
        "o lucro bruto por cliente, ao longo do tempo, supera o custo de "
        "aquisicao. Antes de discutir criativo, publico ou orcamento, voce "
        "precisa saber se o cliente tem margem para pagar pelo CAC necessario. "
        "Se o LTV (valor de um cliente no tempo) e R$ 200 e o CAC minimo da "
        "categoria e R$ 350, nao adianta mexer em campanha - tem que mexer em "
        "produto, oferta ou ticket."
    ))
    el.append(formula(
        "LTV &gt; CAC + Custos operacionais.  "
        "Regra pratica saudavel: <b>LTV / CAC &gt;= 3</b>."
    ))
    el.append(PageBreak())
    return el


def modulo_2():
    el = []
    el.append(h1("Modulo 2 - O ecossistema: plataformas, formatos e quando usar cada uma"))
    el.append(p(
        "Cada plataforma tem uma logica de consumo e um momento de jornada "
        "ideal. Escolher errado e desperdicar verba. A pergunta certa nao e "
        "'qual a melhor', e sim 'onde meu publico esta com a cabeca aberta "
        "para o que eu vendo?'."
    ))
    el.append(h2("As principais plataformas em 2026"))
    el.append(tabela_simples([
        ["Plataforma", "Forca", "Quando usar"],
        ["Meta Ads (FB+IG)", "Descoberta visual, escala em B2C",
         "Produto novo, demanda latente, oferta clara"],
        ["Google Ads - Search", "Captura de demanda ativa",
         "Servicos urgentes, marcas conhecidas, intencao alta"],
        ["Google Ads - PMax", "Multicanal automatizado",
         "E-commerce com feed, contas maduras com dados"],
        ["Google Ads - YouTube", "Branding e meio de funil",
         "Marca, educacao do publico, videos longos"],
        ["TikTok Ads", "Descoberta viral, criativo nativo",
         "Publico jovem, produto visual, oferta forte"],
        ["LinkedIn Ads", "B2B segmentado", "Servicos B2B, eventos, software"],
        ["Pinterest Ads", "Inspiracao e nicho",
         "Decoracao, moda, casamento, beleza"],
        ["Kwai / Outras", "Niches regionais", "Norte/Nordeste, classe C/D"],
    ], larguras=[3.6 * cm, 5.0 * cm, 7.0 * cm]))
    el.append(h2("Demanda latente vs demanda ativa"))
    el.append(p(
        "Esse e o conceito mais subutilizado por gestores iniciantes. "
        "<b>Demanda ativa</b> e quando a pessoa ja sabe o que quer e esta "
        "procurando - Google Search e o canto dela. <b>Demanda latente</b> "
        "e quando a pessoa nao esta procurando, mas pode se interessar se "
        "voce mostrar a ela - Meta, TikTok, YouTube sao as casas dela. "
        "Um mesmo cliente normalmente trabalha os dois ao mesmo tempo."
    ))
    el.append(dica(
        "Para servicos locais (advogado, dentista, encanador) Google Search "
        "costuma ser o primeiro canal. Para infoproduto, e-commerce de moda, "
        "beleza, comece por Meta. Para produto novo com forte apelo visual "
        "e publico jovem, TikTok. Nunca rode em todos ao mesmo tempo sem "
        "validar a base de uma plataforma."
    ))
    el.append(h2("Formatos por plataforma"))
    el.append(bullets([
        "<b>Meta</b>: imagem unica, carrossel, video, reels, stories, "
        "colecao, advantage+.",
        "<b>Google</b>: textuais (search), responsivos display, video "
        "in-stream/in-feed, shopping, performance max.",
        "<b>TikTok</b>: video nativo curto (8-30s) sempre 9:16, spark ads "
        "(impulsionamento de organico), top view.",
    ]))
    el.append(PageBreak())
    return el


def modulo_3():
    el = []
    el.append(h1("Modulo 3 - Vocabulario, metricas e formulas essenciais"))
    el.append(p(
        "Sem dominar essas siglas voce vai falar com o cliente como amador. "
        "Decore as formulas - elas viram intuicao com o tempo."
    ))
    el.append(h2("Metricas de entrega"))
    el.append(tabela_simples([
        ["Metrica", "O que e", "Como usar"],
        ["Impressoes", "Vezes que o anuncio foi exibido",
         "Indicador de alcance bruto"],
        ["Alcance", "Pessoas unicas atingidas",
         "Saturacao de publico"],
        ["Frequencia", "Impressoes / Alcance",
         "Acima de 3 em prospeccao = atencao"],
        ["CPM", "Custo por mil impressoes",
         "Termometro de concorrencia e qualidade do criativo"],
        ["CPC", "Custo por clique",
         "Pista de relevancia e disputa"],
        ["CTR", "Cliques / Impressoes",
         "Sinal de atratividade do criativo"],
    ], larguras=[3.0 * cm, 5.5 * cm, 7.0 * cm]))
    el.append(h2("Metricas de conversao"))
    el.append(tabela_simples([
        ["Metrica", "O que e", "Bom referencial"],
        ["CPL", "Custo por lead", "Varia por nicho - benchmark do seu nicho"],
        ["CPA", "Custo por aquisicao",
         "Deve ser &lt;= seu CAC alvo"],
        ["Taxa de conversao", "Conversoes / Cliques",
         "1% a 5% em e-commerce padrao"],
        ["ROAS", "Receita / Investimento em ads",
         "Acima do seu break-even ROAS"],
        ["CAC", "Custo total para adquirir 1 cliente",
         "Inclui ads + ferramentas + comissao"],
        ["LTV", "Receita media de 1 cliente no tempo",
         "Calcule por coorte sempre que possivel"],
    ], larguras=[3.0 * cm, 5.5 * cm, 7.0 * cm]))
    el.append(h2("Formulas chave para decorar"))
    el.append(formula(
        "<b>CPM</b> = (Investimento / Impressoes) x 1000<br/>"
        "<b>CPC</b> = Investimento / Cliques<br/>"
        "<b>CTR</b> = (Cliques / Impressoes) x 100<br/>"
        "<b>Taxa de conversao</b> = (Conversoes / Cliques) x 100<br/>"
        "<b>CPA</b> = Investimento / Conversoes<br/>"
        "<b>ROAS</b> = Receita atribuida / Investimento<br/>"
        "<b>ROI</b> = (Lucro - Investimento) / Investimento<br/>"
        "<b>Break-even ROAS</b> = 1 / Margem bruta"
    ))
    el.append(h2("Como interpretar em conjunto"))
    el.append(p(
        "Numeros isolados mentem. Sempre olhe em conjunto. Exemplo: CTR alto "
        "com CPA ruim quase sempre significa criativo enganoso - chama "
        "atencao mas atrai publico errado. CPM baixo com CPA ruim pode ser "
        "publico de baixa qualidade. CPM alto com ROAS bom pode ser publico "
        "premium - mantenha. Aprenda a ler o <b>conjunto</b>."
    ))
    el.append(dica(
        "Construa uma planilha mestre com benchmarks dos seus proprios "
        "clientes por nicho. Em 6 meses voce tem o melhor banco de "
        "referencias do mercado para o seu portfolio - e isso vira "
        "argumento de venda."
    ))
    el.append(PageBreak())
    return el


def modulo_4():
    el = []
    el.append(h1("Modulo 4 - Funil de vendas e jornada do cliente"))
    el.append(p(
        "O funil e o mapa mental que organiza tudo: qual conteudo entregar, "
        "qual oferta fazer e qual metrica cobrar em cada estagio. Quem nao "
        "pensa em funil queima dinheiro tentando vender para quem ainda nao "
        "sabe que tem o problema."
    ))
    el.append(h2("Os tres niveis classicos"))
    el.append(bullets([
        "<b>Topo (TOFU - awareness)</b>: a pessoa nao te conhece nem sabe "
        "que tem o problema. Conteudo educativo, video curto, criativos de "
        "descoberta. KPI: CPM, alcance, view rate, custo por engajamento.",
        "<b>Meio (MOFU - consideration)</b>: a pessoa sabe que tem o "
        "problema e esta comparando solucoes. Conteudo comparativo, "
        "depoimentos, casos. KPI: CPL, custo por mensagem, custo por "
        "visita qualificada.",
        "<b>Fundo (BOFU - conversion)</b>: a pessoa quer comprar, falta "
        "decidir de quem. Oferta direta, urgencia, garantia, prova social "
        "forte. KPI: CPA, ROAS, ticket medio, taxa de fechamento.",
    ]))
    el.append(h2("Jornada estendida - 5 estagios de consciencia"))
    el.append(p(
        "Modelo de Eugene Schwartz, ainda utilizado em 2026 por qualquer "
        "copywriter serio:"
    ))
    el.append(numerada([
        "<b>Inconsciente</b> - nao sabe que tem o problema.",
        "<b>Consciente do problema</b> - sente a dor mas nao busca solucao.",
        "<b>Consciente da solucao</b> - sabe que existem solucoes, nao "
        "conhece a sua.",
        "<b>Consciente do produto</b> - conhece o seu produto, esta "
        "decidindo.",
        "<b>Plenamente consciente</b> - so falta o gatilho final - desconto, "
        "garantia, urgencia.",
    ]))
    el.append(dica(
        "O criativo que funciona para um estagio raramente funciona para "
        "outro. Estagios 1 e 2 pedem historia e identificacao. 3 e 4 pedem "
        "comparacao e prova. 5 pede oferta seca. Erro classico: rodar oferta "
        "agressiva no topo do funil para publico frio - paga caro e converte "
        "pouco."
    ))
    el.append(h2("Mapeando a jornada para campanhas"))
    el.append(tabela_simples([
        ["Estagio", "Objetivo da campanha", "Publico", "Criativo tipico"],
        ["TOFU", "Alcance / Engajamento / Video views",
         "Interesses, lookalikes amplos",
         "Video educativo, hook forte"],
        ["MOFU", "Trafego / Conversoes - lead",
         "Engajadores, visitantes site",
         "Depoimento, comparativo"],
        ["BOFU", "Conversoes - compra / mensagem",
         "Carrinho abandonado, leads",
         "Oferta direta, urgencia"],
    ], larguras=[2.5 * cm, 4.5 * cm, 4.0 * cm, 5.0 * cm]))
    el.append(PageBreak())
    return el


def modulo_5():
    el = []
    el.append(h1("Modulo 5 - Diagnostico do cliente e pesquisa de mercado"))
    el.append(p(
        "Esta e a etapa que separa o profissional do amador. Antes de abrir "
        "o gerenciador de anuncios, voce precisa entender o negocio. Sem "
        "diagnostico, voce esta apostando o dinheiro do cliente."
    ))
    el.append(h2("Perguntas obrigatorias no onboarding"))
    el.append(numerada([
        "Qual e o produto/servico, com detalhe? (variacoes, ticket, margem)",
        "Quem e o cliente atual - dados reais, nao palpite?",
        "Qual e o problema que voce resolve - na linguagem do cliente?",
        "Qual a oferta atual (preco, garantia, bonus, parcelamento)?",
        "Qual o ciclo medio de venda - dias entre primeiro contato e "
        "fechamento?",
        "Qual o LTV medio e o CAC alvo (calculado, nao chutado)?",
        "Como e o processo de venda hoje - quem responde, em quanto tempo, "
        "com qual script?",
        "Quais sao as objecoes mais frequentes que o cliente ouve?",
        "Quem sao os 3 concorrentes diretos e o que voce faz melhor?",
        "Qual e a meta - numero, prazo e quem cobra?",
        "Qual o orcamento mensal de midia disponivel? Verba so para midia "
        "ou inclui ferramentas e producao?",
        "Quais campanhas ja rodaram? O que funcionou? O que falhou?",
        "Tem material de marca (logo, paleta, fontes, manual)?",
        "Quem aprova criativo - prazo de aprovacao?",
    ]))
    el.append(h2("Pesquisa de mercado em 5 passos"))
    el.append(numerada([
        "<b>Mapeie concorrentes</b> - busque os 5 maiores no Google e nas "
        "redes. Anote oferta, preco, garantia, formato de criativo, "
        "publico aparente.",
        "<b>Biblioteca de anuncios</b> - use Meta Ads Library e Google Ads "
        "Transparency Center para ver criativos ativos dos concorrentes. "
        "Anote os que rodam ha mais tempo (sinal de que funcionam).",
        "<b>Reviews e avaliacoes</b> - leia o Reclame Aqui, Google Reviews, "
        "comentarios de Instagram. As dores e desejos reais estao ali.",
        "<b>Forums e comunidades</b> - Reddit, grupos de Facebook, comunidades "
        "do nicho. Linguagem nativa do cliente vira copy.",
        "<b>Pesquisa direta</b> - se possivel, entreviste 5 clientes atuais "
        "do seu cliente. 15 minutos cada. As frases que eles usam viram "
        "headlines de campanha.",
    ]))
    el.append(checklist([
        "Briefing assinado pelo cliente",
        "Acesso ao gerenciador, conta de anuncio, Pixel, GTM",
        "Acesso ao site, CMS, dominio (para instalacao de pixel)",
        "Acesso ao CRM ou planilha de vendas",
        "Material de marca recebido",
        "Aprovador de criativo definido com SLA",
        "Conta bancaria/cartao configurado nas plataformas",
        "Termos LGPD e politica de privacidade do cliente revisados",
    ], titulo="CHECKLIST DE ONBOARDING"))
    el.append(PageBreak())
    return el


def modulo_6():
    el = []
    el.append(h1("Modulo 6 - Persona, oferta e proposta de valor"))
    el.append(h2("Construindo a persona util"))
    el.append(p(
        "Esqueca a persona de manual antigo (nome, idade, hobbies). O que "
        "importa para trafego pago e o <b>contexto de dor e desejo</b> da "
        "persona em tres camadas:"
    ))
    el.append(bullets([
        "<b>Demografia minima necessaria</b> - faixa etaria, genero (se "
        "relevante), regiao, renda aproximada. Apenas o que muda a oferta.",
        "<b>Contexto da dor</b> - o que esta acontecendo na vida dela <i>agora</i> "
        "que faz seu produto ser interessante? Frustracao, mudanca de fase, "
        "evento de gatilho.",
        "<b>Linguagem nativa</b> - como ela descreve o problema. Use essas "
        "palavras nos headlines. Nao traduza para 'marketes'.",
    ]))
    el.append(h2("Anatomia de uma oferta forte"))
    el.append(p(
        "Oferta nao e produto. Oferta e a soma da promessa + condicoes + "
        "reducao de risco. Toda oferta vencedora tem estes elementos:"
    ))
    el.append(numerada([
        "<b>Resultado especifico</b> - o que muda na vida do cliente, "
        "mensuravel.",
        "<b>Prazo</b> - em quanto tempo o resultado aparece.",
        "<b>Mecanismo unico</b> - por que so voce entrega isso (metodo, "
        "tecnologia, exclusividade).",
        "<b>Bonus</b> - 1 a 3 bonus que aumentam valor percebido sem "
        "aumentar muito o custo.",
        "<b>Garantia</b> - reducao de risco. Devolucao, 'so paga se "
        "funcionar', teste gratis.",
        "<b>Urgencia ou escassez</b> - real, nunca falsa. Vagas, prazo, "
        "lote.",
        "<b>Preco e parcelamento</b> - ancorado em algo maior (preco "
        "cheio, comparativo).",
    ]))
    el.append(formula(
        "<b>Equacao de valor (Alex Hormozi):</b><br/>"
        "Valor = (Resultado x Probabilidade percebida) / (Tempo x Esforco percebido)<br/><br/>"
        "Para aumentar valor: aumente resultado e probabilidade, "
        "diminua tempo e esforco percebidos pelo cliente."
    ))
    el.append(h2("Teste de oferta antes do criativo"))
    el.append(p(
        "Se a oferta nao convence num WhatsApp, em uma conversa de mesa de "
        "bar ou em 5 linhas escritas, ela nao vai converter em anuncio. "
        "Teste verbalmente com 5 pessoas do publico-alvo antes de produzir "
        "criativos. Anote duvidas e objecoes - elas viram secao da landing "
        "page."
    ))
    el.append(aviso(
        "Nao tente 'corrigir' uma oferta fraca com criativo bonito. Se a "
        "oferta nao tem promessa clara, mecanismo e reducao de risco, "
        "qualquer verba escala o problema. Faca o cliente reformular a "
        "oferta antes."
    ))
    el.append(PageBreak())
    return el


def modulo_7():
    el = []
    el.append(h1("Modulo 7 - Estrutura de contas, campanhas e nomenclatura"))
    el.append(h2("Hierarquia padrao"))
    el.append(p(
        "Em todas as plataformas existem tres niveis (com nomes diferentes):"
    ))
    el.append(tabela_simples([
        ["Plataforma", "Nivel 1", "Nivel 2", "Nivel 3"],
        ["Meta Ads", "Campanha (objetivo)", "Conjunto (publico, orcamento)",
         "Anuncio (criativo)"],
        ["Google Ads", "Campanha (rede, lance)", "Grupo de anuncios "
         "(palavras-chave/publicos)", "Anuncio (textual/responsivo)"],
        ["TikTok Ads", "Campanha (objetivo)", "Grupo de anuncios "
         "(publico, orcamento)", "Anuncio (video)"],
    ], larguras=[3.0 * cm, 3.5 * cm, 5.5 * cm, 4.5 * cm]))
    el.append(h2("Nomenclatura - a regra de ouro"))
    el.append(p(
        "Nomenclatura ruim e fonte numero um de operacao caotica. "
        "Padronize <b>antes</b> de criar a primeira campanha. Use codigos "
        "curtos, separadores consistentes (geralmente <code>|</code> ou <code>_</code>) "
        "e ordem fixa."
    ))
    el.append(formula(
        "<b>Padrao sugerido de campanha:</b><br/>"
        "[Cliente] | [Objetivo] | [Funil] | [Plataforma] | [Mes/Ano]<br/><br/>"
        "Exemplo: <code>ACME | Conversao | BOFU | Meta | 05-2026</code><br/><br/>"
        "<b>Padrao de conjunto:</b><br/>"
        "[Publico] | [Localizacao] | [Idade] | [Estrategia]<br/><br/>"
        "Exemplo: <code>LAL 1% Compradores | BR-SE | 25-55 | CBO</code><br/><br/>"
        "<b>Padrao de anuncio:</b><br/>"
        "[Formato] | [Angulo] | [Hook] | [Versao]<br/><br/>"
        "Exemplo: <code>Video | Dor | 'Cansado de pagar caro?' | v1</code>"
    ))
    el.append(h2("Quantas campanhas, quantos conjuntos?"))
    el.append(p(
        "Erro classico: explodir a conta em 50 conjuntos com R$ 20 cada. "
        "O algoritmo nao aprende com volume baixo. Regra pratica:"
    ))
    el.append(bullets([
        "Comece com no maximo <b>1 campanha por objetivo</b> por funil.",
        "Cada conjunto precisa de orcamento minimo para sair da fase de "
        "aprendizagem (Meta: ~50 conversoes em 7 dias).",
        "Se a verba total nao garante isso, <b>consolide</b> publicos em "
        "menos conjuntos.",
        "Use CBO/Advantage+ para deixar o algoritmo distribuir entre "
        "conjuntos semelhantes.",
    ]))
    el.append(dica(
        "Documente a estrutura em um Notion/Doc compartilhado com o cliente. "
        "Quando ele perguntar 'por que essa campanha existe?', voce abre o "
        "doc e mostra. Profissionalismo se constroi com paper trail."
    ))
    el.append(PageBreak())
    return el


def modulo_8():
    el = []
    el.append(h1("Modulo 8 - Pixel, GTM, API de Conversoes e rastreamento confiavel"))
    el.append(p(
        "Sem rastreamento, voce esta cego. Sem rastreamento <i>correto</i>, "
        "voce esta cego e ainda toma decisoes erradas com dados falsos. "
        "Antes de qualquer otimizacao, o setup tecnico precisa estar limpo."
    ))
    el.append(h2("Componentes minimos do setup"))
    el.append(numerada([
        "<b>Pixel da Meta</b> - instalado no site, no header, em todas as "
        "paginas.",
        "<b>Tag do Google</b> - GA4 + Google Ads (mesmo gtag.js).",
        "<b>Google Tag Manager (GTM)</b> - container central que dispara "
        "pixels e eventos via gatilhos.",
        "<b>API de Conversoes (CAPI Meta)</b> - envia eventos do servidor, "
        "compensa perdas de cookie e iOS 14+.",
        "<b>Conversao avancada do Google</b> - envia hashes de e-mail e "
        "telefone para casar conversoes off-cookie.",
        "<b>Consent Mode v2 (Google)</b> - obrigatorio em mercados com "
        "consentimento; afeta atribuicao.",
    ]))
    el.append(h2("Eventos padrao que voce precisa configurar"))
    el.append(tabela_simples([
        ["Evento", "Quando dispara", "Onde"],
        ["PageView", "Em todas as paginas", "Header global"],
        ["ViewContent", "Visualizou pagina de produto", "Loja, infoproduto"],
        ["AddToCart", "Adicionou ao carrinho", "E-commerce"],
        ["InitiateCheckout", "Iniciou checkout", "E-commerce"],
        ["Lead", "Enviou formulario", "Lead-gen"],
        ["CompleteRegistration", "Concluiu cadastro", "Apps, contas"],
        ["Purchase", "Comprou - com valor + moeda", "E-commerce, infoproduto"],
        ["Contact", "Clicou em WhatsApp/telefone", "Servicos"],
    ], larguras=[4.0 * cm, 6.5 * cm, 6.0 * cm]))
    el.append(h2("Validando o setup - antes de gastar 1 real"))
    el.append(numerada([
        "Use o <b>Meta Pixel Helper</b> (extensao Chrome) e veja todos os "
        "eventos disparando.",
        "Use o <b>Tag Assistant</b> do Google e o <b>GA4 DebugView</b>.",
        "No gerenciador de eventos da Meta, acompanhe a aba 'Eventos de "
        "teste' simulando um funil completo.",
        "Confirme que o evento de compra envia <b>valor</b> e <b>moeda</b> "
        "(para ROAS funcionar).",
        "Confirme que a API de Conversoes esta marcada como ativa e com "
        "qualidade alta (Match Quality acima de 7).",
        "Verifique deduplicacao - o mesmo evento nao deve ser contado duas "
        "vezes via pixel e CAPI; usa <code>event_id</code>.",
    ]))
    el.append(aviso(
        "iOS 14+, navegadores com bloqueio de tracker e legislacao de "
        "privacidade <b>derrubaram a precisao do pixel</b>. Sem API de "
        "Conversoes e conversao avancada, voce perde de 30% a 60% dos "
        "dados. Hoje isso nao e opcional - e o minimo profissional."
    ))
    el.append(checklist([
        "Pixel Meta disparando PageView em todas as paginas",
        "Eventos de conversao testados em ambiente real",
        "API de Conversoes ativa com matching de alta qualidade",
        "GA4 com eventos personalizados configurados",
        "Google Ads conectado ao GA4 e importando conversoes",
        "Consent Mode v2 instalado se aplicavel",
        "UTM padrao definido em todos os links",
        "Conversoes principais marcadas como 'primarias' no Google Ads",
    ], titulo="CHECKLIST DE RASTREAMENTO"))
    el.append(PageBreak())
    return el


def modulo_9():
    el = []
    el.append(h1("Modulo 9 - Criativos: copywriting, roteiro e producao"))
    el.append(p(
        "Em 2026, criativo e <b>80% do resultado</b>. Publico amplo, "
        "algoritmo evoluido - quem ganha e quem produz criativo melhor em "
        "mais volume. A operacao precisa estar montada para gerar "
        "criativo continuamente."
    ))
    el.append(h2("Estrutura de criativo que vende"))
    el.append(numerada([
        "<b>Hook (0-3s)</b> - para o scroll. Surpresa, problema, promessa "
        "ousada, padrao quebrado.",
        "<b>Desenvolvimento (3-15s)</b> - explica o problema, agita a dor, "
        "mostra que voce entende.",
        "<b>Solucao (15-30s)</b> - apresenta o produto/servico como ponte "
        "para o resultado.",
        "<b>Prova (30-45s)</b> - depoimento, antes/depois, dado, mostra "
        "que funciona.",
        "<b>CTA</b> - acao clara. 'Clique no link', 'Chame no WhatsApp', "
        "'Aproveite hoje'.",
    ]))
    el.append(h2("Hooks que funcionam - bibliotecas de ganchos"))
    el.append(bullets([
        "<i>'Voce esta cometendo esse erro sem perceber...'</i>",
        "<i>'3 sinais de que voce precisa de [X] agora.'</i>",
        "<i>'A maioria nao sabe disso sobre [tema]...'</i>",
        "<i>'Eu testei [solucao A] vs [solucao B] e o resultado me surpreendeu.'</i>",
        "<i>'Por que [autoridade] nunca usa [pratica comum].'</i>",
        "<i>'Pare de fazer [X] - faca [Y] no lugar.'</i>",
        "<i>'Como sai de [situacao ruim] para [situacao boa] em [tempo].'</i>",
    ]))
    el.append(h2("Volume de criativos - quanto produzir?"))
    el.append(p(
        "Operacao profissional mantem fluxo continuo. Padrao saudavel "
        "para um cliente medio:"
    ))
    el.append(tabela_simples([
        ["Verba mensal", "Criativos novos / semana", "Variacoes por hook"],
        ["Ate R$ 3.000", "2 a 3", "3 a 5"],
        ["R$ 3.000 a 15.000", "5 a 8", "5 a 8"],
        ["R$ 15.000 a 50.000", "10 a 15", "8 a 12"],
        ["Acima de R$ 50.000", "15 a 30", "12+ por hook"],
    ], larguras=[4.0 * cm, 5.5 * cm, 5.0 * cm]))
    el.append(h2("Briefing de criativo - modelo"))
    el.append(box("MODELO DE BRIEFING", [
        "<b>Objetivo</b>: o que o anuncio precisa fazer (lead, venda, view).",
        "<b>Publico-alvo</b>: descricao em 2 linhas - dor, contexto.",
        "<b>Hook principal</b>: a frase que abre o video.",
        "<b>Pontos obrigatorios</b>: 3 a 5 bullets que precisam aparecer.",
        "<b>Tom</b>: educativo, urgente, divertido, etc.",
        "<b>Formato</b>: video 9:16, carrossel 5 cards, estatico.",
        "<b>Duracao</b>: ate 30s, ate 60s.",
        "<b>CTA</b>: frase final exata.",
        "<b>Referencias</b>: 2 a 3 criativos que voce quer espelhar.",
        "<b>Prazo de entrega</b>: data limite.",
    ], cor_titulo=PRIMARIA, cor_fundo=colors.HexColor("#F8FAFC")))
    el.append(dica(
        "Sempre teste novos <b>hooks</b> primeiro, antes de variar "
        "qualquer outra coisa. O hook responde por mais de 50% do "
        "resultado de um video curto. Se o hook nao para o scroll, o "
        "resto do criativo nao importa."
    ))
    el.append(PageBreak())
    return el


def modulo_10():
    el = []
    el.append(h1("Modulo 10 - Meta Ads (Facebook e Instagram) - passo a passo"))
    el.append(p(
        "Meta ainda concentra a maior parte da verba de PMEs no Brasil em "
        "2026. Dominar o gerenciador e obrigatorio. Veja o passo a passo "
        "completo para lancar uma campanha com padrao profissional."
    ))
    el.append(h2("Pre-requisitos antes da primeira campanha"))
    el.append(bullets([
        "Business Manager criado e configurado",
        "Conta de anuncios com forma de pagamento aprovada",
        "Pixel + API de Conversoes ativos e validados",
        "Paginas do Facebook e Instagram vinculadas e verificadas",
        "Dominio verificado no Business Manager",
        "Eventos priorizados na configuracao 'Mensuracao de eventos "
        "agregados' (importante para iOS)",
        "Politicas - revise se o produto nao infringe (saude, financeiro, "
        "namoro, etc. tem regras especificas)",
    ]))
    el.append(h2("Escolha do objetivo de campanha"))
    el.append(tabela_simples([
        ["Objetivo Meta", "Quando usar"],
        ["Vendas", "Quando ha pixel e conversoes consistentes (50+/sem)"],
        ["Cadastros (Leads)", "Lead-gen para servicos e B2C"],
        ["Engajamento", "Construir engajamento, mensagens, perfil"],
        ["Reconhecimento", "Awareness em escala"],
        ["Trafego", "Levar para site externo - use com cautela"],
        ["Promocao de App", "Apps com SDK integrado"],
    ], larguras=[4.5 * cm, 10.5 * cm]))
    el.append(h2("Passo a passo - campanha de conversao"))
    el.append(numerada([
        "<b>Nivel campanha</b>: escolha 'Vendas' (ou 'Cadastros'). Ative "
        "Advantage Campaign Budget se for testar varios conjuntos. Defina "
        "categoria especial se aplicavel (emprego, credito, habitacao, "
        "politica).",
        "<b>Nivel conjunto</b>: escolha o local de conversao (site, app, "
        "WhatsApp, instantaneo). Selecione o evento de conversao "
        "(Purchase, Lead, Contact). Defina orcamento - diario ou "
        "vitalicio. Defina periodo - aberto para campanhas perenes.",
        "<b>Publico</b>: comece com Advantage+ ou publico amplo (sem "
        "interesses, so localizacao + idade + idioma). Em 2026, "
        "segmentacao manual estreita perde para amplo.",
        "<b>Posicionamentos</b>: comece com 'Advantage+ posicionamentos' "
        "para aprendizado mais rapido.",
        "<b>Otimizacao e entrega</b>: escolha o evento de conversao "
        "correto. Mantenha 'Maior volume' a menos que tenha motivo para "
        "'Custo controlado' ou 'Custo por resultado alvo'.",
        "<b>Nivel anuncio</b>: faca de 3 a 6 variacoes de criativo por "
        "conjunto. Use 'Otimizacao Advantage+ creative' so depois que "
        "voce ja testou criativos manuais.",
        "<b>UTMs</b>: configure UTMs padrao - "
        "<code>utm_source=meta&amp;utm_medium=paid&amp;utm_campaign={{campaign.name}}"
        "&amp;utm_content={{ad.name}}</code>.",
        "<b>Revisao final</b>: confira pixel, evento, publico, orcamento, "
        "criativos, link, UTM. Use o checklist abaixo.",
        "<b>Publique</b> e marque o horario no diario de operacao.",
    ]))
    el.append(checklist([
        "Pixel + CAPI ativos e em alta qualidade",
        "Evento de conversao correto selecionado",
        "Orcamento dentro do briefing",
        "Publico salvo com nomenclatura padrao",
        "Criativos com 3 a 6 variacoes",
        "Texto principal, headline, descricao e CTA preenchidos",
        "Link de destino testado em mobile",
        "UTMs padrao configurados",
        "Politicas revisadas (saude, financeiro, etc.)",
        "Aprovado pelo cliente",
    ], titulo="CHECKLIST PRE-PUBLICACAO META"))
    el.append(h2("Fase de aprendizagem"))
    el.append(p(
        "Toda campanha nova entra em 'fase de aprendizagem' ate atingir "
        "~50 conversoes em 7 dias. Durante essa fase, <b>nao mude</b> "
        "publico, orcamento, criativo ou objetivo - voce reseta o "
        "aprendizado. Se precisar mudar, duplique o conjunto e teste em "
        "paralelo."
    ))
    el.append(aviso(
        "Se o conjunto fica em 'Aprendizagem limitada' por mais de 7 dias "
        "sem atingir 50 conversoes, ele nao vai performar bem. Solucoes: "
        "aumentar orcamento, ampliar publico, usar evento de conversao "
        "mais alto no funil (ex: 'Adicionar ao carrinho' em vez de "
        "'Compra' para contas pequenas)."
    ))
    el.append(PageBreak())
    return el


def modulo_11():
    el = []
    el.append(h1("Modulo 11 - Google Ads (Search, PMax, Display, YouTube) - passo a passo"))
    el.append(h2("Search - captura de demanda ativa"))
    el.append(numerada([
        "<b>Pesquisa de palavras-chave</b>: use o Planejador, Semrush, "
        "Ubersuggest. Agrupe por intencao - informacional, comparativa, "
        "transacional.",
        "<b>Estrutura de campanha</b>: 1 campanha por linha de produto / "
        "1 grupo de anuncios por tema de palavra-chave.",
        "<b>Tipos de correspondencia</b>: comece com <b>frase</b> e "
        "<b>exata</b>. Use ampla somente com lances Smart e contas "
        "maduras.",
        "<b>Palavras negativas</b>: monte lista no primeiro dia "
        "('gratis', 'curso', 'reclame', concorrentes que voce nao quer). "
        "Atualize semanalmente com o relatorio de termos de pesquisa.",
        "<b>Anuncios responsivos de pesquisa (RSA)</b>: 15 titulos e 4 "
        "descricoes, com diversidade. Use 'Forca do anuncio' &gt;= 'Boa'.",
        "<b>Extensoes (assets)</b>: sitelinks, frases de destaque, "
        "snippets estruturados, chamada, formulario de lead, local. "
        "Quanto mais espaco voce ocupa na SERP, mais clique e melhor o "
        "Indice de Qualidade.",
        "<b>Lances</b>: comece com 'Maximizar cliques' por 7-14 dias "
        "para gerar dados. Mude para 'tCPA' ou 'tROAS' quando tiver "
        "30+ conversoes/mes.",
        "<b>Indice de Qualidade</b>: foque em CTR, relevancia do anuncio "
        "e experiencia da pagina. Cada ponto de QS reduz ate 20% do CPC.",
    ]))
    el.append(h2("Performance Max (PMax)"))
    el.append(p(
        "Campanha multicanal automatizada que distribui em todos os "
        "inventarios do Google. Funciona bem para e-commerce com feed e "
        "para contas com bom historico de conversao."
    ))
    el.append(bullets([
        "<b>Sinais de publico</b>: alimente com listas de clientes, "
        "publicos personalizados, intencao - sao 'dicas' para o algoritmo, "
        "nao restricoes.",
        "<b>Grupos de assets</b>: 1 grupo por tema/segmento de produto. "
        "Inclua videos, imagens, logos, headlines diversificados.",
        "<b>Feed do Merchant Center</b>: titulos otimizados, GTIN "
        "correto, imagens de qualidade. PMax depende fortemente do feed.",
        "<b>Listas negativas</b>: peca ao gerente do Google ou solicite "
        "via formulario para excluir marca / termos especificos.",
        "<b>Atribuicao</b>: ative 'Atribuicao Baseada em Dados' (DDA).",
    ]))
    el.append(h2("Display"))
    el.append(bullets([
        "Ideal para remarketing e awareness, raramente para conversao "
        "direta.",
        "Use publicos de remarketing, semelhantes (onde ainda existem) e "
        "intencao personalizada.",
        "Criativos responsivos com 5 imagens, 5 logos, 5 titulos, 5 "
        "descricoes minimo.",
    ]))
    el.append(h2("YouTube Ads"))
    el.append(bullets([
        "<b>Skippable in-stream</b>: cobra por view de 30s+ ou clique. "
        "Ideal para meio de funil.",
        "<b>Non-skippable</b>: 15s, paga por impressao. Branding.",
        "<b>Bumper</b>: 6s, alto alcance, baixo custo por impressao.",
        "<b>In-feed</b>: aparece nos resultados de pesquisa do YouTube e "
        "no feed. Funciona para conteudo longo, educativo.",
        "Use a estrutura 'hook nos primeiros 5 segundos', mostre a marca "
        "no primeiro segundo, repita o CTA tres vezes.",
    ]))
    el.append(checklist([
        "Conversoes importadas do GA4 ou diretas do Google Ads",
        "Conversao avancada ativa",
        "Pelo menos 1 conversao marcada como 'Primaria'",
        "Auto-tagging ativo (gclid)",
        "Lista de palavras negativas inicial criada",
        "Lances iniciais coerentes com a fase",
        "Locais e idiomas corretos",
        "Cronograma de exibicao definido se aplicavel",
        "Limite diario que nao quebra a conta",
    ], titulo="CHECKLIST PRE-PUBLICACAO GOOGLE ADS"))
    el.append(PageBreak())
    return el


def modulo_12():
    el = []
    el.append(h1("Modulo 12 - TikTok Ads - passo a passo"))
    el.append(p(
        "TikTok cresceu em verba publicitaria no Brasil ano apos ano. "
        "Tem CPM baixo, publico engajado e premia criativo nativo. Quem "
        "tenta levar criativo de Meta para TikTok geralmente queima "
        "dinheiro - o codigo aqui e outro."
    ))
    el.append(h2("Caracteristicas do TikTok que mudam o jogo"))
    el.append(bullets([
        "Criativo precisa parecer organico - nao publicidade.",
        "Som obrigatorio - 90% dos usuarios consome com audio.",
        "Formato 9:16 vertical sempre. Quadrado ou paisagem falham.",
        "Primeiros 3 segundos sao tudo. Sem call-out de marca logo de "
        "cara.",
        "Tendencias se renovam toda semana - acompanhe.",
        "UGC (user-generated content) performa muito mais que producao "
        "polida.",
    ]))
    el.append(h2("Passo a passo - campanha de conversao"))
    el.append(numerada([
        "<b>Crie a conta de anuncios no TikTok Business Center</b> e "
        "instale o Pixel TikTok + Eventos API (similar ao CAPI da Meta).",
        "<b>Crie a campanha</b>: objetivo 'Conversoes do site' ou "
        "'Geracao de leads'. Ative 'Otimizacao de orcamento da campanha "
        "(CBO)' se for testar varios conjuntos.",
        "<b>Grupo de anuncios</b>: posicionamento 'TikTok' (evite "
        "Pangle/Outras no comeco), publico amplo, otimizacao para "
        "conversao especifica.",
        "<b>Publico</b>: comece amplo, defina apenas idade, regiao e "
        "idioma. Custom Audiences depois.",
        "<b>Lance</b>: 'Custo mais baixo' por 7-14 dias. Custo por "
        "resultado alvo so apos ter base.",
        "<b>Criativo</b>: 4 a 6 videos verticais, 9-30 segundos, com "
        "audio nativo. Faca Spark Ads (impulsionar postagem organica) "
        "sempre que possivel - performam melhor.",
        "<b>CTA</b>: use os CTAs nativos - 'Saiba Mais', 'Compre Agora', "
        "'Cadastre-se'.",
    ]))
    el.append(h2("TikTok Creative Codes - o que copiar"))
    el.append(bullets([
        "<b>POV / storytelling</b>: 'POV: voce descobriu que...' / "
        "'Eu nao acreditava ate que...'",
        "<b>Antes e depois</b>: transformacao visivel.",
        "<b>Lista rapida</b>: '3 motivos pra...' / '5 erros que voce "
        "comete...'",
        "<b>Tutorial / hack</b>: 'Como fazer X em 30 segundos.'",
        "<b>Resposta a comentario</b>: parece organico, alta retencao.",
        "<b>Trending audio</b>: usar trilha em tendencia da semana - "
        "boost de alcance.",
    ]))
    el.append(dica(
        "TikTok 'queima' criativo mais rapido que Meta. Tenha 4-8 criativos "
        "novos por semana minimamente. Quando um para de escalar, "
        "geralmente saturou o publico - troque, nao otimize."
    ))
    el.append(PageBreak())
    return el


def modulo_13():
    el = []
    el.append(h1("Modulo 13 - Publicos, segmentacao e Lookalikes"))
    el.append(h2("Tipos de publico"))
    el.append(tabela_simples([
        ["Categoria", "Exemplos", "Quando usar"],
        ["Publicos amplos", "So localizacao + idade",
         "Topo de funil em contas com bom pixel"],
        ["Interesses", "Comportamento, paginas curtidas",
         "Validar nichos especificos"],
        ["Personalizados", "Visitantes do site, lista de clientes, "
         "interagiu com pagina",
         "Remarketing, exclusoes, sementes"],
        ["Lookalikes (LAL)", "1%, 2%, 3%... de uma semente",
         "Expandir a partir de quem ja converteu"],
        ["Combinados", "LAL excluindo compradores recentes",
         "Refinamento avancado"],
    ], larguras=[3.2 * cm, 5.0 * cm, 7.3 * cm]))
    el.append(h2("Hierarquia para escolher publicos"))
    el.append(numerada([
        "<b>Comece pelos mais quentes</b> - clientes atuais, "
        "engajadores, visitantes do site nos ultimos 30 dias.",
        "<b>Suba para semelhantes</b> - LAL 1% de compradores, LAL 1% de "
        "leads qualificados.",
        "<b>Por fim, publico amplo</b> - deixe o algoritmo encontrar "
        "padroes alem do obvio.",
        "<b>Interesses sao tempero, nao prato principal</b> - use para "
        "testar hipoteses, nao como apoio permanente.",
    ]))
    el.append(h2("Construindo Lookalikes de qualidade"))
    el.append(bullets([
        "A semente precisa ter no minimo 1.000 pessoas, idealmente "
        "5.000+.",
        "Quanto mais qualificada a semente, melhor o LAL - compradores "
        "&gt; leads &gt; visitantes.",
        "Use eventos de valor alto (Purchase com valor maior que X) "
        "para semente premium.",
        "Atualize a semente ao menos a cada 30 dias.",
        "LAL 1% e o mais semelhante; 2-5% e mais amplo - menos "
        "qualidade mas mais escala.",
    ]))
    el.append(h2("Exclusoes - tao importantes quanto inclusoes"))
    el.append(bullets([
        "Exclua compradores recentes em campanhas de aquisicao para nao "
        "competir consigo mesmo no remarketing.",
        "Exclua leads ja convertidos em campanhas de lead-gen.",
        "Exclua publico de equipe interna e fornecedores - reduz "
        "'falsas conversoes'.",
        "Documente as exclusoes em planilha - facil esquecer.",
    ]))
    el.append(PageBreak())
    return el


def modulo_14():
    el = []
    el.append(h1("Modulo 14 - Orcamento, lances, CBO e ABO"))
    el.append(h2("Quanto investir para comecar?"))
    el.append(p(
        "Regra pratica robusta: <b>orcamento diario minimo &gt;= 10x o CPA "
        "alvo</b>. Se a meta de CPA e R$ 50, comece com pelo menos R$ 500/dia. "
        "Abaixo disso, o algoritmo nao tem volume para aprender."
    ))
    el.append(formula(
        "<b>Orcamento minimo recomendado:</b><br/>"
        "Diario &gt;= 10 x CPA alvo &nbsp;&nbsp; OU &nbsp;&nbsp; "
        "Diario &gt;= (50 conversoes / 7 dias) x CPA alvo<br/><br/>"
        "<b>Para Meta sair da aprendizagem:</b> 50 conversoes do evento "
        "otimizado em 7 dias."
    ))
    el.append(h2("CBO vs ABO"))
    el.append(tabela_simples([
        ["Estrategia", "O que e", "Quando usar"],
        ["CBO (Advantage)", "Orcamento na campanha, plataforma "
         "distribui entre conjuntos",
         "Conta madura, varios conjuntos similares, escala"],
        ["ABO", "Orcamento por conjunto individual",
         "Testes controlados, conjuntos com publicos muito diferentes, "
         "garantir orcamento por publico"],
    ], larguras=[3.5 * cm, 6.5 * cm, 6.0 * cm]))
    el.append(h2("Estrategias de lance"))
    el.append(bullets([
        "<b>Maior volume / Custo mais baixo</b>: padrao para comecar. A "
        "plataforma busca o maximo de resultados pelo orcamento.",
        "<b>Custo por resultado alvo</b> (Meta) / <b>tCPA</b> (Google): "
        "voce define o CPA desejado. Use apos 30+ conversoes de "
        "historico.",
        "<b>ROAS alvo</b>: voce define o ROAS desejado. Precisa de "
        "valor de conversao bem configurado.",
        "<b>Limite de lance / Cap</b>: avancado. Use so quando "
        "conhece bem o leilao do nicho.",
    ]))
    el.append(h2("Distribuicao por estagio de funil"))
    el.append(p(
        "Heuristica inicial para distribuir verba (ajuste com dados):"
    ))
    el.append(tabela_simples([
        ["Funil", "% da verba (inicial)", "Objetivo principal"],
        ["TOFU - prospeccao", "60-70%", "Crescer base"],
        ["MOFU - meio", "10-20%", "Nutrir interessados"],
        ["BOFU - remarketing", "15-25%", "Converter quente"],
    ], larguras=[4.5 * cm, 4.5 * cm, 7.0 * cm]))
    el.append(aviso(
        "Erro classico: 80% no remarketing porque 'la o ROAS e alto'. "
        "Remarketing depende de prospeccao para abastecer. Se voce nao "
        "alimenta o topo, o remarketing seca em semanas."
    ))
    el.append(PageBreak())
    return el


def modulo_15():
    el = []
    el.append(h1("Modulo 15 - Otimizacao e leitura de dados"))
    el.append(p(
        "A diferenca entre amador e profissional aparece aqui. Amador olha "
        "o painel todo dia e mexe em tudo. Profissional tem janela de "
        "decisao, criterio de pausa e calendario de otimizacao."
    ))
    el.append(h2("Janelas de decisao"))
    el.append(bullets([
        "<b>0-3 dias</b>: observar, nao mexer (fase de aprendizagem).",
        "<b>3-7 dias</b>: pausar anuncios com CTR muito baixo (&lt; 0,5x da "
        "media) e nenhum resultado.",
        "<b>7-14 dias</b>: decisao de manter, otimizar ou pausar "
        "conjuntos.",
        "<b>14-30 dias</b>: decisao estrategica - reestruturar, "
        "trocar oferta, escalar.",
    ]))
    el.append(h2("Volume de dados antes de decidir"))
    el.append(formula(
        "<b>Regra de significancia pratica:</b><br/>"
        "Antes de matar um anuncio, espere por pelo menos:<br/>"
        "- 1000 a 2000 impressoes (para julgar CTR/hook)<br/>"
        "- 3 a 5x o CPA alvo gasto sem conversao (para julgar custo)<br/>"
        "- 100 cliques (para julgar pagina/oferta)"
    ))
    el.append(h2("Diagnostico por sintoma"))
    el.append(tabela_simples([
        ["Sintoma", "Provavel causa", "Acao"],
        ["CPM alto", "Concorrencia, criativo fraco, publico estreito",
         "Trocar criativo, ampliar publico, mudar formato"],
        ["CTR baixo", "Criativo nao para o scroll, oferta fraca no "
         "anuncio",
         "Testar novos hooks, mudar miniatura, novo angulo"],
        ["CTR alto, CPA ruim", "Criativo enganoso, pagina ruim, oferta "
         "fraca",
         "Alinhar criativo com pagina, reforcar prova social, "
         "garantia"],
        ["CPA alto em escala", "Saturacao do publico, criativo cansado",
         "Renovar criativo, expandir publico, ajustar estrategia"],
        ["Conversao zero ha 5+ dias", "Setup quebrado ou publico errado",
         "Verificar pixel, pagina, evento; pausar"],
        ["Frequencia alta (&gt;3 em prospeccao)",
         "Publico saturado",
         "Expandir publico ou trocar criativo"],
    ], larguras=[4.0 * cm, 5.5 * cm, 6.5 * cm]))
    el.append(h2("Otimizacao - o que mexer e em que ordem"))
    el.append(numerada([
        "Criativo (hook, primeiros 3s)",
        "Anuncio - copy, titulo, CTA",
        "Pagina de destino - velocidade, headline, prova, formulario",
        "Oferta - bonus, garantia, parcelamento",
        "Publico - amplitude, exclusoes",
        "Lance e orcamento",
        "Estrutura - consolidar conjuntos com pouca verba",
    ]))
    el.append(dica(
        "Mexa em <b>uma variavel por vez</b>. Se voce troca criativo e "
        "publico ao mesmo tempo, nunca vai saber o que causou o efeito. "
        "Documente cada otimizacao no diario de operacao com data e "
        "hipotese."
    ))
    el.append(PageBreak())
    return el


def modulo_16():
    el = []
    el.append(h1("Modulo 16 - Escala vertical e horizontal"))
    el.append(p(
        "Escalar nao e apenas 'aumentar o orcamento'. E sustentar resultado "
        "enquanto cresce o investimento. Existem duas direcoes."
    ))
    el.append(h2("Escala vertical"))
    el.append(p(
        "Aumentar orcamento em uma campanha/conjunto que ja funciona. "
        "Tecnicas:"
    ))
    el.append(bullets([
        "<b>Incrementos de 20-30% a cada 3-4 dias</b> em CBO. Saltos "
        "grandes resetam aprendizado.",
        "<b>Duplicar e aumentar</b>: duplica o conjunto vencedor com "
        "orcamento 50-100% maior. O original continua, o novo concorre.",
        "<b>Mudar de ABO para CBO</b> quando consolidar 2-3 conjuntos "
        "vencedores.",
        "<b>tCPA / tROAS gradual</b>: aumente o tCPA aos poucos para "
        "abrir leilao sem perder margem.",
    ]))
    el.append(h2("Escala horizontal"))
    el.append(p(
        "Multiplicar formas de entregar - novos publicos, novas plataformas, "
        "novos criativos:"
    ))
    el.append(bullets([
        "Novos LALs (LAL 2%, LAL 3%, LAL de outro evento).",
        "Novos angulos de copy / novas dores / novos beneficios.",
        "Novos formatos (carrossel vira video vira estatico).",
        "Novas plataformas (estende para TikTok / YouTube).",
        "Novas regioes ou idiomas.",
    ]))
    el.append(formula(
        "<b>Quando escalar:</b><br/>"
        "ROAS pelo menos 20% acima do break-even ROAS<br/>"
        "+ CPA estavel por 7-14 dias<br/>"
        "+ Frequencia em prospeccao &lt; 2,5<br/>"
        "+ Capacidade operacional do cliente para atender mais "
        "(estoque, atendimento, entrega)"
    ))
    el.append(aviso(
        "Antes de escalar verba do cliente, confirme se ele consegue "
        "<b>entregar</b> mais demanda. Levar 10x mais leads para um time "
        "de atendimento que ja nao da conta destroi reputacao da operacao "
        "e do cliente."
    ))
    el.append(PageBreak())
    return el


def modulo_17():
    el = []
    el.append(h1("Modulo 17 - Remarketing e retargeting que vendem"))
    el.append(p(
        "Remarketing e onde o ROAS aparece com forca - mas so funciona se "
        "ha base alimentada por prospeccao. Estrutura ideal:"
    ))
    el.append(h2("Listas de remarketing por janela"))
    el.append(tabela_simples([
        ["Lista", "Janela", "Estrategia"],
        ["Visitantes site", "30/60/90/180 dias",
         "Oferta crescente conforme frieza"],
        ["Visualizou produto", "30 dias",
         "Anuncio do produto exato (catalogo)"],
        ["Adicionou ao carrinho", "7-14 dias",
         "Urgencia, frete gratis, lembrete"],
        ["Iniciou checkout", "3-7 dias",
         "Cupom, garantia, depoimento"],
        ["Engajou Instagram/FB", "365 dias",
         "Topo de funil aquecido"],
        ["Assistiu 75% de video", "30 dias",
         "Oferta mais direta"],
        ["Compradores recentes", "30-90 dias",
         "EXCLUIR de prospeccao; usar para cross-sell"],
    ], larguras=[4.5 * cm, 3.0 * cm, 8.5 * cm]))
    el.append(h2("Sequencia de mensagens (storyselling)"))
    el.append(numerada([
        "Dia 1-3: lembrete neutro, mostra produto.",
        "Dia 4-7: prova social - depoimentos, reviews.",
        "Dia 8-14: objecao - responder a duvida comum, garantia.",
        "Dia 15-30: oferta - desconto, bonus, urgencia.",
    ]))
    el.append(dica(
        "Para e-commerce, ative <b>catalogo dinamico</b> com feed - cada "
        "pessoa ve o produto que abandonou, automaticamente. ROAS de "
        "catalogo bem configurado e tipicamente o melhor da conta."
    ))
    el.append(PageBreak())
    return el


def modulo_18():
    el = []
    el.append(h1("Modulo 18 - Relatorios profissionais para o cliente"))
    el.append(p(
        "Cliente nao paga so resultado - paga sensacao de controle. Um "
        "relatorio bem feito comunica progresso, justifica decisoes e "
        "transforma voce em parceiro estrategico, nao em fornecedor "
        "trocavel."
    ))
    el.append(h2("Estrutura padrao do relatorio mensal"))
    el.append(numerada([
        "<b>Resumo executivo</b> - 5 linhas: o que aconteceu, principal "
        "vitoria, principal alerta, proximo passo.",
        "<b>KPIs principais</b> - tabela comparando mes atual vs mes "
        "anterior vs meta.",
        "<b>Investimento por plataforma e por funil</b>.",
        "<b>Criativos vencedores</b> - tres principais com print e "
        "metricas.",
        "<b>Aprendizados</b> - hipoteses testadas, o que funcionou.",
        "<b>Plano para o proximo mes</b> - testes previstos, mudancas, "
        "criativos a produzir.",
        "<b>Pendencias do cliente</b> - o que voce precisa que ele "
        "entregue (criativo, acesso, info).",
    ]))
    el.append(h2("Cadencias de comunicacao"))
    el.append(tabela_simples([
        ["Cadencia", "O que enviar", "Canal"],
        ["Diaria (operacao)",
         "Sem relatorio formal; voce monitora.",
         "Painel privado"],
        ["Semanal",
         "Resumo de 10 linhas + 3 numeros chave",
         "WhatsApp ou e-mail"],
        ["Quinzenal",
         "Call de 15 min: o que rodou, proximos testes",
         "Meet/Zoom"],
        ["Mensal",
         "Relatorio completo + reuniao de 30-45 min",
         "PDF + apresentacao"],
        ["Trimestral",
         "Revisao estrategica, oferta, posicionamento",
         "Reuniao mais longa"],
    ], larguras=[3.0 * cm, 7.0 * cm, 6.0 * cm]))
    el.append(h2("Linguagem - traduzir para o cliente"))
    el.append(bullets([
        "Evite jargao sem traduzir: 'CPM' vira 'custo para ser visto por "
        "1.000 pessoas'.",
        "Sempre conecte numero a impacto de negocio: 'reduzimos o CPA em "
        "18% - isso vale R$ X de economia por mes'.",
        "Use grafico, nao planilha crua. Antes/depois e absoluto vs meta.",
        "Mostre o que <b>nao</b> funcionou e o que voce aprendeu - "
        "transparencia gera confianca.",
    ]))
    el.append(PageBreak())
    return el


def modulo_19():
    el = []
    el.append(h1("Modulo 19 - Precificacao, contrato e relacionamento"))
    el.append(h2("Modelos de cobranca"))
    el.append(tabela_simples([
        ["Modelo", "Como funciona", "Quando usar"],
        ["Fee fixo", "Valor mensal independente da verba",
         "Inicio de carreira, clientes pequenos"],
        ["% sobre verba", "10-20% da verba mensal",
         "Verbas medias/altas, justifica esforco"],
        ["Fee + variavel", "Base + bonus por meta atingida",
         "Cliente maduro, KPIs claros"],
        ["Setup + mensalidade", "Setup separado (R$ 1.500-5.000) + fee",
         "Operacao nova com muito trabalho inicial"],
        ["Performance puro", "% de receita gerada",
         "Apenas com cliente conhecido e atribuicao limpa"],
    ], larguras=[3.5 * cm, 5.5 * cm, 6.5 * cm]))
    el.append(h2("Quanto cobrar - referencias 2026 (Brasil)"))
    el.append(bullets([
        "<b>Iniciante</b>: R$ 800 - 1.500/mes por cliente (verba ate "
        "R$ 3.000).",
        "<b>Pleno</b>: R$ 2.000 - 4.500/mes (verba R$ 3.000 - 15.000).",
        "<b>Senior</b>: R$ 4.500 - 10.000+/mes (verba R$ 15.000+).",
        "Soma criativo/producao a parte - cobre tempo e ferramentas.",
        "Setup inicial (1 unica vez): R$ 1.500 a 5.000 - pixel, GTM, "
        "estrutura, primeiro criativo.",
    ]))
    el.append(h2("Contrato - clausulas obrigatorias"))
    el.append(numerada([
        "Escopo claro: o que esta incluido e o que e extra.",
        "Plataformas atendidas e quantidade de criativos/mes.",
        "Acessos: cliente abre as contas dele; voce e gestor.",
        "Pagamento da midia: cliente paga direto a plataforma "
        "(recomendado).",
        "Multas e prazos de cancelamento (30 dias e padrao saudavel).",
        "Confidencialidade e LGPD.",
        "Propriedade intelectual dos criativos (negocie).",
        "Limite de horas de reuniao mensal (evita cliente abusivo).",
        "Reajuste anual (IPCA, INPC, ou indice combinado).",
        "Foro e legislacao aplicavel.",
    ]))
    el.append(aviso(
        "Nunca pague midia do cliente com sua conta a menos que tenha "
        "garantia/sinal. Plataforma cobra do cartao na hora, cliente "
        "atrasa pagamento, voce quebra. Cartao na conta do cliente, "
        "sempre."
    ))
    el.append(dica(
        "Estabeleca um <b>SLA de resposta</b>: respondo em ate 4h em horario "
        "comercial, criativos sao aprovados em ate 48h, mudancas urgentes "
        "tem tarifa adicional. Cliente bem-educado e cliente que voce "
        "mantem por anos."
    ))
    el.append(PageBreak())
    return el


def modulo_20():
    el = []
    el.append(h1("Modulo 20 - Stack de ferramentas do gestor"))
    el.append(tabela_simples([
        ["Categoria", "Ferramentas", "Para que"],
        ["Plataformas de midia", "Meta Ads Manager, Google Ads, "
         "TikTok Ads Manager",
         "Operacao principal"],
        ["Tagueamento", "Google Tag Manager, Stape (server-side)",
         "Disparo de pixels e eventos"],
        ["Analytics", "GA4, Looker Studio, Hotjar/Clarity",
         "Comportamento e atribuicao"],
        ["Espionagem de criativo", "Meta Ads Library, Google Transparency, "
         "Foreplay, AdSpy",
         "Inteligencia competitiva"],
        ["Producao de criativo", "Canva, CapCut, Figma, Adobe Creative",
         "Imagens e videos"],
        ["Geracao com IA", "ChatGPT, Claude, Midjourney, Runway, ElevenLabs",
         "Copy, imagens, voz, video"],
        ["Landing pages", "WordPress + Elementor, Cartpanda, Hotmart, "
         "Kirvano",
         "Paginas de captura/venda"],
        ["CRM/Atendimento", "RD Station, HubSpot, Kommo, WhatsApp Business",
         "Gestao de leads"],
        ["Relatorios", "Looker Studio, Whatagraph, Reportei, Cumulus",
         "Dashboards automatizados"],
        ["Gerenciamento", "Notion, ClickUp, Trello, Slack",
         "Operacao interna"],
        ["URLs e UTMs", "Campaign URL Builder, Bitly, encurtador interno",
         "Padronizacao de tagueamento"],
    ], larguras=[3.5 * cm, 5.5 * cm, 6.5 * cm]))
    el.append(dica(
        "Nao se afogue em ferramentas. Comece com o minimo viavel: "
        "gerenciador de midia, GTM, GA4, Canva/CapCut, Notion, Looker "
        "Studio. Vai adicionando conforme a operacao cresce."
    ))
    el.append(PageBreak())
    return el


def modulo_21():
    el = []
    el.append(h1("Modulo 21 - Rotina profissional - diaria, semanal e mensal"))
    el.append(h2("Rotina diaria (30-60 min por cliente)"))
    el.append(bullets([
        "Conferir saude da conta: aprovacoes, bloqueios, faturamento.",
        "Olhar KPIs do dia anterior: CPA, ROAS, gasto vs orcamento.",
        "Identificar anuncios fora do padrao - acima ou abaixo do "
        "esperado.",
        "Anotar no diario de operacao decisoes tomadas.",
    ]))
    el.append(h2("Rotina semanal (2-4h por cliente)"))
    el.append(bullets([
        "Analise de criativos - quem ganha, quem cansa, quais hooks "
        "novos.",
        "Limpeza: pausar anuncios sem volume / com performance ruim.",
        "Atualizacao de palavras negativas no Google.",
        "Briefing de novos criativos para producao.",
        "Resumo semanal para o cliente.",
    ]))
    el.append(h2("Rotina mensal (4-8h por cliente)"))
    el.append(bullets([
        "Relatorio mensal completo.",
        "Revisao estrategica - publico, oferta, funil.",
        "Reuniao com o cliente.",
        "Plano de criativo do mes seguinte.",
        "Auditoria de eventos e pixel (chega em ms o tempo passa).",
        "Revisao de custos das ferramentas - cancela o que nao usa.",
    ]))
    el.append(h2("Rotina trimestral"))
    el.append(bullets([
        "Reavaliacao da oferta com o cliente.",
        "Limpeza profunda de campanhas paradas, criativos antigos.",
        "Renegociacao se aplicavel.",
        "Investimento em capacitacao - curso, ferramenta, biblioteca.",
    ]))
    el.append(checklist([
        "Diario de operacao atualizado",
        "KPIs vs metas registrados",
        "Pendencias do cliente cobradas",
        "Backlog de criativos com pelo menos 2 semanas de roteiro",
        "Auditoria de pixel feita no mes",
        "Relatorio mensal entregue ate dia 5",
    ], titulo="CHECKLIST DE GESTAO POR CLIENTE"))
    el.append(PageBreak())
    return el


def modulo_22():
    el = []
    el.append(h1("Modulo 22 - Erros mais comuns e como evitar"))
    el.append(numerada([
        "<b>Lancar sem pixel/CAPI validado</b> - decisao baseada em dado "
        "errado. Sempre teste antes.",
        "<b>Mexer em campanha em aprendizagem</b> - reseta tudo. Tenha "
        "disciplina de 7 dias.",
        "<b>Diluir verba em 20 conjuntos</b> - algoritmo nao aprende. "
        "Consolide.",
        "<b>Achar que oferta ruim e problema de criativo</b> - antes "
        "valide oferta verbalmente.",
        "<b>Olhar so ROAS da plataforma</b> - ROAS in-plataforma quase "
        "sempre infla. Cruze com receita real do cliente.",
        "<b>Nao excluir compradores recentes</b> - voce concorre consigo "
        "mesmo e infla CPA.",
        "<b>Escalar verba sem renovar criativo</b> - publico satura. "
        "Trate criativo como combustivel.",
        "<b>Confiar em interesses estreitos em 2026</b> - publico amplo "
        "com bom pixel performa mais.",
        "<b>Esquecer palavra negativa no Google</b> - voce paga por "
        "trafego ruim semana apos semana.",
        "<b>Sumir do cliente quando vai mal</b> - cliente perdoa "
        "resultado ruim, nao perdoa silencio.",
        "<b>Nao documentar decisoes</b> - 3 meses depois ninguem lembra "
        "por que aquele conjunto existe.",
        "<b>Aceitar promessas inviaveis no comercial</b> - 'em 30 dias "
        "dobramos seu faturamento' destroi reputacao.",
        "<b>Nao testar landing page</b> - se a pagina e ruim, nenhum "
        "anuncio salva.",
        "<b>Ignorar mobile</b> - 80%+ do trafego e mobile. Teste sempre "
        "em celular primeiro.",
        "<b>Nao acompanhar politica das plataformas</b> - banimento e "
        "frequente, leia comunicacoes oficiais.",
    ]))
    el.append(PageBreak())
    return el


def modulo_23():
    el = []
    el.append(h1("Modulo 23 - Estudos de caso e exemplos praticos"))
    el.append(h2("Caso 1 - Loja de roupa feminina (e-commerce)"))
    el.append(p(
        "<b>Cenario inicial</b>: faturamento R$ 35.000/mes, verba R$ 1.500 "
        "em Meta Ads sem estrategia, ROAS 1,8. CPM alto, criativos "
        "estaticos do banco de imagens, sem catalogo conectado."
    ))
    el.append(p(
        "<b>Acoes em 90 dias</b>:"
    ))
    el.append(numerada([
        "Conectou catalogo Shopify ao Meta + Google Merchant.",
        "Setup completo de pixel + CAPI, eventos com valor + moeda.",
        "Estrutura nova: 1 campanha CBO de prospeccao (publico amplo) + "
        "1 campanha de catalogo dinamico (DPA) + 1 campanha de "
        "remarketing por janela.",
        "Producao de 6 criativos UGC/semana via micro-influenciadoras "
        "(R$ 80-150 cada), 30s vertical, foco em prova social.",
        "Landing page do produto otimizada - prova, parcelamento "
        "destacado, frete gratis acima de R$ 199.",
    ]))
    el.append(p(
        "<b>Resultado em 90 dias</b>: verba R$ 7.000/mes, ROAS 4,1, "
        "faturamento R$ 92.000/mes. CPA caiu 47%. Aprendizado-chave: "
        "criativo UGC bateu producao polida em 3:1."
    ))
    el.append(h2("Caso 2 - Clinica odontologica (servico local)"))
    el.append(p(
        "<b>Cenario inicial</b>: 4 clinicas, sem midia paga. Boca-a-boca "
        "saturado. Custo medio de 1 tratamento de implante: R$ 4.200, "
        "ticket maximo R$ 18.000."
    ))
    el.append(p(
        "<b>Acoes</b>:"
    ))
    el.append(numerada([
        "Diagnostico: definiu CAC alvo de R$ 280 por consulta agendada "
        "(taxa de fechamento historica: 32%).",
        "Google Search com palavras locais: 'implante dentario "
        "[bairro]', 'dentista 24h [cidade]'. Negativacao agressiva "
        "(gratis, sus, curso).",
        "Meta Ads com geosegmentacao (5km de cada unidade), criativos "
        "video de pacientes reais (com autorizacao LGPD).",
        "Click-to-WhatsApp como conversao principal; relatorios "
        "diarios via API.",
        "Script de atendimento treinado para nao perder lead em ate "
        "5 minutos.",
    ]))
    el.append(p(
        "<b>Resultado em 6 meses</b>: 312 consultas agendadas, CAC "
        "medio R$ 247, faturamento de novos pacientes superou "
        "R$ 380.000. Aprendizado-chave: velocidade de atendimento "
        "valia mais que volume de leads."
    ))
    el.append(h2("Caso 3 - Infoproduto (curso online)"))
    el.append(p(
        "<b>Cenario inicial</b>: produtor com R$ 50.000/mes em vendas, "
        "ROAS 2,5. Funil de webinar quente, mas criativo de prospeccao "
        "estagnado."
    ))
    el.append(p(
        "<b>Acoes</b>:"
    ))
    el.append(numerada([
        "Auditoria revelou 70% das vendas vindo de 3 criativos antigos. "
        "Renovacao urgente.",
        "10 novos criativos/semana - 3 hooks (dor, curiosidade, prova) "
        "x 3-4 variacoes cada.",
        "Estrutura: prospeccao amplia (LAL 1% compradores) + "
        "engajamento (criativo curiosidade) + retargeting de "
        "view-content webinar.",
        "TikTok Ads como segundo canal - 9:16, voz off de aluno real.",
        "Lookalike de compradores atualizado quinzenal.",
    ]))
    el.append(p(
        "<b>Resultado em 4 meses</b>: faturamento R$ 168.000/mes, ROAS "
        "3,2 (cresceu mesmo com escala). TikTok contribuindo com 22% "
        "das vendas em 60 dias. Aprendizado-chave: cadencia de criativo "
        "novo > otimizacao de campanha velha."
    ))
    el.append(PageBreak())
    return el


def modulo_24():
    el = []
    el.append(h1("Modulo 24 - LGPD, politicas das plataformas e boas praticas"))
    el.append(h2("LGPD (Lei Geral de Protecao de Dados) - o essencial"))
    el.append(bullets([
        "Toda coleta de dado pessoal (e-mail, telefone, comportamento) "
        "precisa de base legal - consentimento, contrato, legitimo "
        "interesse.",
        "Politica de privacidade publicada no site, vinculada no "
        "formulario e no rodape.",
        "Banner de cookies funcional, integrado a Consent Mode v2 do "
        "Google.",
        "Direito ao esquecimento - cliente tem que ter canal para pedir "
        "exclusao.",
        "Dados sensiveis (saude, sexualidade, religiao, biometria) tem "
        "regra mais restritiva - evite usar como criterio publicitario.",
        "Como gestor, voce e operador de dados - cliente e controlador. "
        "Contrato precisa explicitar.",
    ]))
    el.append(h2("Politicas Meta (resumo de armadilhas)"))
    el.append(bullets([
        "Discriminacao - nao filtre publico por raca, idade explicita em "
        "categorias HEC (emprego, credito, moradia).",
        "Saude - nao pode 'afirmar antes/depois' com pessoa real sem "
        "consentimento e disclaimers.",
        "Financeiro - emprestimo, criptomoeda, investimento tem "
        "categoria especial; permissao do BM previa.",
        "Politica - exige autorizacao para 'anuncios politicos e sociais'.",
        "Caracteristicas pessoais - 'voce esta com diabetes?' viola; "
        "'cuidando da diabetes' nao viola.",
    ]))
    el.append(h2("Politicas Google (resumo de armadilhas)"))
    el.append(bullets([
        "Marca registrada nos titulos so se voce e revendedor "
        "autorizado.",
        "Health and beauty tem certificacao especifica.",
        "Cassino, apostas, criptomoeda - requer licenca e/ou "
        "verificacao.",
        "Conteudo sexualmente sugestivo, violencia, drogas - reprovacao "
        "imediata.",
        "Diferenca entre desaprovacao do anuncio e suspensao da conta - "
        "suspensao precisa de apelacao formal.",
    ]))
    el.append(aviso(
        "Conta suspensa e o pior cenario - recuperacao pode levar dias ou "
        "nunca acontecer. Prevencao: leia as politicas antes de cada novo "
        "nicho, evite gambiarras como 'voce', 'sua barriga', 'seu peso'."
    ))
    el.append(PageBreak())
    return el


def modulo_25():
    el = []
    el.append(h1("Modulo 25 - Plano de 90 dias e proximos passos"))
    el.append(p(
        "Voce leu o material. Agora o trabalho comeca. Use este plano para "
        "sair do zero ate operacao paga em 90 dias."
    ))
    el.append(h2("Dias 1-30 - Fundacao"))
    el.append(numerada([
        "Estude o material todo. Releia modulos 3, 8, 14 e 15.",
        "Configure conta no Business Manager pessoal e teste com "
        "R$ 50-100 num projeto seu (loja, blog, link de afiliado).",
        "Instale pixel, eventos, CAPI no projeto teste.",
        "Produza 5 criativos com Canva/CapCut. Rode com R$ 20/dia por 7 "
        "dias.",
        "Acompanhe a Meta Ads Library de 10 marcas que voce admira.",
        "Monte sua planilha mestre de KPIs.",
        "Crie portfolio basico - 1 site simples, casos pessoais ou de "
        "amigos.",
    ]))
    el.append(h2("Dias 31-60 - Primeiros clientes"))
    el.append(numerada([
        "Prospecte 3-5 clientes pequenos - amigos, conhecidos, sua rede. "
        "Cobre barato no comeco (ou de graca em troca de depoimento).",
        "Faca diagnostico completo do Modulo 5 em cada.",
        "Documente tudo. Cada decisao com data, hipotese, resultado.",
        "Entregue relatorios mensais mesmo nos clientes de graca.",
        "Acompanhe os numeros. Tente bater seu proprio CPA semana apos "
        "semana.",
        "Junte 2-3 depoimentos com numero (mesmo modestos).",
    ]))
    el.append(h2("Dias 61-90 - Profissionalizacao"))
    el.append(numerada([
        "Defina seus modelos de cobranca (Modulo 19).",
        "Monte contrato com clausulas obrigatorias.",
        "Aumente preco - cobre 2x do que cobrava no inicio.",
        "Padronize sua rotina (Modulo 21).",
        "Comece a divulgar nos canais que seus clientes-alvo "
        "frequentam.",
        "Reserve 4h/semana para estudo - novas atualizacoes das "
        "plataformas, novos formatos, novos canais.",
        "Estabeleca meta de 3 a 5 clientes ate o dia 120.",
    ]))
    el.append(h2("De junior a senior - o que separa"))
    el.append(bullets([
        "<b>Junior</b>: executa briefing, sabe operar gerenciador.",
        "<b>Pleno</b>: estrutura conta sozinho, le dados, decide "
        "otimizacao, propoe testes.",
        "<b>Senior</b>: define estrategia de aquisicao, faz oferta com o "
        "cliente, lidera time de criativo, conversa com diretoria, "
        "antecipa tendencia de plataforma.",
        "<b>Especialista</b>: e referencia em um nicho ou plataforma "
        "especifica. Publico paga para te ouvir falar.",
    ]))
    el.append(dica(
        "Seja honesto com voce mesmo sobre em que nivel esta. Junior "
        "fingindo ser senior queima cliente, e a conta vira porto-seguro "
        "de fim de carreira em vez de plataforma de crescimento."
    ))
    el.append(h2("Comunidades, fontes e estudo continuo"))
    el.append(bullets([
        "Newsletters: Search Engine Land, Marketing Brew, Stacked "
        "Marketer.",
        "YouTube: canais de gestores brasileiros com casos reais (nao "
        "'gurus de mansao').",
        "Documentacao oficial: Meta Blueprint, Skillshop (Google).",
        "Comunidades pagas com peer review - investimento que se paga "
        "rapido.",
        "Faca certificacoes oficiais (Meta Blueprint, Google Ads) - "
        "credibilidade e estudo guiado.",
    ]))
    el.append(PageBreak())
    return el


def anexo_glossario():
    el = []
    el.append(h1("Anexo A - Glossario de trafego pago"))
    termos = [
        ("ABO", "Ad Set Budget Optimization - orcamento definido no "
         "conjunto de anuncios."),
        ("Algoritmo", "Conjunto de regras automaticas que decide para "
         "quem o anuncio aparece e por qual lance."),
        ("API de Conversoes (CAPI)", "Envio server-to-server de eventos "
         "para Meta, compensando perdas de cookie e iOS."),
        ("Atribuicao", "Como o credito de uma conversao e distribuido "
         "entre os pontos de contato (ultimo clique, ultimo "
         "engajamento, multi-touch, baseada em dados)."),
        ("Branding", "Acoes de marca, geralmente topo de funil, com KPIs "
         "de alcance/lembranca, nao de conversao direta."),
        ("Break-even ROAS", "ROAS minimo que cobre o custo do produto. "
         "Calculado como 1 / margem bruta."),
        ("CAC", "Custo de Aquisicao de Cliente - investimento total "
         "dividido pelo numero de novos clientes."),
        ("CBO", "Campaign Budget Optimization - orcamento na campanha "
         "distribuido pela plataforma entre conjuntos."),
        ("CPA", "Custo Por Acao (lead, venda, instalacao)."),
        ("CPC", "Custo Por Clique."),
        ("CPL", "Custo Por Lead."),
        ("CPM", "Custo Por Mil impressoes."),
        ("CR", "Conversion Rate - taxa de conversao."),
        ("CTR", "Click-Through Rate - cliques divididos por impressoes."),
        ("DPA / Catalogo dinamico", "Anuncio que monta o criativo "
         "automaticamente com produtos do feed do usuario."),
        ("Frequencia", "Quantas vezes cada pessoa unica viu seu anuncio "
         "no periodo."),
        ("Funil", "Modelo de jornada (topo, meio, fundo) que organiza "
         "conteudo e oferta."),
        ("GTM", "Google Tag Manager - ferramenta de tagueamento."),
        ("Hook", "Primeiros 1-3 segundos de um criativo, que decidem se "
         "a pessoa para o scroll."),
        ("Lookalike (LAL)", "Publico semelhante - geracao algoritmica a "
         "partir de uma semente."),
        ("LGPD", "Lei Geral de Protecao de Dados - regula coleta e uso "
         "de dado pessoal no Brasil."),
        ("LTV", "Lifetime Value - quanto um cliente gera de receita ao "
         "longo do relacionamento."),
        ("Otimizacao", "Acao que melhora um indicador - pausar, "
         "duplicar, ajustar criativo, lance, publico."),
        ("PageView", "Evento padrao - alguem viu uma pagina."),
        ("PMax", "Performance Max - campanha multicanal automatizada "
         "do Google."),
        ("Prospeccao", "Aquisicao de publico novo, que nao conhece a "
         "marca."),
        ("QS / Indice de Qualidade", "Nota do Google que afeta "
         "diretamente CPC."),
        ("Remarketing", "Anunciar para quem ja teve contato com a "
         "marca."),
        ("ROAS", "Return on Ad Spend - receita atribuida dividida pelo "
         "investimento em ads."),
        ("ROI", "Return on Investment - lucro liquido dividido pelo "
         "investimento."),
        ("RSA", "Responsive Search Ad - anuncio de pesquisa responsivo "
         "do Google."),
        ("SLA", "Service Level Agreement - acordo de nivel de "
         "servico/resposta."),
        ("Spark Ad", "Anuncio de TikTok que impulsiona uma postagem "
         "organica."),
        ("tCPA", "Target CPA - lance baseado em CPA alvo."),
        ("tROAS", "Target ROAS - lance baseado em ROAS alvo."),
        ("UGC", "User-Generated Content - conteudo produzido por "
         "usuario real, baixa producao."),
        ("UTM", "Parametro de URL que identifica origem, midia e "
         "campanha de trafego."),
    ]
    dados = [[Paragraph(f"<b>{t}</b>", ESTILO_BOX_TEXTO),
              Paragraph(d, ESTILO_BOX_TEXTO)] for t, d in termos]
    t = Table(dados, colWidths=[3.5 * cm, 13.0 * cm],
              style=TableStyle([
                  ("VALIGN", (0, 0), (-1, -1), "TOP"),
                  ("LEFTPADDING", (0, 0), (-1, -1), 4),
                  ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                  ("TOPPADDING", (0, 0), (-1, -1), 4),
                  ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                  ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDA),
              ]))
    el.append(t)
    el.append(PageBreak())
    return el


def anexo_checklists():
    el = []
    el.append(h1("Anexo B - Checklists imprimiveis"))
    el.append(checklist([
        "Briefing completo assinado",
        "Acessos: BM, Google Ads, GA4, GTM, site, CRM",
        "Pixel + CAPI testados em ambiente real",
        "Eventos com valor + moeda configurados",
        "UTMs padrao definidos",
        "Politica de privacidade revisada",
        "Forma de pagamento configurada na plataforma",
        "Aprovador de criativo definido com SLA",
        "Meta numerica + prazo definidos por escrito",
    ], titulo="ONBOARDING DE CLIENTE"))
    el.append(checklist([
        "Objetivo correto da campanha selecionado",
        "Evento de otimizacao alinhado ao objetivo",
        "Publico amplo testado com prioridade",
        "Orcamento atinge minimo de 50 conversoes/sem",
        "3 a 6 criativos por conjunto",
        "Copy com hook, desenvolvimento, prova, CTA",
        "Link de destino testado em mobile",
        "Pagina de destino com prova social atualizada",
        "Politicas revisadas para o nicho",
    ], titulo="PRE-PUBLICACAO DE CAMPANHA"))
    el.append(checklist([
        "Conta com gastos dentro do orcamento mensal",
        "Sem aprovacao pendente ou desaprovado",
        "Frequencia em prospeccao &lt; 2,5",
        "CTR e CPM coerentes com o nicho",
        "CPA vs meta no farol verde, amarelo ou vermelho - documentado",
        "Anuncios sem volume pausados ha 7+ dias",
        "Listas de remarketing populando",
        "Diario de operacao atualizado",
    ], titulo="MANUTENCAO SEMANAL"))
    el.append(checklist([
        "Relatorio mensal pronto ate dia 5",
        "Reuniao com cliente agendada",
        "Backlog de criativo para o mes inteiro",
        "Auditoria de pixel/CAPI",
        "Revisao de termos de pesquisa Google",
        "Limpeza de campanhas paradas",
        "Revisao de oferta e funil",
        "Mensuracao de eventos agregados (Meta) atualizada",
    ], titulo="MANUTENCAO MENSAL"))
    el.append(checklist([
        "Receita total vs investimento total",
        "Margem bruta do cliente vs ROAS atual",
        "Health check de oferta - ainda compete?",
        "Tendencias de plataforma - novos formatos",
        "Renegociacao se mudou o escopo",
        "Revisao de contrato e indices de reajuste",
        "Investimento em capacitacao trimestre",
    ], titulo="REVISAO TRIMESTRAL"))
    return el


# ---------------------------------------------------------------------------
# Geracao
# ---------------------------------------------------------------------------


def gerar(caminho_pdf: Path) -> Path:
    doc = DocumentoTreinamento(str(caminho_pdf))

    historia = []
    historia += construir_capa()
    historia += construir_sumario()
    historia += construir_sobre()
    historia += modulo_1()
    historia += modulo_2()
    historia += modulo_3()
    historia += modulo_4()
    historia += modulo_5()
    historia += modulo_6()
    historia += modulo_7()
    historia += modulo_8()
    historia += modulo_9()
    historia += modulo_10()
    historia += modulo_11()
    historia += modulo_12()
    historia += modulo_13()
    historia += modulo_14()
    historia += modulo_15()
    historia += modulo_16()
    historia += modulo_17()
    historia += modulo_18()
    historia += modulo_19()
    historia += modulo_20()
    historia += modulo_21()
    historia += modulo_22()
    historia += modulo_23()
    historia += modulo_24()
    historia += modulo_25()
    historia += anexo_glossario()
    historia += anexo_checklists()

    doc.build(historia)
    return caminho_pdf


if __name__ == "__main__":
    saida = Path(__file__).resolve().parent / "trafego-pago-do-zero-ao-profissional.pdf"
    gerar(saida)
    print(f"PDF gerado em: {saida}")
