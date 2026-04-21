import step1Character from "../../assets/3.png";

export function OnboardingMascot() {
  return (
    <img
      src={step1Character}
      alt="동행 여행을 상징하는 캐릭터 일러스트"
      style={{
        width: "100%",
        maxWidth: 220,
        height: "auto",
        maxHeight: 300,
        objectFit: "contain",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
