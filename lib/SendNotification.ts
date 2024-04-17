import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function sendNotification(
    modify: IModify,
    room: IRoom,
    sender: IUser,
    message: string,
    threadId?: string
): Promise<void> {
    let msg = modify.getCreator().startMessage().setRoom(room).setText(message);
    if (threadId !== undefined) {
        msg.setThreadId(threadId);
    }
    // uncomment bellow if you want the notification to be sent by the sender
    // instead of the app bot user
    // msg = msg.setSender(sender);

    const block = modify.getCreator().getBlockBuilder();
    // we want this block to have a Text supporting MarkDown
    block.addSectionBlock({
        text: block.newMarkdownTextObject(message),
    });

    msg.setBlocks(block);
    return await modify.getNotifier().notifyUser(sender, msg.getMessage());
}
