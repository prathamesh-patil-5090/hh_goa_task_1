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

function isNetlify() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

function isServerlessDisk() {
  return Boolean(
    process.env.VERCEL ||
      process.env.LAMBDA_TASK_ROOT ||
      process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

function sharesDir() {
  if (isServerlessDisk()) {
    return path.join("/tmp", "hh-goa-shares");
  }
  return path.join(process.cwd(), "data", "shares");
}

async function ensureDir() {
  await mkdir(sharesDir(), { recursive: true });
}

async function netlifyStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("hh-goa-shares");
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

  if (isNetlify()) {
    try {
      const store = await netlifyStore();
      const ab = image.buffer.slice(
        image.byteOffset,
        image.byteOffset + image.byteLength,
      ) as ArrayBuffer;
      await store.set(id, ab, {
        metadata: {
          format: record.format,
          createdAt: record.createdAt,
          name: record.name || "",
          title: record.title || "",
        },
      });
      return record;
    } catch (err) {
      console.warn("Netlify blob write failed; falling back", err);
    }
  }

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

  if (isNetlify()) {
    try {
      const store = await netlifyStore();
      const data = await store.get(id, { type: "arrayBuffer" });
      if (data) return Buffer.from(data);
    } catch (err) {
      console.warn("Netlify blob read failed", err);
    }
  }

  try {
    await ensureDir();
    const file = path.join(sharesDir(), `${id}.png`);
    await access(file);
    return await readFile(file);
  } catch {
    return null;
  }
}

export async function getShareMeta(id: string): Promise<ShareMeta | null> {
  const hit = memory.get(id);
  if (hit) return hit.meta;

  if (isNetlify()) {
    try {
      const store = await netlifyStore();
      const result = await store.getWithMetadata(id, { type: "arrayBuffer" });
      if (result?.metadata) {
        const m = result.metadata as Record<string, string>;
        return {
          id,
          createdAt: m.createdAt || new Date().toISOString(),
          format: m.format === "pfp" ? "pfp" : "id",
          name: m.name || undefined,
          title: m.title || undefined,
        };
      }
    } catch (err) {
      console.warn("Netlify blob meta read failed", err);
    }
  }

  try {
    await ensureDir();
    const file = path.join(sharesDir(), `${id}.json`);
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as ShareMeta;
  } catch {
    return null;
  }
}
