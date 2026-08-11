const EAMUSEMENT_URL = "https://p.eagate.573.jp";
const EAMUSEMENT_COOKIE_NAME = "M573SSID";
const EAMUSEMENT_INFO_URL = "https://p.eagate.573.jp/gate/p/tare/getinfo.html";

interface EamusementUserInfo {
  status: number;
  snsid?: string;
  [key: string]: unknown;
}

async function getM573SSID(): Promise<string | null> {
  const cookie = await chrome.cookies.get({
    url: EAMUSEMENT_URL,
    name: EAMUSEMENT_COOKIE_NAME,
  });

  return cookie?.value ?? null;
}

async function getEamusementUserInfo(sessionCookie: string): Promise<EamusementUserInfo> {
  const response = await fetch(EAMUSEMENT_INFO_URL, {
    method: "GET",
    headers: {
      Cookie: `${EAMUSEMENT_COOKIE_NAME}=${sessionCookie}`,
    },
  });

  if (!response.ok) {
    throw new Error(`e-amusement 사용자 정보 요청에 실패했습니다. HTTP ${response.status}`);
  }

  return (await response.json()) as EamusementUserInfo;
}

async function checkEamusementAuth() {
  const sessionCookie = await getM573SSID();

  if (!sessionCookie) {
    return {
      authenticated: false,
      message: "e-amusement 로그인 세션을 찾을 수 없습니다.",
    };
  }

  const userInfo = await getEamusementUserInfo(sessionCookie);

  if (userInfo.status !== 1) {
    return {
      authenticated: false,
      message: "e-amusement 로그인 세션이 유효하지 않습니다.",
    };
  }

  return {
    authenticated: true,
    userInfo,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CHECK_EAMUSEMENT_AUTH") {
    return;
  }

  void checkEamusementAuth()
    .then((result) => {
      sendResponse(result);
    })
    .catch((error: unknown) => {
      console.error("e-amusement 인증 확인 중 오류가 발생했습니다.", error);

      sendResponse({
        authenticated: false,
        message: "e-amusement 인증 상태를 확인하지 못했습니다.",
      });
    });

  return true;
});
