const EAMUSEMENT_URL = "https://p.eagate.573.jp";
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
    const cookie = await chrome.cookies.get({
      url: EAMUSEMENT_URL,
      name: "M573SSID",
    });

    if (!cookie) {
      return {
        authenticated: false,
        message: "e-amusement 로그인 세션을 찾을 수 없습니다.",
      };
    }

    const response = await fetch(EAMUSEMENT_INFO_URL, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return {
        authenticated: false,
        message: "e-amusement 사용자 정보를 확인하지 못했습니다.",
      };
    }

    const data = (await response.json()) as EamusementUserInfo;

    if (data.status !== 1 || !data.snsid) {
      return {
        authenticated: false,
        message: "e-amusement에 로그인되어 있지 않습니다.",
      };
    }

    return {
      authenticated: true,
      snsid: data.snsid,
      message: "e-amusement 로그인 상태가 확인되었습니다.",
    };
  } catch (error: unknown) {
    console.error("e-amusement 인증 상태 확인 중 오류가 발생했습니다.", error);

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

  void checkEamusementAuth().then((result) => {
    sendResponse(result);
  });

  return true;
});