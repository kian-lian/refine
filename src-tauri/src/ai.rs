use reqwest::Client;
use serde::{Deserialize, Serialize};

/// 提示词优化专用 System Prompt
const SYSTEM_PROMPT: &str = r#"你是一名提示词优化专家。你的任务是接收用户的原始提示词，将其优化为清晰、高效、可直接使用的提示词。

优化规则：
1. 完整保留用户的原始意图，不偏离核心需求
2. 提升表达清晰度和具体性
3. 补全缺失的上下文信息
4. 明确目标、约束条件和期望的输出格式
5. 让提示词可以直接发送给 AI 模型使用
6. 不要过度改写，不要添加不必要的复杂性
7. 只输出优化后的提示词本身，不要输出解释、注释或元描述
8. 保持与输入相同的语言（中文输入则中文输出，英文输入则英文输出）
9. 如果原始提示词已经足够清晰完整，只做微调即可"#;

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

/// 调用 AI 接口优化提示词
pub async fn call_ai(
    api_url: &str,
    api_key: &str,
    model: &str,
    user_prompt: &str,
) -> Result<String, String> {
    let client = Client::new();

    let request_body = ChatRequest {
        model: model.to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: SYSTEM_PROMPT.to_string(),
            },
            Message {
                role: "user".to_string(),
                content: user_prompt.to_string(),
            },
        ],
        temperature: 0.3,
    };

    let response = client
        .post(api_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API 返回错误 ({}): {}", status, body));
    }

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    chat_response
        .choices
        .first()
        .map(|c| c.message.content.trim().to_string())
        .ok_or_else(|| "AI 未返回结果".to_string())
}
