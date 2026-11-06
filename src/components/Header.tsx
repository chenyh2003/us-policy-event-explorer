export default function Header({
  total,
  selected,
  inRange,
  pre1927,
  postData,
}: {
  total: number;
  selected: number;
  inRange: number;
  pre1927: number;
  postData: number;
}) {
  return (
    <header className="page-header">
      <div className="title-block">
        <div className="eyebrow">POLICY &amp; MARKET LAB</div>
        <h1>美国政策事件与标普500</h1>
        <p className="subtitle">
          1912—2026 政策事件 · 标普500日线 1927—2026 · 共 {total} 条，已开启{" "}
          <strong>{selected}</strong> 条
        </p>
      </div>
      <div className="header-stats">
        <div>
          <b>{inRange}</b>
          <span>可落在曲线</span>
        </div>
        <div>
          <b>{pre1927}</b>
          <span>1927 年前</span>
        </div>
        <div>
          <b>{postData}</b>
          <span>超出行情</span>
        </div>
        <div>
          <b>{total}</b>
          <span>全部事件</span>
        </div>
      </div>
    </header>
  );
}
