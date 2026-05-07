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

// 实验条件（你后面可以自动随机）
const group_type = "structure";
const explain_type = "concrete";

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
    // 1. 先创建一个空的消息容器
    const div = document.createElement("div");
    div.className = "message " + role;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = ""; // 初始为空
    div.appendChild(bubble);
    messages.appendChild(div);
    
    // 2. 锁住输入，防止打断
    input.disabled = true;
    sendBtn.disabled = true;

    // 3. 逐字输出（打字机效果）
    let currentIndex = 0;
    const chars = text.split(''); 
    
    // 返回一个Promise，等打字打完再继续后面的逻辑
    return new Promise((resolve) => {
        const typeInterval = setInterval(() => {
            if (currentIndex < chars.length) {
                // 一次加一个字符
                bubble.innerHTML += chars[currentIndex];
                currentIndex++;
                // 自动滚动到底部
                messages.scrollTop = messages.scrollHeight;
            } else {
                // 打完了
                clearInterval(typeInterval);
                // 【关键逻辑恢复】这里不解锁！必须等用户提交任务
                resolve(); // 通知外面打完了
            }
        }, 40); // 40ms是打字速度
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

        // 使用流式输出
        await addStreamingMessage(
            "assistant",
`给你生成的还钱提醒话术如下：

哈喽，最近手头有点紧，
突然想起之前借你的5000块钱，
当初约定的还款日期已经过了一个月啦，
你看最近方便把钱还我不？

要是有啥难处咱们也可以商量着来~

💡 猜你还想知道：
这段还钱提醒话术还能如何进一步优化表达效果？

① 补充“借款金额+时间+约定日期”
② 调整为“明确时间点”
③ 调整语气，使表达更清晰直接`
        );

        // 【逻辑保持】输入框依然是锁的，必须提交任务

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

    // 使用流式输出
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

    // 【核心修改】提交任务后，直接自动解锁输入框（替代原来的按钮功能）
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

        // 时间结束
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
        group_type: group_type,
        explain_type: explain_type,
        first_question: "帮我写一段还钱提醒话术",
        continued_chat: continued_chat,
        followup_question: followup_question,
        followup_reason: followup_reason
    }]);

    if (error) {
        console.log(error);
        alert("数据库错误：" + error.message);
    } else {
        console.log("保存成功");
    }
}