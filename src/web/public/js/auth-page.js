const urlParams = new URLSearchParams(window.location.search);
const queryExtId = urlParams.get("ext_id");

if (queryExtId) {
  EXTENSION_ID = queryExtId;
}

function setStatus(message, type = "") {
  const statusElement = document.getElementById("status");
  if (!statusElement) return;

  statusElement.textContent = "상태: " + message;
  statusElement.className = "status " + type;
}

async function completeAuthentication(snsid) {
  const response = await fetch("/api/auth/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: TOKEN,
      snsid: String(snsid),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "인증 처리에 실패했습니다.");
  }

  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const checkButton = document.getElementById("check-button");

  if (!checkButton) return;

  checkButton.addEventListener("click", () => {
    console.log("[Croit] 로그인 상태 확인 버튼을 눌렀습니다.");
    console.log("[Croit] 사용할 Extension ID:", EXTENSION_ID);

    if (!EXTENSION_ID) {
      setStatus("Croit 인증 Extension ID가 올바르게 설정되지 않았습니다.", "error");
      return;
    }

    if (!window.chrome || !chrome.runtime) {
      setStatus("Chrome Extension API를 사용할 수 없습니다.", "error");
      console.error("[Croit] chrome.runtime을 사용할 수 없습니다.");
      return;
    }

    checkButton.disabled = true;
    setStatus("e-amusement 로그인 상태를 확인하는 중입니다...");

    console.log("[Croit] Extension에 인증 상태 확인 요청을 보냅니다.");

    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: "CHECK_EAMUSEMENT_AUTH",
        },
        (result) => {
          if (chrome.runtime.lastError) {
            const errDetail = chrome.runtime.lastError.message;
            console.error("[Croit] Extension 통신 상세 오류:", errDetail);

            setStatus(
              `Croit 인증 Extension 통신 실패 (${errDetail}). Extension ID 및 새로고침 상태를 확인해주세요.`,
              "error",
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

          if (!result.authenticated || !result.snsid) {
            setStatus(result.message ?? "e-amusement에 로그인되어 있지 않습니다.", "error");
            checkButton.disabled = false;
            return;
          }

          console.log("[Croit] e-amusement 인증 성공:", result.snsid);
          setStatus("Croit 서버에 인증 정보를 등록하는 중입니다...");

          void completeAuthentication(result.snsid)
            .then(() => {
              console.log("[Croit] 서버 인증 완료");

              setStatus("e-amusement 인증이 완료되었습니다. 이 창을 닫으셔도 됩니다.", "success");
              checkButton.textContent = "인증 완료";
            })
            .catch((error) => {
              console.error("[Croit] 서버 인증 처리 오류:", error);

              setStatus(
                "인증 정보를 Croit에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
                "error",
              );

              checkButton.disabled = false;
            });
        },
      );
    } catch (e) {
      console.error("[Croit] sendMessage 예외 발생:", e);
      setStatus("Extension 호출 중 예외가 발생했습니다.", "error");
      checkButton.disabled = false;
    }
  });
});