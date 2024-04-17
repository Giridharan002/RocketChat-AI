import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    NAMESPACE = "",
    GENAI_STACK_API_URL = "http://localhost:8504/query-stream",
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.GENAI_STACK_API_URL,
        public: true,
        type: SettingType.STRING,
        packageValue: "",
        hidden: false,
        i18nLabel: AppSetting.NAMESPACE + "GENAI_STACK_API_URL",
        required: true,
    },
];
