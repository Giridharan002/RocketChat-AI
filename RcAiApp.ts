// RcAiChatApp.ts
import { IAppAccessors, IConfigurationExtend, IHttp, ILogger, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IMessage, IPostMessageSent } from "@rocket.chat/apps-engine/definition/messages";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUIKitResponse, UIKitActionButtonInteractionContext, UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { RcAIChatCommand } from "./commands/RcAiChatCommand";
import { buttons } from "./config/Buttons";
import { ActionButtonHandler } from "./handlers/ActionButtonHandler";
import { ViewSubmitHandler } from "./handlers/ViewSubmit";
import { GenAiStackQueryRequest } from "./lib/RequestRcAiChat";
import { sendDirect } from "./lib/SendDirect";
import { sendMessage } from "./lib/SendMessage";
import { sendNotification } from "./lib/SendNotification";

export class RcAiChatApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        await configuration.slashCommands.provideSlashCommand(
            new RcAIChatCommand(this)
        );
        
        await Promise.all(
            buttons.map((button) => configuration.ui.registerButton(button))
        );
    }

    public async executeActionButtonHandler(
        context: UIKitActionButtonInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        return new ActionButtonHandler().executor(
            this,
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        return new ViewSubmitHandler().executor(
            this,
            context,
            read,
            http,
            persistence,
            modify,
            this.getLogger()
        );
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        const { text, editedAt, room, sender } = message;
        var bot_user = await read.getUserReader().getAppUser();
        if (
            bot_user &&
            message.room.type == RoomType.DIRECT_MESSAGE &&
            message.room.userIds?.includes(bot_user?.id) &&
            bot_user?.id !== sender.id
        ) {
            try {
                const result = await GenAiStackQueryRequest(
                    this,
                    http,
                    read,
                    JSON.stringify([{ "role": "user", "content": message.text }]),
                    sender
                );
                if (result.success) {
                    var markdown_message = result.content.choices[0].message.content;
                    sendDirect(sender, read, modify, markdown_message);
                } else {
                    sendNotification(
                        modify,
                        room,
                        sender,
                        `**Error!** Could not Request Completion:\n\n` +
                        result.content.error.message
                    );
                }
            } catch (error) {
                this.getLogger().error("Error processing message:", error);
                sendNotification(
                    modify,
                    room,
                    sender,
                    `**Error!** An unexpected error occurred while processing your message.`
                );
            }
        }

        return;
    }
}
