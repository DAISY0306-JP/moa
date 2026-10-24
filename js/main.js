dailySnap();
view==="book"?bookView():view==="write"?writeView():view==="gram"?gramView():view==="log"?logView():home();
if(tabScroll[view]) scrollTo(0,tabScroll[view]);

// オフラインでも開けるように（GitHub Pages など https のときだけ）
if("serviceWorker" in navigator && location.protocol==="https:"){
  addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
