"""Gera os assets de marca (icone e splash) do app ViajeBrasil sem dependencias.

Desenha o brasao da marca: anel em degrade (verde -> amarelo -> azul),
circulo branco interno, sol e a "estrada" sinuosa, evocando o mapa do Brasil.
"""

import math
import struct
import zlib

# Cores da marca (RGB)
VERDE = (0x1F, 0xA8, 0x4C)
AMARELO = (0xFF, 0xC2, 0x0E)
AZUL = (0x1E, 0x73, 0xBE)
AZUL_CEU = (0x2B, 0xA8, 0xE0)
LARANJA = (0xF3, 0x92, 0x00)
SOL_INT = (0xFF, 0xE9, 0xA8)
BRANCO = (0xFF, 0xFF, 0xFF)


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(max(0, min(255, int(round(a[i] + (b[i] - a[i]) * t)))) for i in range(3))


def cor_anel(ang):
    """Degrade ciclico verde -> amarelo -> azul -> verde pelo angulo (0..1)."""
    paradas = [VERDE, AMARELO, AZUL, VERDE]
    seg = ang * (len(paradas) - 1)
    i = min(int(seg), len(paradas) - 2)
    return lerp(paradas[i], paradas[i + 1], seg - i)


def dist_segmento(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    comp = dx * dx + dy * dy
    t = 0 if comp == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / comp))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def gerar(tamanho):
    s = tamanho
    cx = cy = s / 2
    r_ext = 0.47 * s
    larg_anel = 0.07 * s
    r_int = r_ext - larg_anel
    sol_x, sol_y, sol_r = cx + 0.14 * s, cy - 0.13 * s, 0.085 * s

    # pontos da "estrada" (curva suave esquerda -> direita)
    estrada = [
        (cx - 0.30 * s, cy + 0.16 * s),
        (cx - 0.05 * s, cy + 0.04 * s),
        (cx + 0.18 * s, cy - 0.06 * s),
        (cx + 0.33 * s, cy - 0.10 * s),
    ]

    linhas = []
    for y in range(s):
        linha = bytearray([0])  # filtro 0
        for x in range(s):
            d = math.hypot(x - cx, y - cy)
            cor = BRANCO

            if d <= r_ext:
                if d >= r_int:
                    ang = (math.atan2(y - cy, x - cx) + math.pi) / (2 * math.pi)
                    cor = cor_anel(ang)
                else:
                    # interior branco; desenha mar, estrada, mata e sol
                    if (y - cy) > 0.04 * s and (x - cx) > -0.05 * s:
                        cor = AZUL_CEU

                    dmin = min(
                        dist_segmento(x, y, *estrada[i], *estrada[i + 1])
                        for i in range(len(estrada) - 1)
                    )
                    if dmin < 0.05 * s:
                        cor = lerp(AMARELO, LARANJA, (x - cx + 0.3 * s) / (0.6 * s))
                    elif dmin < 0.095 * s and (y - cy) < 0.06 * s:
                        cor = VERDE

                    ds = math.hypot(x - sol_x, y - sol_y)
                    if ds < sol_r:
                        cor = SOL_INT if ds < sol_r * 0.6 else AMARELO

            linha += bytes(cor)
        linhas.append(bytes(linha))

    bruto = b"".join(linhas)
    return s, zlib.compress(bruto, 9)


def escrever_png(caminho, tamanho):
    s, comprimido = gerar(tamanho)

    def chunk(tipo, dados):
        c = tipo + dados
        return struct.pack(">I", len(dados)) + c + struct.pack(">I", zlib.crc32(c))

    cabecalho = struct.pack(">IIBBBBB", s, s, 8, 2, 0, 0, 0)  # 8 bits, RGB
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", cabecalho)
        + chunk(b"IDAT", comprimido)
        + chunk(b"IEND", b"")
    )
    with open(caminho, "wb") as f:
        f.write(png)
    print(f"gerado {caminho} ({s}x{s})")


if __name__ == "__main__":
    import os

    base = os.path.join(os.path.dirname(__file__), "..", "assets")
    escrever_png(os.path.join(base, "icone.png"), 1024)
    escrever_png(os.path.join(base, "splash.png"), 1024)
