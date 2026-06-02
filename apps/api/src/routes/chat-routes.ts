// Conversation and message routes for SupportAI customer chat.
import { Router } from "express";
import { createConversationSchema, createMessageSchema } from "@supportai/shared";
import { asyncRoute } from "../utils/async-route";
import { requireBusinessId } from "../services/business-service";
import { answerMessage, createConversation, getConversation, listConversations } from "../services/chat-service";
import "../types";

export const chatRouter = Router();

chatRouter.post(
  "/chat/conversations",
  asyncRoute(async (req, res) => {
    const businessId = requireBusinessId(req.context.auth?.businessId);
    const conversation = await createConversation(createConversationSchema.parse(req.body), businessId);
    res.status(201).json({ data: conversation });
  })
);

chatRouter.get(
  "/chat/conversations",
  asyncRoute(async (req, res) => {
    res.json({ data: await listConversations(requireBusinessId(req.context.auth?.businessId)) });
  })
);

chatRouter.get(
  "/chat/conversations/:conversationId",
  asyncRoute(async (req, res) => {
    const data = await getConversation(req.params.conversationId!, requireBusinessId(req.context.auth?.businessId));
    res.json({ data });
  })
);

chatRouter.post(
  "/chat/conversations/:conversationId/messages",
  asyncRoute(async (req, res) => {
    const input = createMessageSchema.parse(req.body);
    const data = await answerMessage(
      req.params.conversationId!,
      requireBusinessId(req.context.auth?.businessId),
      input.content
    );
    res.status(201).json({ data });
  })
);
