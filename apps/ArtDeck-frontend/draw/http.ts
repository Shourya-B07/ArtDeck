import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    try {
        const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
        const messages = res.data.messages;

        const shapes = messages.map((x: {id: number, message: string}) => {
            try {
                const messageData = JSON.parse(x.message);
                if (messageData.shape) {
                    // Add the database message ID to the shape for deletion tracking
                    messageData.shape.messageId = x.id;
                    return messageData.shape;
                }
                return null;
            } catch (error) {
                console.warn("Failed to parse message:", x.message);
                return null;
            }
        }).filter(shape => shape !== null);

        return shapes;
    } catch (error) {
        console.error("Failed to fetch existing shapes:", error);
        return [];
    }
}

// Note: Delete functions removed - deletion is now handled by WebSocket backend