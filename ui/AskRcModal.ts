import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    BlockElementType,
    ButtonStyle,
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitContextualBarViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";
import { AppSetting } from "../config/Settings";

export function createaskaiModal(
    modify: IModify,
    room: IRoom,
    initialPrompt?: string,
    threadId?: string,
    viewId?: string
): IUIKitContextualBarViewParam {
    const blocks = modify.getCreator().getBlockBuilder();

    console.log("Initial Prompt:", initialPrompt);
    console.log("Thread ID:", threadId);

    blocks.addInputBlock({
        blockId: AppSetting.NAMESPACE + "_ask_chatai",
        label: {
            text: `Prompt`,
            type: TextObjectType.PLAINTEXT,
        },
        element: blocks.newPlainTextInputElement({
            actionId: "suggested_prompt",
            initialValue: initialPrompt,
            multiline: true,
        }),
    });

    var answer_options = [
        {
            text: blocks.newPlainTextObject("Send me a direct message"),
            value: "direct#" + room.id + "#" + threadId,
        },
        {
            text: blocks.newPlainTextObject("As a notification"),
            value: "notification#" + room.id + "#" + threadId,
        },
        {
            text: blocks.newPlainTextObject("As a new message"),
            value: "message#" + room.id + "#" + threadId,
        },
    ];
    var answer_initialValue = "notification#" + room.id + "#" + threadId;
    // If threadId was provided, show as thread.
    if (threadId) {
        const thread_value = "thread#" + room.id + "#" + threadId;
        answer_initialValue = thread_value;
        var thread_button_message = "Thread";
        // Add thread as the first option
        answer_options = [
            {
                text: blocks.newPlainTextObject(thread_button_message),
                value: thread_value,
            },
        ].concat(answer_options);
    } else {
        // No thread, default to message
        answer_initialValue = "message#" + room.id + "#" + threadId;
    }

    blocks.addInputBlock({
        blockId: AppSetting.NAMESPACE + "_askchat_ai",
        optional: false,
        element: blocks.newMultiStaticElement({
            placeholder: blocks.newPlainTextObject("Output response as..."),
            actionId: "output_option",
            initialValue: [answer_initialValue],
            options: answer_options,
        }),
        label: blocks.newPlainTextObject("Output"),
    });

    console.log("Configured Blocks:", blocks.getBlocks());

    return {
        id: "ask-ai-submit-view",
        title: blocks.newPlainTextObject("Ask ai"),
        blocks: blocks.getBlocks(),
        submit: blocks.newButtonElement({
            actionId: "ask-chat-ai",
            text: blocks.newPlainTextObject("Ask"),
            value: "as-thread",
            style: ButtonStyle.PRIMARY,
        }),
    };
}
