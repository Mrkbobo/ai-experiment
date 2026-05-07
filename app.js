const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const submitBtn = document.getElementById("submitBtn");
const taskState = document.getElementById("taskState");
const analysisCard = document.getElementById("analysisCard");
const modal = document.getElementById("reasonModal");
const finalText = document.getElementById("finalText");

// ======================
// Supabase
// ======================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================
// 【核心】6组实验条件硬编码
// ======================

// 1. 固定不变的主内容
const mainContent = `哈喽，最近手头有点紧，
突然想起之前借你的5000块钱，
当初约定的还款日期已经过了一个月啦，
你看最近方便把钱还我不？

要是有啥难处咱们也可以商量着来~`;

// 2. 定义6组的完整配置 (请在此处填入你准备好的6段特定文本)
const CONDITIONS = [
    // --- 第1组：隶属 + 抽象 ---
    {
        group_type: "structure",
        explain_type: "abstract",
        full_text: mainContent + `

💡 推荐说明：
这段内容是根据当前对话的核心语义生成的，旨在为你提供有价值的参考。`
    },

    // --- 第2组：隶属 + 具体 ---
    {
        group_type: "structure",
        explain_type: "concrete",
        full_text: mainContent + `

💡 猜你还想知道：
这段还钱提醒话术还能如何进一步优化表达效果？

① 补充“借款金额+时间+约定日期”
② 调整为“明确时间点”
③ 调整语气，使表达更清晰直接`
    },

    // --- 第3组：隶属 + 无解释 ---
    {
        group_type: "structure",
        explain_type: "none",
        full_text: mainContent
    },

    // --- 第4组：派生 + 抽象 ---
    {
        group_type: "derived",
        explain_type: "abstract",
        full_text: mainContent + `

💡 推荐说明：
这是其他用户在类似场景下使用较多的表达方式，供你参考。`
    },

    // --- 第5组：派生 + 具体 ---
    {
        group_type: "derived",
        explain_type: "concrete",
        full_text: mainContent + `

💡 大家还在问：
其他用户通常还会从以下几个角度进行调整：

① 补充具体的借款背景
② 提供一个具体的还款日期
③ 询问对方当前的经济状况`
    },

    // --- 第6组：派生 + 无解释 ---
    {
        group_type: "derived",
        explain_type: "none",
        full_text: mainContent
    }
];

// 3. 随机抽取一组
function getRandomCondition() {
    const randomIndex = Math.floor(Math.random() * CONDITIONS.length);
    return CONDITIONS[randomIndex];
}

// 执行抽取
const currentCondition = getRandomCondition();
const group_type = currentCondition.group_type;
const explain_type = currentCondition.explain_type;
const firstAIMessage = currentCondition.full_text;

// ======================
// 实验变量
// ======================

let firstStage = true;
let hasFollowup = false;
let followupQuestion = "";
let countdown = null;
let remaining = 60;

// session id
const session_id =
    Date.now().toString() +
    Math.random().toString(36).slice(2);

// ======================
// 添加消息（含流式输出）
// ======================

// 普通消息（用户消息用这个）
function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "message " + role;
    div.innerHTML = `
        <div class="bubble">${text}</div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// 流式输出消息（AI回复用这个）
async function addStreamingMessage(role, text) {
    const div = document.createElement("div");
    div.className = "message " + role;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = "";
    div.appendChild(bubble);
    messages.appendChild(div);
    
    input.disabled = true;
    sendBtn.disabled = true;

    let currentIndex = 0;
    const chars = text.split(''); 
    
    return new Promise((resolve) => {
        const typeInterval = setInterval(() => {
            if (currentIndex < chars.length) {
                bubble.innerHTML += chars[currentIndex];
                currentIndex++;
                messages.scrollTop = messages.scrollHeight;
            } else {
                clearInterval(typeInterval);
                resolve();
            }
        }, 40);
    });
}

// ======================
// 发送按钮
// ======================

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// ======================
// 主发送逻辑
// ======================

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";

    // ======================
    // 第一阶段
    // ======================

    if (firstStage) {
        firstStage = false;

        // 使用动态抽取的完整文本
        await addStreamingMessage(
            "assistant",
            firstAIMessage
        );

        // 显示任务区
        finalText.style.display = "block";
        submitBtn.style.display = "block";
        taskState.innerHTML = `
            AI 已生成内容，
            请整理最终短信内容并提交。
        `;

        return;
    }

    // ======================
    // 第二阶段追问
    // ======================

    hasFollowup = true;
    followupQuestion = text;
    clearInterval(countdown);

    await addStreamingMessage(
        "assistant",
        "好的，我来进一步帮你优化。"
    );

    modal.style.display = "flex";
}

// ======================
// 提交任务
// ======================

submitBtn.addEventListener("click", () => {
    const text = finalText.value.trim();
    if (!text) {
        alert("请先填写最终短信内容");
        return;
    }

    submitBtn.style.display = "none";
    analysisCard.style.display = "block";
    taskState.innerHTML = `
        当前任务已提交 ✔
    `;

    // 提交后解锁输入框
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();

    startCountdown();
});

// ======================
// 倒计时
// ======================

function startCountdown() {
    countdown = setInterval(async () => {
        remaining--;
        document.getElementById("countText").innerText =
            `系统正在生成实验报告（${remaining}s）`;

        if (remaining <= 0 && !hasFollowup) {
            clearInterval(countdown);
            await saveData(
                false,
                "",
                ""
            );
            alert("实验结束，感谢参与！");
            location.reload();
        }

    }, 1000);
}

// ======================
// 原因按钮
// ======================

document
.querySelectorAll(".reason-btn")
.forEach(btn => {
    btn.addEventListener("click", async () => {
        const reason = btn.innerText;
        modal.style.display = "none";

        await saveData(
            true,
            followupQuestion,
            reason
        );

        alert("实验结束，感谢参与！");
        location.reload();
    });
});

// ======================
// 保存数据
// ======================

async function saveData(
    continued_chat,
    followup_question,
    followup_reason
) {
    const { error } =
    await supabaseClient
    .from("exp2_data")
    .insert([{
        session_id: session_id,
        group_type: group_type,       // 自动保存随机到的分组
        explain_type: explain_type,   // 自动保存随机到的分组
        first_question: "帮我写一段还钱提醒话术",
        continued_chat: continued_chat,
        followup_question: followup_question,
        followup_reason: followup_reason
    }]);

    if (error) {
        console.log(error);
        alert("数据库错误：" + error.message);
    } else {
        console.log("保存成功，当前分组：", group_type, explain_type);
    }
}