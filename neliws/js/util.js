function jumpTo(targetId){
    console.log("Method jumpTo called with " + targetId);

    Array.from(document.getElementsByClassName("focused")).forEach((el) => el.classList.remove("focused"));
    const targetEl = document.querySelector(targetId);
    targetEl.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"}); 
    targetEl.classList.add("focused");
}