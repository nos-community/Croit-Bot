function setStatus(message, type = "") {
  const statusElement = document.getElementById("status");
  if (!statusElement) return;

  statusElement.textContent = "상태: " + message;
  statusElement.className = "status " + type;
}

async function completeGradeUpdate(musicData) {
  const response = await fetch("/api/grade/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: TOKEN,
      musicData: musicData,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "그레이드 갱신 처리에 실패했습니다.");
  }

  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const checkButton = document.getElementById("check-button");

  if (!checkButton) return;

  checkButton.addEventListener("click", () => {
    console.log("[Croit] 그레이드 갱신 버튼을 눌렀습니다.");
    console.log("[Croit] Extension ID:", EXTENSION_ID);

    if (!EXTENSION_ID) {
      setStatus("Croit 인증 Extension ID가 설정되지 않았습니다.", "error");
      return;
    }

    if (!window.chrome || !chrome.runtime) {
      setStatus("Chrome Extension API를 사용할 수 없습니다.", "error");
      console.error("[Croit] chrome.runtime을 사용할 수 없습니다.");
      return;
    }

    checkButton.disabled = true;
    setStatus("e-amusement 곡 데이터를 불러오는 중입니다...");

    console.log("[Croit] Extension에 그레이드 조회 요청을 보냅니다.");

    console.log("[Croit] Extension에 그레이드 조회 요청을 보냅니다.");

    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: "GET_NOSTALGIA_SONG_GRADES",
        },
        (result) => {
          if (chrome.runtime.lastError) {
            const errDetail = chrome.runtime.lastError.message;
            console.error("[Croit] Extension 통신 상세 오류:", errDetail);

            setStatus(
              `Extension 통신 실패 (${errDetail}). Extension ID 및 새로고침 상태를 확인해주세요.`,
              "error"
            );

            checkButton.disabled = false;
            return;
          }

          console.log("[Croit] Extension 응답 수신:", result);

          if (!result) {
            setStatus("Extension으로부터 응답을 받지 못했습니다.", "error");
            checkButton.disabled = false;
            return;
          }

          if (!result.success || !Array.isArray(result.musicData)) {
            setStatus(
              result.message ?? "e-amusement에 로그인되어 있지 않거나 데이터를 가져오지 못했습니다.",
              "error"
            );
            checkButton.disabled = false;
            return;
          }

          console.log(`[Croit] 곡 데이터 ${result.musicData.length}개 수신, 서버로 전송합니다.`);
          setStatus("그레이드를 계산하는 중입니다...");

          void completeGradeUpdate(result.musicData)
            .then((data) => {
              console.log("[Croit] 서버 갱신 완료:", data.nickname, data.gradeBasic);

              setStatus(`닉네임이 "${data.nickname}"(으)로 갱신되었습니다. 이 창을 닫으셔도 됩니다.`, "success");
              checkButton.textContent = "갱신 완료";
            })
            .catch((error) => {
              console.error("[Croit] 서버 갱신 처리 오류:", error);

              setStatus(
                "그레이드 정보를 Croit에 반영하지 못했습니다. 잠시 후 다시 시도해주세요.",
                "error"
              );

              checkButton.disabled = false;
            });
        }
      );
    } catch (e) {
      console.error("[Croit] sendMessage 예외 발생:", e);
      setStatus("Extension 호출 중 예외가 발생했습니다.", "error");
      checkButton.disabled = false;
    }
  });
});