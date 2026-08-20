import type { TavusEchoInput } from "@/lib/avatar/avatar-playback";

export function createTavusEchoInteraction({
  conversationId,
  messageId,
  text
}: TavusEchoInput) {
  return {
    conversation_id: conversationId,
    event_type: "conversation.echo",
    message_type: "conversation",
    properties: {
      done: true,
      inference_id: messageId,
      modality: "text",
      text
    }
  };
}
