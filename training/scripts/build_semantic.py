"""Builds the compact word-vector file used by the semantic word games (#206, #207, #215).

Input: GloVe 6B 300d (Stanford NLP, Public Domain Dedication and License), downloaded to
.cache/glove/ (gitignored). Output (committed, small):
  src/games/shared/semantic/words.txt   one word per line, frequency order
  src/games/shared/semantic/vectors.bin int8 matrix, N x D, row-normalized then scaled by 127
Steps: take the most frequent alphabetic lowercase words, drop plural forms whose singular is also
kept (they redirect to the singular at play time), drop a small blocklist, reduce to D dimensions
with PCA (mean-centred), L2-normalize, quantize to int8.
Run: python3 -I training/scripts/build_semantic.py <repo root>
"""
import sys, re
from pathlib import Path
import numpy as np

root = Path(sys.argv[1])
src = root / '.cache/glove/glove.6B.300d.txt'
out = root / 'src/games/shared/semantic'
out.mkdir(parents=True, exist_ok=True)
TOP, KEEP, D = 60000, 30000, 160
BLOCK = set('''fuck fucking shit bitch cunt nigger nigga faggot fag slut whore dick cock pussy
rape rapist porn porno nazi asshole bastard retard tits boob boobs penis vagina anal'''.split())

words, vecs = [], []
alpha = re.compile(r'^[a-z]{2,}$')
with src.open(encoding='utf8') as f:
    for i, line in enumerate(f):
        if i >= TOP:
            break
        w, *nums = line.rstrip().split(' ')
        if not alpha.match(w) or w in BLOCK:
            continue
        words.append(w)
        vecs.append(np.asarray(nums, dtype=np.float32))
index = set(words)

def singular(w):
    if w.endswith('ies') and len(w) > 4 and w[:-3] + 'y' in index:
        return w[:-3] + 'y'
    if w.endswith('es') and len(w) > 4 and w[:-2] in index and re.search(r'(ch|sh|x|s|z)es$', w):
        return w[:-2]
    if w.endswith('s') and not w.endswith('ss') and len(w) > 3 and w[:-1] in index:
        return w[:-1]
    return None

kept = [(w, v) for w, v in zip(words, vecs) if singular(w) is None][:KEEP]
words = [w for w, _ in kept]
M = np.stack([v for _, v in kept])
M -= M.mean(axis=0)
# PCA via SVD of the covariance.
U, S, Vt = np.linalg.svd(M[:20000], full_matrices=False)
P = M @ Vt[:D].T
explained = (S[:D] ** 2).sum() / (S ** 2).sum()
P /= np.linalg.norm(P, axis=1, keepdims=True)
Q = np.clip(np.round(P * 127), -127, 127).astype(np.int8)
(out / 'vectors.bin').write_bytes(Q.tobytes())
(out / 'words.txt').write_text('\n'.join(words) + '\n')
print(f'{len(words)} words x {D} dims, variance kept {explained:.2%}, {Q.nbytes/1e6:.1f} MB')

def near(w, k=8):
    i = words.index(w)
    sims = (Q.astype(np.int32) @ Q[i].astype(np.int32))
    return [words[j] for j in np.argsort(-sims)[1:k+1]]
for w in ['dog', 'king', 'pizza', 'ocean', 'guitar']:
    print(w, near(w))
