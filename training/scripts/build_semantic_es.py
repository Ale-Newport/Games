"""Builds the Spanish word-vector files for the semantic word games (#206, #207, #215).

Input: fastText Common Crawl Spanish vectors `cc.es.300.vec` (Grave et al. 2018, Facebook AI,
CC BY-SA 3.0). Only the most frequent words are needed; stream them into the gitignored cache:

    mkdir -p .cache/fasttext && curl -sSL \\
      https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.es.300.vec.gz \\
      | gunzip | head -n 150001 > .cache/fasttext/cc.es.300.top150k.vec

Output (committed; CC BY-SA 3.0 like their source):
  src/games/shared/semantic/words-es.txt   one word per line, frequency order, with accents
  src/games/shared/semantic/vectors-es.bin int8 matrix, N x D, row-normalized then scaled by 127

Steps: keep lowercase Spanish-alphabet words; drop English words that leak into the web crawl
(projection on an English-vs-Spanish direction built from function words); drop a blocklist, web debris, brand names and vowel-less abbreviations;
keep only the most frequent spelling of words that are equal without accents (players may type
without accents); drop plural forms whose singular is also kept (they redirect to the singular
at play time); reduce to D dimensions with PCA (mean-centred); L2-normalize; quantize to int8.
Run: python3 -I training/scripts/build_semantic_es.py <repo root>
"""
import re
import sys
import unicodedata
from pathlib import Path

import numpy as np

root = Path(sys.argv[1])
src = root / '.cache/fasttext/cc.es.300.top150k.vec'
out = root / 'src/games/shared/semantic'
KEEP, D = 30000, 160

BLOCK = set('''puta puto putas putos mierda coño cojones joder follar polla pene vagina culo
maricón maricon marica zorra perra cabrón cabron gilipollas pendejo pendeja verga chingar
chingada hijueputa malparido mamada porno porn nazi violación violador negrata sudaca
retrasado mongólico tetas teta'''.split())
# Web-crawl debris and brand names: markup, abbreviations, misspellings, companies.
JUNK = set('''http https www html href nbsp quot amp width height align center title img jpeg
jpg png gif pdf mathbf newdomain default root com net org etc aprox frac pág págs núm sic seg
hab est oct sep feb nov dic ene abr jun jul ago sept porq xq pq tb tmb aki kiero ke ki msnm
facebook twitter instagram youtube google wikipedia wiki windows whatsapp linux android iphone
microsoft apple amazon netflix imdb tweet tweets blogspot'''.split())

EN_FUNCTION = '''the and of to in is you that it for with on are this be was have not at by
from or your they we can will an but all my has more their which one would about what when
there were been if out up so no our do them its than who just like how also any'''.split()
ES_FUNCTION = '''de la que el en los del se las por un para con una su al lo como más pero sus
le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde
todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué
unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar'''.split()


def fold(w):
    """Drops acute accents and diaeresis but keeps ñ, a separate letter in Spanish."""
    w = w.replace('ñ', '\0')
    w = ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')
    return w.replace('\0', 'ñ')


alpha = re.compile(r'^[a-záéíóúüñ]{2,}$')
words, vecs = [], []
with src.open(encoding='utf8') as f:
    next(f)  # header: count and dimensions
    for line in f:
        w, *nums = line.rstrip().split(' ')
        if len(nums) != 300 or not alpha.match(w) or w in BLOCK or w in JUNK:
            continue
        if not re.search('[aeiouáéíóúü]', w):  # abbreviations such as pdf, km, rpm
            continue
        words.append(w)
        vecs.append(np.asarray(nums, dtype=np.float32))
M = np.stack(vecs)
M /= np.linalg.norm(M, axis=1, keepdims=True)
pos = {w: i for i, w in enumerate(words)}

# English leak filter: words closer to English function words than to Spanish ones.
en = M[[pos[w] for w in EN_FUNCTION if w in pos]].mean(axis=0)
es = M[[pos[w] for w in ES_FUNCTION if w in pos]].mean(axis=0)
direction = en - es
direction /= np.linalg.norm(direction)
score = M @ direction
english = score > 0.12
print('english-filtered sample:', [w for w, e in zip(words, english) if e][:40])
print('kept sample with highest english score:',
      [words[i] for i in np.argsort(-score) if not english[i]][:25])

seen_folded, ordered = set(), []
for i, w in enumerate(words):
    if english[i]:
        continue
    k = fold(w)
    if k in seen_folded:
        continue
    seen_folded.add(k)
    ordered.append(i)
folded_index = {fold(words[i]) for i in ordered}


def singular(w):
    k = fold(w)
    if k.endswith('ces') and len(k) > 4 and k[:-3] + 'z' in folded_index:
        return k[:-3] + 'z'
    if k.endswith('es') and len(k) > 4 and k[:-2] in folded_index:
        return k[:-2]
    if k.endswith('s') and len(k) > 3 and k[:-1] in folded_index:
        return k[:-1]
    return None


kept = [i for i in ordered if singular(words[i]) is None][:KEEP]
vocab = [words[i] for i in kept]
X = M[kept].copy()
X -= X.mean(axis=0)
U, S, Vt = np.linalg.svd(X[:20000], full_matrices=False)
P = X @ Vt[:D].T
explained = (S[:D] ** 2).sum() / (S ** 2).sum()
P /= np.linalg.norm(P, axis=1, keepdims=True)
Q = np.clip(np.round(P * 127), -127, 127).astype(np.int8)
(out / 'vectors-es.bin').write_bytes(Q.tobytes())
(out / 'words-es.txt').write_text('\n'.join(vocab) + '\n', encoding='utf8')
print(f'{len(vocab)} words x {D} dims, variance kept {explained:.2%}, {Q.nbytes / 1e6:.1f} MB')

index = {w: i for i, w in enumerate(vocab)}


def near(w, k=8):
    i = index[w]
    sims = Q.astype(np.int32) @ Q[i].astype(np.int32)
    return [vocab[j] for j in np.argsort(-sims)[1:k + 1]]


for w in ['perro', 'rey', 'pizza', 'océano', 'guitarra', 'árbol', 'canción']:
    print(w, near(w) if w in index else 'MISSING')
