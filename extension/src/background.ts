const EAMUSEMENT_URL = "https://p.eagate.573.jp/";
const EAMUSEMENT_INFO_URL = "https://p.eagate.573.jp/gate/p/tare/getinfo.html";

interface EamusementUserInfo {
  status?: number;
  snsid?: string;
  [key: string]: unknown;
}

interface AuthCheckResult {
  authenticated: boolean;
  snsid?: string;
  message: string;
}

async function checkEamusementAuth(): Promise<AuthCheckResult> {
  try {
    console.log("[Croit Extension] e-amusement 인증 상태 확인을 시작합니다.");

    const cookie = await chrome.cookies.get({
      url: EAMUSEMENT_URL,
      name: "M573SSID",
    });

    if (!cookie) {
      console.log("[Croit Extension] M573SSID 쿠키를 찾을 수 없습니다.");

      return {
        authenticated: false,
        message: "e-amusement 로그인 세션을 찾을 수 없습니다.",
      };
    }

    console.log("[Croit Extension] M573SSID 쿠키를 확인했습니다.");

    const response = await fetch(EAMUSEMENT_INFO_URL, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("[Croit Extension] getinfo.html 응답 상태:", response.status);

    if (!response.ok) {
      return {
        authenticated: false,
        message: "e-amusement 사용자 정보를 확인하지 못했습니다.",
      };
    }

    const data = (await response.json()) as EamusementUserInfo;

    console.log("[Croit Extension] e-amusement 로그인 상태:", data.status);

    if (data.status !== 1 || !data.snsid) {
      console.log("[Croit Extension] e-amusement 로그인 상태가 유효하지 않습니다.");

      return {
        authenticated: false,
        message: "e-amusement에 로그인되어 있지 않습니다.",
      };
    }

    console.log("[Croit Extension] e-amusement 로그인 상태가 확인되었습니다.", data.snsid);

    return {
      authenticated: true,
      snsid: String(data.snsid),
      message: "e-amusement 로그인 상태가 확인되었습니다.",
    };
  } catch (error: unknown) {
    console.error("[Croit Extension] e-amusement 인증 상태 확인 중 오류가 발생했습니다.", error);

    return {
      authenticated: false,
      message: "e-amusement 인증 상태를 확인하지 못했습니다.",
    };
  }
}

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CHECK_EAMUSEMENT_AUTH") {
    return;
  }

  console.log("[Croit Extension] 인증 상태 확인 요청을 받았습니다.");

  void checkEamusementAuth().then((result) => {
    console.log("[Croit Extension] 인증 상태 확인 결과:", result);

    sendResponse(result);
  });

  return true;
});

async function saveCroitSession(sessionToken: string) {
  await chrome.storage.session.set({
    croitSessionToken: sessionToken,
  });
}

async function getCroitSession(): Promise<string | null> {
  const result = await chrome.storage.session.get("croitSessionToken");

  return typeof result.croitSessionToken === "string" ? result.croitSessionToken : null;
}

async function clearCroitSession() {
  await chrome.storage.session.remove("croitSessionToken");
}