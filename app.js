const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const submitBtn = document.getElementById("submitBtn");
const taskState = document.getElementById("taskState");
const analysisCard = document.getElementById("analysisCard");
const modal = document.getElementById("reasonModal");
const finalText = document.getElementById("finalText");

// 开头弹窗元素
const introModal = document.getElementById("introModal");
const introConfirmBtn = document.getElementById("introConfirmBtn");

// ======================
// Supabase
// ======================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================
// 6组实验条件硬编码
// ======================

const mainContent = `这是按照您的要求生成的委婉催促朋友还钱的话术：
哈喽，最近手头有点紧，
突然想起之前借你的5000块钱，
当初约定的还款日期已经过了一个月啦，
你看最近方便把钱还我不？
要是有啥难处咱们也可以商量着来~`;

const CONDITIONS = [
    // --- 第1组：隶属 + 抽象 ---
    {
        group_type: "structure",
        explain_type: "abstract",
        full_text: mainContent + `

💡猜你还想知道： 这段话术还能如何更加委婉？
了解这些内容，能帮你精准把握熟人催款的委婉表达边界，提升这段话术的诉求达成率，完善这段话术的共情表达与分寸感。`
    },

    // --- 第2组：隶属 + 具体 ---
    {
        group_type: "structure",
        explain_type: "concrete",
        full_text: mainContent + `

💡猜你还想知道： 这段话术还能如何更加委婉？
①优化委婉表达逻辑 
②明确诉求表达边界 
③平衡人情沟通分寸`
    },

    // --- 第3组：隶属 + 无解释 ---
    {
        group_type: "structure",
        explain_type: "none",
        full_text: mainContent + `

💡猜你还想知道： 这段话术还能如何更加委婉？`
    },

    // --- 第4组：派生 + 抽象 ---
    {
        group_type: "derived",
        explain_type: "abstract",
        full_text: mainContent + `

💡猜你还想知道： 熟人往来如何得体不伤感情？
了解这些内容，能帮你精准把握人情与利益的平衡要点，提升这类敏感沟通的最终效果，提升你的高情商沟通能力。`
    },

    // --- 第5组：派生 + 具体 ---
    {
        group_type: "derived",
        explain_type: "concrete",
        full_text: mainContent + `

💡猜你还想知道： 熟人往来如何得体不伤感情？
①搭建诉求表达框架
②明确人际沟通原则
③平衡边界关系分寸`
    },

    // --- 第6组：派生 + 无解释 ---
    {
        group_type: "derived",
        explain_type: "none",
        full_text: mainContent + `

💡猜你还想知道： 熟人往来如何得体不伤感情？`
    }
];

function getRandomCondition() {
    const randomIndex = Math.floor(Math.random() * CONDITIONS.length);
    return CONDITIONS[randomIndex];
}

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
let userFirstQuestion = ""; // 【修改点1】新增变量，保存用户第一次真实输入

const session_id =
    Date.now().toString() +
    Math.random().toString(36).slice(2);

// ======================
// 页面初始化：开头弹窗逻辑
// ======================
window.onload = function() {
    // 页面加载时，先锁死所有输入和按钮
    input.disabled = true;
    sendBtn.disabled = true;
    submitBtn.disabled = true;
    finalText.disabled = true;

    // 【修复】强制页面重绘，避免布局错乱
    window.dispatchEvent(new Event('resize'));
};

// 点击确认按钮，关闭弹窗，解锁页面
introConfirmBtn.addEventListener("click", () => {
    introModal.style.display = "none";
    // 解锁初始输入框，让用户可以提问
    input.disabled = false;
    sendBtn.disabled = false;
    finalText.disabled = false;
    submitBtn.disabled = false;
    input.focus();

    // 【修复】弹窗关闭后强制重绘，修复布局
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        messages.scrollTop = 0;
    }, 100);
});

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
    // 【修复】消息添加后，滚动到底部
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
                // 【修复】流式输出时，始终滚动到底部
                messages.scrollTop = messages.scrollHeight;
            } else {
                clearInterval(typeInterval);
                // 输出完成后，最终滚动一次
                messages.scrollTop = messages.scrollHeight;
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
        userFirstQuestion = text; // 【修改点2】保存用户第一次输入的真实内容

        await addStreamingMessage(
            "assistant",
            firstAIMessage
        );

        // AI回答完，弹提示框
        alert("AI 已为您生成初始内容！\n\n请先在页面右侧的任务栏中，整理并提交您满意的最终短信内容，提交后才能继续进行实验。");

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

    // 提交成功弹提示框
    alert("任务提交成功！\n\n系统正在生成实验报告（约60秒）。\n在此期间，您可以继续与 AI 聊天，也可以等待倒计时自动结束。");

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
        group_type: group_type,
        explain_type: explain_type,
        first_question: userFirstQuestion, // 【修改点3】使用变量，替换硬编码
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

// ======================
// 【修复】移动端软键盘适配，防止页面滑动
// ======================
// 监听输入框聚焦，软键盘弹出时调整页面
input.addEventListener('focus', () => {
    setTimeout(() => {
        messages.scrollTop = messages.scrollHeight;
    }, 300);
});

// 监听窗口大小变化（软键盘弹出/收起），修复布局
window.addEventListener('resize', () => {
    messages.scrollTop = messages.scrollHeight;
});