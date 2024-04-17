import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { AppSetting } from "../config/Settings";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { sendMessage } from "../lib/SendMessage";

export class RcAIChatCommand implements ISlashCommand {
    public command = "rcai";
    public i18nParamsExample = AppSetting.NAMESPACE + "_SlashCommand_Params";
    public i18nDescription = AppSetting.NAMESPACE + "_SlashCommand_Description";
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const [question] = context.getArguments();

        if (!question) {
            await sendMessage(
                modify,
                context.getRoom(),
                "Please provide a question."
            );
            return;
        }

        const apiUrl = "http://localhost:8504/query-stream";
        const requestUrl = `${apiUrl}?text=${encodeURIComponent(
            question
        )}&rag=true`;

        try {
            const response = await http.get(requestUrl);

            console.log("Response Status:", response.statusCode);
            console.log("Raw Response Content:", response.content);

            if (response.statusCode === 200 && response.content) {
                let data;
                try {
                    data = JSON.parse(response.content);
                } catch (jsonError) {
                    console.error("JSON Parsing Error:", jsonError);
                    await sendMessage(
                        modify,
                        context.getRoom(),
                        "An error occurred while parsing the response. The response might not be valid JSON."
                    );
                    return;
                }

                const tokens = data.tokens || [];

                const answer =
                    tokens.join(" ") ||
                    "I could not find an answer to your question.";
                await sendMessage(modify, context.getRoom(), answer);
            } else {
                await sendMessage(
                    modify,
                    context.getRoom(),
                    "Failed to get an answer from the GenAI stack."
                );
            }
        } catch (error) {
            console.error("Network Error:", error);
            await sendMessage(
                modify,
                context.getRoom(),
                "An error occurred while making the request."
            );
        }
    }
}
