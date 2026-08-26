function setStatus(message, type = "") {
  const statusElement = document.getElementById("status");
  if (!statusElement) return;

  statusElement.textContent = "상태: " + message;
  statusElement.className = "status " + type;
}

async function postGrade(token, gradeSum) {
  const response = await fetch("/api/grade/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, gradeSum }),
  });

  return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  setStatus("확장으로부터 곡 그레이드를 요청합니다...");

  if (!window.chrome || !chrome.runtime) {
    setStatus("Extension API를 사용할 수 없습니다.", "error");
    return;
  }

  chrome.runtime.sendMessage(
    EXTENSION_ID,
    { type: "GET_NOSTALGIA_SONG_GRADES" },
    async (result) => {
      console.log("Extension responded:", result);

      if (chrome.runtime.lastError) {
        setStatus("확장과 통신할 수 없습니다.", "error");
        return;
      }

      if (!result || !result.success) {
        setStatus(result?.message ?? "곡 그레이드 수집에 실패했습니다.", "error");
        return;
      }

      setStatus("서버에 그레이드를 전송하는 중입니다...");

      try {
        const res = await postGrade(TOKEN, result.gradeSum);
        if (res?.success) {
          setStatus("업데이트가 완료되었습니다.", "success");
        } else {
          setStatus(res?.message ?? "업데이트 실패", "error");
        }
      } catch (e) {
        setStatus("서버 전송 중 오류가 발생했습니다.", "error");
      }
    },
  );
});
