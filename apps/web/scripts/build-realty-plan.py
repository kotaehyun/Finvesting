# 통계청 2018 시군구 TopoJSON → 전국 GeoJSON (도면용, 단순화)
# 원본: southkorea-maps kostat/2018/json/skorea-municipalities-2018-topo-simple.json
import json
from pathlib import Path
from urllib.request import Request, urlopen

SRC = "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json"
OUT = Path(__file__).resolve().parents[1] / "src/app/realty/korea-plan.json"


def decode_arc(arc, scale, translate):
    x = y = 0
    sx, sy = scale
    tx, ty = translate
    out = []
    for dx, dy in arc:
        x += dx
        y += dy
        out.append([round(x * sx + tx, 4), round(y * sy + ty, 4)])
    return out


def ring(arc_idxs, decoded):
    coords = []
    for i in arc_idxs:
        part = list(reversed(decoded[~i])) if i < 0 else decoded[i]
        if coords and part:
            part = part[1:]
        coords.extend(part)
    slim = []
    for c in coords:
        if not slim or slim[-1] != c:
            slim.append(c)
    if len(slim) >= 3 and slim[0] != slim[-1]:
        slim.append(slim[0])
    return slim


def main():
    req = Request(SRC, headers={"User-Agent": "Finvesting/0.0.1 (realty plan)"})
    with urlopen(req) as r:
        topo = json.loads(r.read().decode("utf-8"))
    tr = topo["transform"]
    decoded = [decode_arc(a, tr["scale"], tr["translate"]) for a in topo["arcs"]]
    geoms = next(iter(topo["objects"].values()))["geometries"]
    feats = []
    for g in geoms:
        code = g["properties"]["code"]
        t = g["type"]
        if t == "Polygon":
            gj = {"type": "Polygon", "coordinates": [ring(x, decoded) for x in g["arcs"]]}
        elif t == "MultiPolygon":
            gj = {"type": "MultiPolygon", "coordinates": [[ring(x, decoded) for x in poly] for poly in g["arcs"]]}
        else:
            continue
        feats.append({
            "type": "Feature",
            "properties": {"code": code, "name": g["properties"]["name"]},
            "geometry": gj,
        })
    out = {
        "type": "FeatureCollection",
        "source": "KOSTAT 2018 census admin (southkorea-maps topo-simple). nationwide municipalities. 동탄구 신설 경계 없음.",
        "features": feats,
    }
    prefixes = sorted({f["properties"]["code"][:2] for f in feats})
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(feats)} features prefixes={prefixes} -> {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
