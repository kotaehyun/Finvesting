import { REALTY_MOVE_2025, realtyMetroLabel, realtyMetroForPlace } from "@finvesting/core";

const REASON_COLOR: Record<string, string> = {
  housing: "#0f766e",
  family: "#7c3aed",
  job: "#b45309",
  other: "#64748b",
  edu: "#0369a1",
  env: "#65a30d",
  nature: "#0e7490",
};

function fmtThou(n: number) {
  return n.toFixed(1);
}

export function RealtyMoveDetail({ focusId }: { focusId: string | null }) {
  const move = REALTY_MOVE_2025;
  const metroId = focusId ? realtyMetroForPlace(focusId) : null;
  const metro = metroId ? move.metroAges.find((m) => m.id === metroId) : null;
  const label = metroId ? realtyMetroLabel(metroId) : null;
  const sexMax = Math.max(...move.ages.flatMap((a) => [a.male, a.female]));
  const netMax = Math.max(...move.metroAges.flatMap((m) => m.net.map((n) => Math.abs(n))));

  return (
    <aside className="move-detail" aria-label="2025년 연령·성별 인구이동">
      <div>
        <h3>전국 이동 · 연령·성별</h3>
        <p className="move-detail-note">
          남 {move.sex.maleRate}% · 여 {move.sex.femaleRate}%. 막대는 이동자 천 명. 출발지가 아닙니다.
        </p>
        <div className="move-ages">
          {move.ages.map((a) => (
            <div key={a.id} className="move-age" title={`${a.label} 남 ${a.male} · 여 ${a.female}천 명, 이동률 ${a.rate}%`}>
              <div className="move-sex">
                <i className="m" style={{ height: `${Math.max(2, (a.male / sexMax) * 58)}px` }} />
                <i className="f" style={{ height: `${Math.max(2, (a.female / sexMax) * 58)}px` }} />
              </div>
              <small>{a.label.replace("세", "")}</small>
            </div>
          ))}
        </div>
        <p className="move-key"><i className="m" /> 남 <i className="f" /> 여</p>
      </div>
      <div>
        <h3>{label ? `${label} 연령별 순이동` : "시도 연령별 순이동"}</h3>
        {metro && label ? (
          <>
            <p className="move-detail-note">천 명. 위 빨강은 순유입, 아래 파랑은 순유출. 이 칸에는 성별이 없습니다.</p>
            <div className="move-nets">
              {metro.net.map((n, i) => {
                const h = n === 0 ? 0 : Math.max(3, (Math.abs(n) / netMax) * 28);
                return (
                  <div key={move.ageNetBands[i]} className="move-net" title={`${label} ${move.ageNetBands[i]} ${fmtThou(n)}천 명`}>
                    <span className="up">
                      {n > 0 ? <i className="in" style={{ height: h }} /> : null}
                    </span>
                    <span className="dn">
                      {n < 0 ? <i className="out" style={{ height: h }} /> : null}
                    </span>
                    <small>{move.ageNetBands[i]?.replace("세", "").replace(" 이상", "+")}</small>
                  </div>
                );
              })}
            </div>
            {metroId === "sejong" ? (
              <p className="move-detail-note">세종 순이동 합계는 {move.sejongNet}명입니다. 연령 칸은 천 명 반올림입니다.</p>
            ) : null}
          </>
        ) : (
          <p className="move-detail-note">지역을 고르면 그 시도의 연령별 순이동이 나옵니다. 성별은 전국만 있습니다.</p>
        )}
      </div>
      <div className="move-reasons">
        <div className="move-reason-bar" aria-hidden>
          {move.reasons.map((r) => (
            <i key={r.id} style={{ width: `${r.sharePct}%`, background: REASON_COLOR[r.id] }} />
          ))}
        </div>
        <p>
          {move.reasons.map((r) => `${r.label} ${r.sharePct.toFixed(1)}%`).join(" · ")}
        </p>
      </div>
    </aside>
  );
}
