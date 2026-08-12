import { Router } from "express";

import { authRequestRepository } from "../../auth/repositories/auth-request.repository.js";
import { env } from "../../config/env.js";

const router = Router();

router.get("/:token", async (req, res) => {
  const token = req.params.token;

  const authRequest = await authRequestRepository.findByToken(token);

  if (!authRequest) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit e-amusement 인증</title>
      </head>
      <body>
        <h1>인증 요청을 찾을 수 없습니다.</h1>
        <p>존재하지 않거나 만료된 인증 링크입니다.</p>
      </body>
      </html>
    `);

    return;
  }

  if (authRequest.expiresAt <= new Date()) {
    res.status(410).send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Croit e-amusement 인증</title>
      </head>
      <body>
        <h1>인증 링크가 만료되었습니다.</h1>
        <p>Discord에서 다시 /auth 명령어를 실행해주세요.</p>
      </body>
      </html>
    `);

    return;
  }

  const extensionId = env.CROIT_EXTENSION_ID;

  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>Croit e-amusement 인증</title>

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f5f5f5;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          color: #222;
        }

        .container {
          width: min(420px, calc(100% - 32px));
          padding: 32px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        }

        h1 {
          margin: 0 0 12px;
          font-size: 24px;
        }

        .description {
          margin-bottom: 24px;
          color: #666;
          line-height: 1.6;
        }

        .step {
          margin-bottom: 20px;
          line-height: 1.6;
        }

        button,
        .link-button {
          width: 100%;
          padding: 12px 16px;
          border: 0;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
        }

        .primary {
          background: #5865f2;
          color: white;
        }

        .secondary {
          margin-top: 10px;
          background: #222;
          color: white;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .status {
          margin-top: 20px;
          padding: 14px;
          border-radius: 8px;
          background: #f1f1f1;
          color: #555;
          line-height: 1.5;
        }

        .success {
          background: #e8f7ed;
          color: #187a3d;
        }

        .error {
          background: #fdecec;
          color: #b42318;
        }
      </style>
    </head>

    <body>
      <main class="container">
        <h1>Croit e-amusement 인증</h1>

        <p class="description">
          Croit에서 노스텔지어 정보를 조회하기 위해
          e-amusement 계정을 인증합니다.
        </p>

        <div class="step">
          <strong>① e-amusement에 로그인해주세요.</strong>
        </div>

        <a
          class="link-button primary"
          href="https://p.eagate.573.jp/gate/p/home/"
          target="_blank"
          rel="noopener noreferrer"
        >
          e-amusement 열기
        </a>

        <div class="step" style="margin-top: 24px;">
          로그인 후 아래 버튼을 눌러주세요.
        </div>

        <button
          id="check-button"
          class="secondary"
          type="button"
        >
          로그인 상태 확인
        </button>

        <div id="status" class="status">
          상태: e-amusement 로그인 상태를 확인할 준비가 되었습니다.
        </div>
      </main>

      <script>
        const TOKEN = ${JSON.stringify(token)};
        const EXTENSION_ID = ${JSON.stringify(extensionId)};

        const checkButton = document.getElementById("check-button");
        const statusElement = document.getElementById("status");

        function setStatus(message, type = "") {
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

              // DB에는 문자열로 저장
              snsid: String(snsid),
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.message ?? "인증 처리에 실패했습니다.",
            );
          }

          return data;
        }

        checkButton.addEventListener("click", () => {
          console.log("[Croit] 로그인 상태 확인 버튼을 눌렀습니다.");
          console.log("[Croit] Extension ID:", EXTENSION_ID);

          if (!EXTENSION_ID) {
            setStatus(
              "Croit 인증 Extension ID가 설정되지 않았습니다.",
              "error",
            );

            return;
          }

          if (!window.chrome || !chrome.runtime) {
            setStatus(
              "Chrome Extension API를 사용할 수 없습니다.",
              "error",
            );

            console.error(
              "[Croit] chrome.runtime을 사용할 수 없습니다.",
            );

            return;
          }

          checkButton.disabled = true;

          setStatus(
            "e-amusement 로그인 상태를 확인하는 중입니다...",
          );

          console.log(
            "[Croit] Extension에 인증 상태 확인 요청을 보냅니다.",
          );

          chrome.runtime.sendMessage(
            EXTENSION_ID,
            {
              type: "CHECK_EAMUSEMENT_AUTH",
            },
            (result) => {
              console.log("[Croit] Extension 응답:", result);

              if (chrome.runtime.lastError) {
                console.error(
                  "[Croit] Extension 통신 오류:",
                  chrome.runtime.lastError.message,
                );

                setStatus(
                  "Croit 인증 Extension과 연결할 수 없습니다. Extension이 설치되어 있고 활성화되어 있는지 확인해주세요.",
                  "error",
                );

                checkButton.disabled = false;
                return;
              }

              if (!result) {
                setStatus(
                  "Extension으로부터 응답을 받지 못했습니다.",
                  "error",
                );

                checkButton.disabled = false;
                return;
              }

              if (!result.authenticated || !result.snsid) {
                setStatus(
                  result.message ??
                    "e-amusement에 로그인되어 있지 않습니다.",
                  "error",
                );

                checkButton.disabled = false;
                return;
              }

              console.log(
                "[Croit] e-amusement 인증 성공:",
                result.snsid,
              );

              void completeAuthentication(result.snsid)
                .then(() => {
                  console.log("[Croit] 서버 인증 완료");

                  setStatus(
                    "e-amusement 인증이 완료되었습니다. 이 창을 닫으셔도 됩니다.",
                    "success",
                  );

                  checkButton.textContent = "인증 완료";
                })
                .catch((error) => {
                  console.error(
                    "[Croit] 서버 인증 처리 오류:",
                    error,
                  );

                  setStatus(
                    "인증 정보를 Croit에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
                    "error",
                  );

                  checkButton.disabled = false;
                });
            },
          );
        });
      </script>
    </body>
    </html>
  `);
});

export { router as authPageRouter };