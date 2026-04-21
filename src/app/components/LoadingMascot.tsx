import analysisCharacter from "../../assets/2.png";

export function LoadingMascot() {
  return (
    <img
      src={analysisCharacter}
      alt="코스 분석을 안내하는 캐릭터 일러스트"
      style={{
        width: "100%",
        maxWidth: 200,
        height: "auto",
        maxHeight: 260,
        objectFit: "contain",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
