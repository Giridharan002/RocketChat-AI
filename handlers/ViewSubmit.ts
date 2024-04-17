// handlers/ViewSubmitHandler.ts
import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { AppSetting } from "../config/Settings";
import { RcAiChatApp } from "../RcAiApp";
import { GenAiStackQueryRequest } from "../lib/RequestRcAiChat";
import { sendDirect } from "../lib/SendDirect";
import { sendMessage } from "../lib/SendMessage";
import { sendNotification } from "../lib/SendNotification";

export class ViewSubmitHandler {
    public async executor(
        app: RcAiChatApp,
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
        logger?: ILogger
    ) {
        const interaction_data = context.getInteractionData();

        if (interaction_data.view.id === "ask-ai-submit-view") {
            if (interaction_data.view.state) {
                const completions_options = interaction_data.view.state[`${AppSetting.NAMESPACE}_ask_chatai`];
                console.log("Completions Options:", completions_options);

                const prompt = completions_options?.suggested_prompt;
                console.log("Extracted Prompt:", prompt);

                if (!prompt) {
                    console.error("User's question is undefined or null.");
                    return { success: false, message: "User's question is undefined or null." };
                }

                const user = interaction_data.user;

                GenAiStackQueryRequest(
                    app,
                    http,
                    read,
                    prompt,
                    user
                ).then((result) => {
                    if (!result.success) {
                        logger?.error("Request to GenAI stack failed:", result.content);
                        return;
                    }

                    // Log the retrieved response for debugging purposes
                    console.log("Retrieved Response:", result.content);

                    const output_options = completions_options?.["output_option"];
                    if (!output_options) {
                        logger?.error("Output options are undefined or null.");
                        return;
                    }

                    for (var output of output_options) {
                        const [output_mode, room_id, thread_id] = output.split("#");
                        read.getRoomReader()
                            .getById(room_id)
                            .then((room) => {
                                if (!room) {
                                    logger?.error("No room found for ID:", room_id);
                                    return;
                                }

                                // Log the output mode for debugging purposes
                                console.log("Sending response in mode:", output_mode);

                                switch (output_mode) {
                                    case "notification":
                                        sendNotification(
                                            modify,
                                            room,
                                            user,
                                            result.content,
                                            thread_id
                                        );
                                        break;
                                    case "direct":
                                        sendDirect(
                                            user,
                                            read,
                                            modify,
                                            result.content
                                        );
                                        break;
                                    case "thread":
                                        sendMessage(
                                            modify,
                                            room,
                                            result.content,
                                            undefined,
                                            thread_id
                                        );
                                        break;
                                    case "message":
                                        sendMessage(
                                            modify,
                                            room,
                                            result.content
                                        );
                                        break;
                                    default:
                                        logger?.warn(`Unsupported output mode: ${output_mode}`);
                                        break;
                                }
                            });
                    }
                });
            }
        }
        return {
            success: true,
        };
    }
}
