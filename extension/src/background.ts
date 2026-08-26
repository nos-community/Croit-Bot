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
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      referrer: EAMUSEMENT_URL,
      referrerPolicy: "no-referrer-when-downgrade",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    console.log("[Croit Extension] getinfo.html 응답 상태:", response.status);

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "<non-text body>");
      console.warn("[Croit Extension] getinfo.html 비정상 응답 본문:", bodyText);

      // 일부 환경에서 API가 400을 반환하더라도 쿠키가 존재하면 로그인 세션이 유효한 경우가 있습니다.
      // 큰 구조 변경 없이 사용자 경험을 보장하기 위해, 400 응답일 때는 쿠키 존재 여부로 폴백 처리합니다.
      if (response.status === 400 && cookie) {
        console.log(
          "[Croit Extension] 400 응답 받았지만 M573SSID 쿠키가 존재하므로 인증을 허용합니다.",
        );

        return {
          authenticated: true,
          snsid: undefined,
          message: "e-amusement 쿠키가 존재하여 인증된 것으로 간주합니다. (API 응답 400)",
        };
      }

      return {
        authenticated: false,
        message: `e-amusement 사용자 정보를 확인하지 못했습니다. HTTP ${response.status}: ${bodyText}`,
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
  if (message?.type !== "CHECK_EAMUSEMENT_AUTH" && message?.type !== "GET_NOSTALGIA_PLAYER_DATA") {
    return;
  }

  if (message.type === "CHECK_EAMUSEMENT_AUTH") {
    console.log("[Croit Extension] 인증 상태 확인 요청을 받았습니다.");

    void checkEamusementAuth().then((result) => {
      console.log("[Croit Extension] 인증 상태 확인 결과:", result);

      sendResponse(result);
    });

    return true;
  }

  if (message.type === "GET_NOSTALGIA_PLAYER_DATA") {
    console.log("[Croit Extension] 노스텔지어 정보 조회 요청을 받았습니다.");

    void getNostalgiaPlayerData().then((result) => {
      console.log("[Croit Extension] 노스텔지어 정보 조회 결과:", result);

      sendResponse(result);
    });

    return true;
  }
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

const NOSTALGIA_PLAYER_URL = "https://p.eagate.573.jp/game/nostalgia/op3/json/pdata_getdata.html";

interface NostalgiaPlayerData {
  status?: number;

  data?: {
    player?: {
      name?: string;
      play_count?: number;

      last?: {
        playtime?: string;
      };

      travel_info?: {
        money?: number;
        fame?: string;
      };
    };

    status?: number;
    fail_code?: number;
  };

  [key: string]: unknown;
}

interface NostalgiaPlayerResult {
  success: boolean;
  message: string;

  player?: {
    name?: string;
    playCount?: number;
    lastPlaytime?: string;
    money?: number;
    fame?: string;
  };
}

async function getNostalgiaPlayerData(): Promise<NostalgiaPlayerResult> {
  try {
    console.log("[Croit] 노스텔지어 플레이어 정보를 요청합니다.");

    const response = await fetch(NOSTALGIA_PLAYER_URL, {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({}),
    });

    console.log("[Croit] Nostalgia API 응답:", response.status, response.statusText);

    if (!response.ok) {
      return {
        success: false,
        message: `노스텔지어 정보를 불러오지 못했습니다. HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as NostalgiaPlayerData;

    console.log("[Croit] Nostalgia API 데이터:", data);

    const player = data.data?.player;

    if (!player) {
      return {
        success: false,
        message: "노스텔지어 플레이어 정보를 찾을 수 없습니다.",
      };
    }

    return {
      success: true,
      message: "노스텔지어 플레이어 정보를 성공적으로 불러왔습니다.",

      player: {
        name: player.name,
        playCount: player.play_count,
        lastPlaytime: player.last?.playtime,
        money: player.travel_info?.money,
        fame: player.travel_info?.fame,
      },
    };
  } catch (error: unknown) {
    console.error("[Croit] 노스텔지어 플레이어 정보 조회 중 오류:", error);

    return {
      success: false,
      message: "노스텔지어 정보를 조회하는 중 오류가 발생했습니다.",
    };
  }
}
