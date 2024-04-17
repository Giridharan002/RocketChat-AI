// lib/RequestRcAiChat.ts
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { RcAiChatApp } from "../RcAiApp";

export async function GenAiStackQueryRequest(
    app: RcAiChatApp,
    http: IHttp,
    read: IRead,
    question: string,
    sender: IUser
): Promise<any> {
    const apiUrl = "http://localhost:8504/query"; // Adjust the URL as necessary
    const requestUrl = `${apiUrl}?text=${encodeURIComponent(question)}&rag=true`;

    try {
        const response = await http.get(requestUrl);

        if (response.statusCode === 200 && response.content) {
            let data;
            try {
                data = JSON.parse(response.content);
            } catch (jsonError) {
                app.getLogger().error(`JSON Parsing Error:`, jsonError);
                return { success: false, content: "An error occurred while parsing the response. The response might not be valid JSON." };
            }

            // Corrected to match the actual response structure
            if (data.result) {
                return { success: true, content: data.result };
            } else {
                return { success: false, content: "The response from the GenAI stack does not contain a result." };
            }
        } else {
            return { success: false, content: "Failed to get a response from the GenAI stack." };
        }
    } catch (error) {
        app.getLogger().error(`Network Error:`, error);
        return { success: false, content: "An error occurred while making the request." };
    }
}
