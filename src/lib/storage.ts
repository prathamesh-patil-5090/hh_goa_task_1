import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export type ShareMeta = {
  id: string;
  createdAt: string;
  format: "id" | "pfp";
  name?: string;
  title?: string;
};

type MemoryEntry = { meta: ShareMeta; image: Buffer };

const memory = new Map<string, MemoryEntry>();

function sharesDir() {
  const isServerless =
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    return path.join("/tmp", "hh-goa-shares");
  }
  return path.join(process.cwd(), "data", "shares");
}

async function ensureDir() {
  await mkdir(sharesDir(), { recursive: true });
}

export async function saveShare(
  image: Buffer,
  meta: Omit<ShareMeta, "id" | "createdAt"> & { name?: string; title?: string },
): Promise<ShareMeta> {
  const id = nanoid(12);
  const record: ShareMeta = {
    id,
    createdAt: new Date().toISOString(),
    format: meta.format,
    name: meta.name,
    title: meta.title,
  };

  memory.set(id, { meta: record, image });

  try {
    await ensureDir();
    await writeFile(path.join(sharesDir(), `${id}.png`), image);
    await writeFile(
      path.join(sharesDir(), `${id}.json`),
      JSON.stringify(record),
      "utf8",
    );
  } catch (err) {
    console.warn("Disk share write failed; using memory only", err);
  }

  return record;
}

export async function getShareImage(id: string): Promise<Buffer | null> {
  const hit = memory.get(id);
  if (hit) return hit.image;

  try {
    await ensureDir();
    const file = path.join(sharesDir(), `${id}.png`);
    await access(file);
    const image = await readFile(file);
    return image;
  } catch {
    return null;
  }
}

export async function getShareMeta(id: string): Promise<ShareMeta | null> {
  const hit = memory.get(id);
  if (hit) return hit.meta;

  try {
    await ensureDir();
    const file = path.join(sharesDir(), `${id}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ShareMeta;
  } catch {
    return null;
  }
}
