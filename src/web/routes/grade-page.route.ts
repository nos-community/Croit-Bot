import { Router } from "express";
import { gradeUpdateRequestRepository } from "../../repositories/grade-update-request.repository.js";

const router = Router();

router.get("/:token", async (req, res) => {
  const token = req.params.token;

  const reqRecord = await gradeUpdateRequestRepository.findByToken(token);

  if (!reqRecord) {
    res.status(404).send("<h1>요청을 찾을 수 없습니다.</h1>");
    return;
  }

  if (reqRecord.expiresAt <= new Date()) {
    res.status(410).send("<h1>요청이 만료되었습니다.</h1>");
    return;
  }

  res.render("grade-page", { token });
});

export { router as gradePageRouter };
