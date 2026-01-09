
import { AppConfig, PaymentPlan } from "../types";
import { getApiConfig } from "./geminiService";

// Default configuration (Frontend default)
const DEFAULT_APP_CONFIG: AppConfig = {
    appName: "Yesir",
    themeColor: "#f59e0b", // Cinema Amber
    features: {
        comic: true,
        video: true,
        image: true,
        payment: true,
        invite: true
    },
    announcement: "欢迎使用 Yesir AI 导演系统 (Demo v2.0)"
};

export const getAppConfig = async (): Promise<AppConfig> => {
    const apiConfig = getApiConfig();
    
    if (apiConfig.enableBackend) {
        try {
            // Try to fetch from backend (DIY Config)
            const response = await fetch(`${apiConfig.backendUrl}/system/ui-config`);
            if (response.ok) {
                const data = await response.json();
                return { ...DEFAULT_APP_CONFIG, ...data };
            }
        } catch (e) {
            console.warn("Failed to fetch UI config from backend, using default.", e);
        }
    }
    
    // Simulate API delay for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    return DEFAULT_APP_CONFIG;
};

export const getPaymentPlans = async (): Promise<PaymentPlan[]> => {
    // Mock Plans
    return [
        {
            id: 'plan_monthly',
            name: '导演月卡',
            price: 29.9,
            originalPrice: 49.9,
            duration: '30天',
            features: ['无限生成分镜', '优先视频渲染', '解锁所有画风', '无水印导出'],
            isPopular: false
        },
        {
            id: 'plan_yearly',
            name: '制片人年卡',
            price: 299,
            originalPrice: 599,
            duration: '365天',
            features: ['月卡所有权益', '专属客服支持', 'Sora 模型优先权', '企业级商用授权'],
            isPopular: true
        },
        {
            id: 'plan_credits',
            name: '算力加油包',
            price: 9.9,
            originalPrice: 19.9,
            duration: '永久有效',
            features: ['100 积分', '支持单次购买', '永不过期', '不可退款'],
            isPopular: false
        }
    ];
};
