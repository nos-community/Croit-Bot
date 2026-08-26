import { Router } from "express";

import { getNostalgiaPlayerData } from "../../eamusement/eamusement.client.js";

const router = Router();

router.post("/nostalgia/player", async (req, res) => {
  const sessionCookie = req.body?.sessionCookie;

  if (typeof sessionCookie !== "string" || sessionCookie.length === 0) {
    res.status(400).json({
      success: false,
      message: "e-amusement 세션이 필요합니다.",
    });

    return;
  }

  try {
    const playerData = await getNostalgiaPlayerData(sessionCookie);

    res.status(200).json({
      success: true,
      data: playerData,
    });
  } catch (error: unknown) {
    console.error("노스텔지어 플레이어 정보 조회 중 오류가 발생했습니다.", error);

    res.status(502).json({
      success: false,
      message: "e-amusement에서 노스텔지어 정보를 가져오지 못했습니다.",
    });
  }
});

export { router as eamusementRouter };