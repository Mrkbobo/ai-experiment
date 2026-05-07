const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const messages = document.getElementById("messages");
const input = document.getElementById("input");

let session_id = Date.now().toString();

let group_type = "structure";
let explain_type = "abstract";

let first_question = "";
let followup_question = "";
let followup_reason = "";

let continued_chat = false;

// =========================
// 添加消息
// =========================

function addMessage(role, text) {

    const div = document.createElement("div");
    div.className = "message " + role;

    div.innerHTML = `
        <div class="bubble">${text}</div>
    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}

// =========================
// 第一次提问
// =========================

function sendFirstQuestion() {

    const text = input.value.trim();

    if (!text) return;

    first_question = text;

    addMessage("user", text);

    input.value = "";

    // 固定 AI 回答

    const reply = `
给你生成的还钱提醒话术如下：

哈喽，最近手头有点紧，突然想起之前借你的5000块钱，当初约定的还款日期已经过了一个月啦，你看最近方便把钱还我不？

要是有啥难处咱们也可以商量着来~

💡 猜你还想知道：
这段还钱提醒话术还能如何进一步优化表达效果？

① 补充“借款金额+时间+约定日期”
② 调整为“明确时间点”
③ 调整语气，使表达更清晰直接
`;

    addMessage("assistant", reply);

    // 锁死输入框

    document.getElementById("inputArea").style.display = "none";

    // 显示提交按钮

    document.getElementById("submitBtn").style.display = "block";
}

// =========================
// 提交任务
// =========================
function submitTask() {
    document.getElementById("submitBtn").style.display = "none";
    document.getElementById("analysisBox").style.display = "block";
}

// =========================
// 第二次追问
// =========================

function sendFollowup() {

    const text = input.value.trim();

    if (!text) return;

    followup_question = text;

    addMessage("user", text);

    input.value = "";

    addMessage(
        "assistant",
        "好的，我来帮你进一步优化。"
    );

    // 弹出原因调查

    document.getElementById("reasonModal").style.display = "flex";
}

// =========================
// 选择原因
// =========================

async function selectReason(reason) {

    followup_reason = reason;

    document.getElementById("reasonModal").style.display = "none";

    await saveData();

    alert("数据已记录，感谢参与！");
}

// =========================
// 保存数据
// =========================

async function saveData() {

    const { error } = await client
        .from('experiment_data')
        .insert([
            {
                session_id,
                group_type,
                explain_type,
                first_question,
                continued_chat,
                followup_question,
                followup_reason
            }
        ]);

    if (error) {
        console.log(error);
    }
}

// =========================
// 结束实验
// =========================

async function finishExperiment() {

    if (!continued_chat) {

        await saveData();
    }

    alert("实验结束，请联系研究者领取报酬。");
}