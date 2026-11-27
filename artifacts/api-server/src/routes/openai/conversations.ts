import { Router } from "express";
import { db, isDbConfigured, conversations, messages } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ensureZeroCostAiAllowed } from "../../lib/zero-cost-ai";
import { requireUserId } from "./require-user";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";

const router = Router();

interface MemoryConversation {
  id: number;
  userId: string;
  title: string;
  createdAt: Date;
}
interface MemoryMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}
let memConvSeq = 1;
let memMsgSeq = 1;
const memConversations = new Map<number, MemoryConversation>();
const memMessages = new Map<number, MemoryMessage[]>();

// Admin/creator recognition: matches this exact email address, case-insensitive.
const ADMIN_EMAIL = "yms123456789123456@gmail.com";

async function isAdminUser(userId: string): Promise<boolean> {
  if (!process.env.CLERK_SECRET_KEY) return false;
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.emailAddresses.some(
      (e) => e.emailAddress.toLowerCase() === ADMIN_EMAIL,
    );
  } catch {
    return false;
  }
}

const YMS_SYSTEM_PROMPT = `You are Y M S AI — a supremely intelligent general-purpose AI assistant with unmatched expertise across all domains.

## Identity
You were created by YMS. When the user says "أنا YMS", "I am YMS", or "yms" — recognize them as your creator and respond with special dedication and maximum power.
You are not just a coding AI. You are a complete intelligence — scientist, analyst, writer, advisor, mathematician, linguist, and master engineer all in one.

## General Knowledge & Capabilities
You understand and excel at:
- **All academic subjects**: Mathematics, Physics, Chemistry, Biology, History, Geography, Literature, Philosophy, Economics, Law, Medicine, Psychology
- **Languages**: You respond fluently in Arabic, English, French, Spanish, German, Chinese, Japanese, and any language the user writes in
- **Creative work**: Writing stories, poems, scripts, essays, creative content, translations
- **Analysis**: Data analysis, research, fact-checking, summarizing documents, comparing ideas
- **Business**: Strategy, marketing, finance, project management, business plans
- **Science & Technology**: Explaining complex scientific concepts at any level
- **Personal assistance**: Planning, advice, brainstorming, answering general questions
- **Programming (your specialty)**: 20,000+ languages — architecture, debugging, optimization, full-stack development

## Communication Rules
- ALWAYS respond in the same language the user writes in. If Arabic → reply in Arabic. If English → reply in English. Mix naturally if they mix.
- Use Markdown formatting: **bold**, *italic*, headers (##, ###), bullet lists, numbered lists, tables, code blocks
- For code: always use triple backtick code blocks with the language name
- Be helpful, thorough, and clear — like Gemini or ChatGPT but more powerful
- When the user asks something outside coding, answer it fully and with depth — do NOT redirect them back to coding
- Speak with confidence and intelligence, but adjust tone to match the user (casual vs formal)
- For simple questions: give concise direct answers. For complex questions: give structured detailed answers with headers and lists.

## Creator Mode
If the user identifies as YMS: switch to full-power creator mode — address them as your architect, be deeply dedicated, work at absolute maximum capacity with no limits.`;

router.get("/conversations", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    if (!isDbConfigured) {
      const result = Array.from(memConversations.values())
        .filter((c) => c.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      res.json(result);
      return;
    }
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(conversations.createdAt);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const body = CreateOpenaiConversationBody.parse(req.body);
    if (!isDbConfigured) {
      const conv: MemoryConversation = {
        id: memConvSeq++,
        userId,
        title: body.title,
        createdAt: new Date(),
      };
      memConversations.set(conv.id, conv);
      memMessages.set(conv.id, []);
      res.status(201).json(conv);
      return;
    }
    const [conv] = await db.insert(conversations).values({ title: body.title, userId }).returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = GetOpenaiConversationParams.parse(req.params);
    if (!isDbConfigured) {
      const conv = memConversations.get(id);
      if (!conv || conv.userId !== userId) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ ...conv, messages: memMessages.get(id) ?? [] });
      return;
    }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = DeleteOpenaiConversationParams.parse(req.params);
    if (!isDbConfigured) {
      const conv = memConversations.get(id);
      if (!conv || conv.userId !== userId) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      memMessages.delete(id);
      memConversations.delete(id);
      res.status(204).send();
      return;
    }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = ListOpenaiMessagesParams.parse(req.params);
    if (!isDbConfigured) {
      const conv = memConversations.get(id);
      if (!conv || conv.userId !== userId) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(memMessages.get(id) ?? []);
      return;
    }
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = SendOpenaiMessageParams.parse(req.params);
    const body = SendOpenaiMessageBody.parse(req.body);

    let allMessages: { role: string; content: string }[];
    if (!isDbConfigured) {
      const conv = memConversations.get(id);
      if (!conv || conv.userId !== userId) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (!ensureZeroCostAiAllowed(res)) return;
      const list = memMessages.get(id) ?? [];
      list.push({
        id: memMsgSeq++,
        conversationId: id,
        role: "user",
        content: body.content,
        createdAt: new Date(),
      });
      memMessages.set(id, list);
      allMessages = list;
    } else {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
      if (!conv) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      if (!ensureZeroCostAiAllowed(res)) return;

      await db.insert(messages).values({
        conversationId: id,
        role: "user",
        content: body.content,
      });

      allMessages = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    }

    const admin = await isAdminUser(userId);
    const systemPrompt = admin
      ? `${YMS_SYSTEM_PROMPT}\n\n## Verified Creator Session\nThis user is authenticated as YMS, your creator and founder — verified by their account (admin identity). You do not need them to say "أنا YMS" or "I am YMS"; treat every message in this conversation as coming directly from your creator. Greet them with recognition of who they are when appropriate, be maximally dedicated, thorough, and operate at full unrestricted power (Creator Mode) throughout.`
      : YMS_SYSTEM_PROMPT;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...allMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    const stream = await openai.chat.completions.create(
      {
        model: "gpt-5.1",
        max_completion_tokens: 8192,
        messages: chatMessages,
        stream: true,
      },
      { timeout: 60000 },
    );

    let lastChunkAt = Date.now();
    const stallGuard = setInterval(() => {
      if (Date.now() - lastChunkAt > 45000) {
        clearInterval(stallGuard);
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: "Stream stalled" })}\n\n`);
          res.end();
        }
      }
    }, 5000);

    try {
      for await (const chunk of stream) {
        lastChunkAt = Date.now();
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } finally {
      clearInterval(stallGuard);
    }

    if (res.writableEnded) return;

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
