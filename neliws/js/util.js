function jumpTo(targetId){
    console.log("Method jumpTo called with " + targetId);

    Array.from(document.getElementsByClassName("focused")).forEach((el) => el.classList.remove("focused"));
    const targetEl = document.querySelector(targetId);
    targetEl.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"}); 
    targetEl.classList.add("focused");
}

function jumpToAlgoPart(targetId){
    console.log("Method jumpToAlgoPart called with " + targetId);

    Array.from(document.getElementsByClassName("focusedTest")).forEach((el) => el.classList.remove("focusedTest"));
    const targetEl = document.querySelector(targetId);
    targetEl.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"}); 
    targetEl.classList.add("focusedTest");
}

function copyCode(targetId){
    console.log("Method copyCode called with " + targetId);
    const targetEl = document.querySelector(targetId);
    var copyText = targetEl.innerText;
    navigator.clipboard.writeText(copyText);

}