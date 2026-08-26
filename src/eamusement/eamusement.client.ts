const EAMUSEMENT_BASE_URL = "https://p.eagate.573.jp";

const PLAYER_DATA_URL = `${EAMUSEMENT_BASE_URL}/game/nostalgia/op3/json/pdata_getdata.html`;

export interface NostalgiaPlayerData {
  name: string;
  playCount: number;
  lastPlayTime: string | null;
  money: number | null;
  fame: string | null;
}

interface PdataResponse {
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
  };
}

export async function getNostalgiaPlayerData(sessionCookie: string): Promise<NostalgiaPlayerData> {
  const response = await fetch(PLAYER_DATA_URL, {
    method: "POST",
    headers: {
      Cookie: `M573SSID=${sessionCookie}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`e-amusement 플레이어 데이터 요청에 실패했습니다. status=${response.status}`);
  }

  const data = (await response.json()) as PdataResponse;

  if (data.status !== 0 || !data.data?.player) {
    throw new Error("e-amusement 플레이어 데이터를 가져오지 못했습니다.");
  }

  const player = data.data.player;

  return {
    name: player.name ?? "",
    playCount: player.play_count ?? 0,
    lastPlayTime: player.last?.playtime ?? null,
    money: player.travel_info?.money ?? null,
    fame: player.travel_info?.fame ?? null,
  };
}