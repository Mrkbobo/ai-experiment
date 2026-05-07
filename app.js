const messages = document.getElementById("messages");

const input = document.getElementById("input");

const sendBtn = document.getElementById("sendBtn");

const submitBtn = document.getElementById("submitBtn");

const continueBtn = document.getElementById("continueBtn");

const finishBtn = document.getElementById("finishBtn");

const taskState = document.getElementById("taskState");

const analysisCard = document.getElementById("analysisCard");

const modal = document.getElementById("reasonModal");

let firstStage = true;

let hasFollowup = false;

// =====================
// 添加消息
// =====================

function addMessage(role,text){

    const div = document.createElement("div");

    div.className = "message " + role;

    div.innerHTML = `
        <div class="bubble">${text}</div>
    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}

// =====================
// 发送
// =====================

sendBtn.addEventListener("click",sendMessage);

input.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){

        sendMessage();
    }
});

// =====================
// 主发送逻辑
// =====================

function sendMessage(){

    const text = input.value.trim();

    if(!text) return;

    addMessage("user",text);

    input.value = "";

    // 第一次提问
    if(firstStage){

        firstStage = false;

        addMessage(
            "assistant",
`给你生成的还钱提醒话术如下：

哈喽，最近手头有点紧，突然想起之前借你的5000块钱，当初约定的还款日期已经过了一个月啦，你看最近方便把钱还我不？

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

        taskState.innerHTML = `
            AI 已生成内容，
            请先完成任务后再继续。
        `;

        submitBtn.style.display = "block";

        return;
    }

    // 第二阶段追问

    hasFollowup = true;

    addMessage(
        "assistant",
        "好的，我来进一步帮你优化。"
    );

    modal.style.display = "flex";
}

// =====================
// 提交任务
// =====================

submitBtn.addEventListener("click",()=>{

    submitBtn.style.display = "none";

    analysisCard.style.display = "block";

    taskState.innerHTML = `
        当前任务已提交 ✔
    `;
});

// =====================
// 继续聊天
// =====================

continueBtn.addEventListener("click",()=>{

    input.disabled = false;

    sendBtn.disabled = false;

    input.focus();
});

// =====================
// 结束实验
// =====================

finishBtn.addEventListener("click",()=>{

    alert("实验结束，请联系研究者领取报酬。");
});

// =====================
// 原因按钮
// =====================

document
.querySelectorAll(".reason-btn")
.forEach(btn=>{

    btn.addEventListener("click",()=>{

        modal.style.display = "none";

        alert("数据已记录，感谢参与！");
    });
});