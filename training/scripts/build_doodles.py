"""Trains the doodle recognizer and picks bot doodles for #213, #214 and #227.

Input: the first ~3 MB of Quick Draw "simplified" ndjson files per category (Google, CC BY 4.0),
downloaded to .cache/quickdraw/ (gitignored). Output (committed, small):
  src/games/shared/doodle/model.bin    int8 weights + float32 biases/scales of a 784-256-128-N MLP
  src/games/shared/doodle/model.json   class list, layer shapes, test accuracy
  src/games/shared/doodle/doodles.json up to 8 well-recognised human doodles per class (strokes)
The rasterizer below must match rasterize() in src/games/shared/doodle/doodle.ts exactly.
Run: python3 -I training/scripts/build_doodles.py <repo root>
"""
import json, sys
from pathlib import Path
import numpy as np
from sklearn.neural_network import MLPClassifier

root = Path(sys.argv[1])
src = root / '.cache/quickdraw'
out = root / 'src/games/shared/doodle'
out.mkdir(parents=True, exist_ok=True)
SIZE, PER_CLASS, WIDTH = 28, 2600, 1.1
rng = np.random.default_rng(7)

def normalize(strokes):
    xs = np.concatenate([np.asarray(s[0], float) for s in strokes])
    ys = np.concatenate([np.asarray(s[1], float) for s in strokes])
    x0, y0 = xs.min(), ys.min()
    span = max(xs.max() - x0, ys.max() - y0, 1.0)
    ox = (span - (xs.max() - x0)) / 2
    oy = (span - (ys.max() - y0)) / 2
    return [((np.asarray(s[0], float) - x0 + ox) / span, (np.asarray(s[1], float) - y0 + oy) / span) for s in strokes]

# Pixel centres in [0,1] with a 2-pixel margin.
grid = (np.arange(SIZE) + 0.5)
gx, gy = np.meshgrid(grid, grid)
gx = gx.ravel(); gy = gy.ravel()

def rasterize(strokes):
    pts = normalize(strokes)
    img = np.zeros(SIZE * SIZE)
    scale = SIZE - 4
    for xs, ys in pts:
        X = xs * scale + 2
        Y = ys * scale + 2
        if len(X) == 1:
            X = np.append(X, X[0]); Y = np.append(Y, Y[0])
        for i in range(len(X) - 1):
            ax, ay, bx, by = X[i], Y[i], X[i + 1], Y[i + 1]
            dx, dy = bx - ax, by - ay
            l2 = dx * dx + dy * dy
            t = np.zeros_like(gx) if l2 == 0 else np.clip(((gx - ax) * dx + (gy - ay) * dy) / l2, 0, 1)
            d = np.hypot(gx - (ax + t * dx), gy - (ay + t * dy))
            img = np.maximum(img, np.clip(1 - (d - WIDTH / 2), 0, 1))
    return img

classes, X, Y, raw = [], [], [], []
for f in sorted(src.glob('*.ndjson')):
    name = f.stem.replace('_', ' ')
    items = []
    for line in f.read_text(errors='ignore').splitlines():
        try:
            d = json.loads(line)
        except Exception:
            continue
        if d.get('recognized') and d.get('drawing'):
            items.append(d['drawing'])
        if len(items) >= PER_CLASS:
            break
    if len(items) < 500:
        print('skip', name, len(items)); continue
    ci = len(classes); classes.append(name)
    for dr in items:
        X.append(rasterize(dr)); Y.append(ci); raw.append(dr)
    print(name, len(items), flush=True)

X = np.asarray(X, np.float32); Y = np.asarray(Y)
idx = rng.permutation(len(X)); cut = int(len(X) * 0.85)
tr, te = idx[:cut], idx[cut:]
clf = MLPClassifier(hidden_layer_sizes=(256, 128), activation='relu', alpha=1e-4, batch_size=256,
                    learning_rate_init=1e-3, max_iter=30, early_stopping=True, n_iter_no_change=4, random_state=1, verbose=False)
clf.fit(X[tr], Y[tr])
acc = float((clf.predict(X[te]) == Y[te]).mean())
top3 = float(np.mean([y in np.argsort(-p)[:3] for p, y in zip(clf.predict_proba(X[te]), Y[te])]))
print(f'classes {len(classes)} test top-1 {acc:.3f} top-3 {top3:.3f}')

# Export: per layer int8 weights with a per-output-column scale, float32 bias.
blob = bytearray(); layers = []
for W, b in zip(clf.coefs_, clf.intercepts_):
    scale = np.abs(W).max(axis=0) / 127 + 1e-12
    q = np.clip(np.round(W / scale), -127, 127).astype(np.int8)
    layers.append({'inputs': int(W.shape[0]), 'outputs': int(W.shape[1])})
    blob += q.tobytes(order='C') + scale.astype(np.float32).tobytes() + b.astype(np.float32).tobytes()
(out / 'model.bin').write_bytes(bytes(blob))
(out / 'model.json').write_text(json.dumps({'size': SIZE, 'width': WIDTH, 'classes': classes, 'layers': layers,
                                            'accuracy': round(acc, 4), 'top3': round(top3, 4)}, indent=1))

# Bot doodles: confidently recognised test drawings, 8 per class, coordinates rounded.
proba = clf.predict_proba(X[te])
picked = {c: [] for c in classes}
for k, i in enumerate(te):
    c = classes[Y[i]]
    if len(picked[c]) < 8 and proba[k].argmax() == Y[i] and proba[k].max() > 0.6:
        picked[c].append([[list(map(int, s[0])), list(map(int, s[1]))] for s in raw[i]])
(out / 'doodles.json').write_text(json.dumps(picked, separators=(',', ':')))
print('doodles', sum(len(v) for v in picked.values()), 'model bytes', len(blob))
