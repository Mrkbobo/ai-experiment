const messages = document.getElementById("messages");

const input = document.getElementById("input");

const sendBtn = document.getElementById("sendBtn");

const submitBtn = document.getElementById("submitBtn");

const continueBtn = document.getElementById("continueBtn");

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
// 添加消息
// ======================

function addMessage(role,text){

    const div = document.createElement("div");

    div.className = "message " + role;

    div.innerHTML = `
        <div class="bubble">${text}</div>
    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}

// ======================
// 发送按钮
// ======================

sendBtn.addEventListener("click",sendMessage);

input.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){

        sendMessage();
    }
});

// ======================
// 主发送逻辑
// ======================

function sendMessage(){

    const text = input.value.trim();

    if(!text) return;

    addMessage("user",text);

    input.value = "";

    // ======================
    // 第一阶段
    // ======================

    if(firstStage){

        firstStage = false;

        addMessage(
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

        // 锁输入

        input.disabled = true;

        sendBtn.disabled = true;

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

    addMessage(
        "assistant",
        "好的，我来进一步帮你优化。"
    );

    modal.style.display = "flex";
}

// ======================
// 提交任务
// ======================

submitBtn.addEventListener("click",()=>{

    const text = finalText.value.trim();

    if(!text){

        alert("请先填写最终短信内容");

        return;
    }

    submitBtn.style.display = "none";

    analysisCard.style.display = "block";

    taskState.innerHTML = `
        当前任务已提交 ✔
    `;

    startCountdown();
});

// ======================
// 倒计时
// ======================

function startCountdown(){

    countdown = setInterval(async ()=>{

        remaining--;

        document.getElementById("countText").innerText =
            `系统正在生成实验报告（${remaining}s）`;

        // 时间结束

        if(remaining <= 0 && !hasFollowup){

            clearInterval(countdown);

            await saveData(
                false,
                "",
                ""
            );

            alert("实验结束，感谢参与！");

            location.reload();
        }

    },1000);
}

// ======================
// 继续聊天
// ======================

continueBtn.addEventListener("click",()=>{

    clearInterval(countdown);

    input.disabled = false;

    sendBtn.disabled = false;

    input.focus();

    continueBtn.style.display = "none";
});

// ======================
// 原因按钮
// ======================

document
.querySelectorAll(".reason-btn")
.forEach(btn=>{

    btn.addEventListener("click",async ()=>{

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

){

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

    if(error){

        console.log(error);

        alert("数据库错误：" + error.message);

    }else{

        console.log("保存成功");
    }
}