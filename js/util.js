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

/* --------------------------------------------
   Keep sticky offsets (side-nav, scroll target)
   perfectly in sync with the *real* rendered
   height of the sticky header, so nothing shifts
   position once you start scrolling.
   -------------------------------------------- */
function syncHeaderOffset(){
    const header = document.querySelector(".home-header");
    if (!header) return;

    const height = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--header-h", height + "px");
}

/* --------------------------------------------
   Size the "Exercises" side-nav to exactly fit
   its content (longest row) *plus* the real
   width of the vertical scrollbar, if/when one
   is needed - so text is never covered by it.

   On touch devices / trackpads the scrollbar is
   usually an "overlay" one that takes no layout
   space at all, so the measured width there is
   simply 0 and this has no effect - it only
   matters for desktop browsers with classic,
   space-reserving scrollbars.
   -------------------------------------------- */
function getScrollbarWidth(){
    const outer = document.createElement("div");
    outer.style.cssText = "visibility:hidden; overflow:scroll; position:absolute; top:-9999px; width:100px; height:100px;";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.remove();
    return scrollbarWidth;
}

function syncSideNavWidth(){
    const nav = document.querySelector(".notebook-side-nav");
    if (!nav) return;

    // Below the site's mobile breakpoint the side-nav becomes a
    // static, full-width block with no height cap (so no scrollbar
    // and no need for this calculation) - let CSS handle it instead.
    if (window.matchMedia("(max-width: 900px)").matches) {
        nav.style.width = "";
        return;
    }

    // Measure the width the nav would need with no scrollbar at all.
    nav.style.width = "max-content";
    const needsScrollbar = nav.scrollHeight > nav.clientHeight;
    const naturalWidth = Math.ceil(nav.getBoundingClientRect().width);
    const scrollbarWidth = needsScrollbar ? getScrollbarWidth() : 0;

    nav.style.width = (naturalWidth + scrollbarWidth + 2) + "px";
}

window.addEventListener("DOMContentLoaded", () => { syncHeaderOffset(); syncSideNavWidth(); });
window.addEventListener("load", () => { syncHeaderOffset(); syncSideNavWidth(); });
window.addEventListener("resize", () => { syncHeaderOffset(); syncSideNavWidth(); });
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { syncHeaderOffset(); syncSideNavWidth(); });
}

/* --------------------------------------------
   Notebook-page PDF viewer.

   Works generically on any page that uses the
   ".notebook-card" / ".notebook-links a" markup
   (exerciseHistoryAnalysis.html, exerciseHistoryAUD.html):
   clicking one of a card's PDF links opens a hidden,
   full-size "page" (between header and footer) styled
   like a notebook sheet, with:
     - a title area (exercise name + document name)
     - the PDF itself in an <iframe> below
     - colored index tabs on the left, one per PDF
       belonging to that same exercise, so you can
       switch documents without leaving the page.
   Closing it restores the normal side-nav + article list.
   -------------------------------------------- */
const PDF_TAB_COLORS = ["#ffd15c", "#8fd9a8", "#8fc7ff", "#f4a6c6", "#c9a9ff", "#ffb570"];
let pdfViewerScrollRestoreY = 0;

function getNotebookMain(){
    return document.querySelector(".home-main.notebook-layout");
}

function buildPdfViewer(){
    const existing = document.getElementById("pdfViewer");
    if (existing) return existing;

    const main = getNotebookMain();
    if (!main) return null;

    const viewer = document.createElement("div");
    viewer.className = "pdf-viewer";
    viewer.id = "pdfViewer";
    viewer.innerHTML =
        '<div class="pdf-viewer-page">' +
            '<div class="pdf-viewer-tabs" id="pdfViewerTabs"></div>' +
            '<div class="pdf-viewer-content">' +
                '<div class="pdf-viewer-head">' +
                    '<span class="pdf-viewer-breadcrumb" id="pdfViewerBreadcrumb"></span>' +
                    '<button type="button" class="pdf-viewer-close" aria-label="Close PDF viewer">✕ Close</button>' +
                '</div>' +
                '<div class="pdf-viewer-frame-wrap">' +
                    '<iframe id="pdfViewerFrame" class="pdf-viewer-frame" title="PDF document" src="about:blank"></iframe>' +
                '</div>' +
            '</div>' +
        '</div>';

    main.appendChild(viewer);
    viewer.querySelector(".pdf-viewer-close").addEventListener("click", closePdfViewer);
    return viewer;
}

function selectPdfTab(linkEl, btnEl){
    document.querySelectorAll(".pdf-tab-btn.active").forEach((b) => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");

    const card = linkEl.closest(".notebook-card");
    const exerciseName = card ? (card.getAttribute("data-tag") || "") : "";
    const docName = linkEl.textContent.trim();

    const breadcrumbEl = document.getElementById("pdfViewerBreadcrumb");
    const frameEl = document.getElementById("pdfViewerFrame");
    const pageEl = document.querySelector(".pdf-viewer-page");
    if (breadcrumbEl) breadcrumbEl.textContent = exerciseName + " > " + docName;
    if (frameEl) frameEl.src = linkEl.href;
    // The page's own border takes on the color of whichever tab is active.
    if (pageEl) pageEl.style.borderColor = btnEl ? btnEl.dataset.color : "";
}

function openPdfViewer(linkEl){
    const card = linkEl.closest(".notebook-card");
    if (!card) return;

    const viewer = buildPdfViewer();
    if (!viewer) return;

    const links = Array.from(card.querySelectorAll(".notebook-links a"))
        .filter((a) => !a.classList.contains("notebook-link-external"));

    const tabsEl = document.getElementById("pdfViewerTabs");
    tabsEl.innerHTML = "";
    let activeBtn = null;
    links.forEach((a, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pdf-tab-btn";
        const color = PDF_TAB_COLORS[index % PDF_TAB_COLORS.length];
        btn.style.borderColor = color;
        btn.dataset.color = color;
        btn.textContent = a.textContent.trim();
        btn.addEventListener("click", () => selectPdfTab(a, btn));
        tabsEl.appendChild(btn);
        if (a === linkEl) activeBtn = btn;
    });

    selectPdfTab(linkEl, activeBtn);

    // Remember where the user was in the exercise list so we can put
    // them back there on close, then jump to the top of the page so
    // the viewer's own scroll position never depends on how far down
    // the exercise list happened to be scrolled.
    pdfViewerScrollRestoreY = window.scrollY;

    const main = getNotebookMain();
    if (main) main.classList.add("pdf-viewer-active");
    viewer.classList.add("open");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    viewer.querySelector(".pdf-viewer-close").focus();
}

function closePdfViewer(){
    const main = getNotebookMain();
    if (main) main.classList.remove("pdf-viewer-active");

    const viewer = document.getElementById("pdfViewer");
    if (viewer) viewer.classList.remove("open");

    const frame = document.getElementById("pdfViewerFrame");
    if (frame) frame.src = "about:blank";

    window.scrollTo({ top: pdfViewerScrollRestoreY, left: 0, behavior: "auto" });
}

document.addEventListener("click", (event) => {
    const link = event.target.closest(".notebook-links a");
    if (!link || !link.closest(".notebook-card")) return;

    // Links explicitly marked as external (e.g. Kahoot, Codeforces) are
    // not documents to embed - let the browser handle them normally
    // (they already carry target="_blank" so they open in a new tab).
    if (link.classList.contains("notebook-link-external")) return;

    event.preventDefault();
    openPdfViewer(link);
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const viewer = document.getElementById("pdfViewer");
    if (viewer && viewer.classList.contains("open")) closePdfViewer();
});