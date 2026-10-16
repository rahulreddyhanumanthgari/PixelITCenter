import { Router } from "express";
import { adminController } from "../controllers/admin.js";
import { devAuthController } from "../controllers/devAuth.js";
import { filesController, type FileReader } from "../controllers/files.js";
import { studentProfileController } from "../controllers/studentProfile.js";
import type { FileSigner } from "../lib/storage.js";
import { requireAuth, requireRole, type AuthOptions } from "../middleware/auth.js";
import { tokenLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { singleUpload } from "../middleware/upload.js";
import type { ClientSection } from "../services/clientSection/index.js";
import type { ProfileService } from "../services/profileService.js";
import { clientSectionRoutes } from "./clientSection.js";

type Options = { auth: AuthOptions; maxUploadBytes: number; devAuth: boolean };

/** Everything under /api. */
export function apiRoutes(
  service: ProfileService,
  section: ClientSection,
  signer: FileSigner,
  readFile: FileReader,
  { auth, maxUploadBytes, devAuth }: Options,
) {
  const api = Router();
  const authed = requireAuth(auth);
  const clientSection = clientSectionRoutes(section, { authed, maxUploadBytes });

  // Student: only ever their own profile (the id comes from the token, never the URL).
  const student = studentProfileController(service);
  const s = Router();
  s.use("/profile", authed, requireRole("student"));
  s.get("/profile", student.get);
  s.put("/profile", student.saveDraft);
  s.post("/profile/submit", student.submit);
  s.get("/profile/documents", student.listDocuments);
  s.post("/profile/documents", uploadLimiter(), singleUpload(maxUploadBytes), student.uploadDocument);
  s.delete("/profile/documents/:id", student.deleteDocument);
  api.use("/student", s, clientSection.student);

  // Recruiters and admins: a student's Placement Details.
  const admin = adminController(service);
  const a = Router();
  a.use("/students", authed, requireRole("recruiter", "admin"));
  a.get("/students/:id/profile", admin.getProfile);
  a.patch("/students/:id/profile/status", admin.setStatus);
  // Staff: the client section (clients, placements, timesheets, billing).
  api.use("/admin", a, clientSection.admin);

  // Signed, short-lived file links.
  api.get("/files/:id", filesController(readFile, signer).download);

  if (devAuth) api.post("/dev/token", tokenLimiter(), devAuthController(auth.secret, auth).token);

  return api;
}
