// ==UserScript==
// @name         Let's panda!
// @namespace    https://github.com/Sean2525/Let-s-panda
// @author       sean2525, strong-Ting
// @description  A login, view, download tool for exhentai
// @license      MIT
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @include      https://exhentai.org/
// @include      https://exhentai.org/g/*
// @include      https://e-hentai.org/g/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.4/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM.getValue
// @connect      *
// @run-at       document-end
// @version      0.2.1
// ==/UserScript==

jQuery(function($) {
  /**
   * Output extension
   * @type {String} zip
   *                cbz
   *
   * Tips: Convert .zip to .cbz
   * Windows
   * $ ren *.zip *.cbz
   * Linux
   * $ rename 's/\.zip$/\.cbz/' *.zip
   */
  var outputExt = "zip"; // or 'cbz'

  /**
   * Multithreading
   * @type {Number} [1 -> 32]
   */
  var threading = 8;

  /**
   * Logging
   * @type {Boolean}
   */
  var debug = false;

  /**
   * Viewed
   * @type {Boolean}
   */
  var viewed = false;

  /**
   * Reverse images display in double
   * @type {Boolean}
   */
  var reverse = false;

  const loginPage = () => {
    let div = document.createElement("div");
    div.className = "main";
    let username = document.createElement("input");
    let style = document.createElement("style");
    style.innerHTML = `
.main {
display: -webkit-flex;
display: flex;
-webkit-flex-direction: column;
flex-direction: column;
-webkit-align-items: center;
align-items: center;
-webkit-justify-content: center;
justify-content: center;
height: ${window.innerHeight}px;
}
.flex-center{
display: -webkit-flex;
display: flex;
-webkit-align-items: center;
align-items: center;
-webkit-justify-content: center;
justify-content: center;
}
form {
display: -webkit-flex;
display: flex;
-webkit-flex-direction: column;
flex-direction: column;
-webkit-align-items: center;
align-items: center;
-webkit-justify-content: center;
justify-content: center;
}
.image {
position: relative;
margin: 0;
}
.input {
margin-top: 10px;
display: block;
height: 34px;
padding: 6px 12px;
font-size: 14px;
line-height: 1.42857143;
color: #555;
background-color: #fff;
background-image: none;
border: 1px solid #ccc;
border-radius: 4px;
-webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
-webkit-transition: border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;
-o-transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
}
.btn {
color: #fff;
background-color: #5cb85c;
border-color: #4cae4c;
margin-top: 10px;
display: inline-block;
font-weight: 400;
line-height: 1.25;
text-align: center;
white-space: nowrap;
vertical-align: middle;
-webkit-user-select: none;
-moz-user-select: none;
-ms-user-select: none;
user-select: none;
border: 1px solid transparent;
padding: .5rem 1rem;
font-size: 1rem;
border-radius: .25rem;
-webkit-transition: all .2s ease-in-out;
-o-transition: all .2s ease-in-out;
transition: all .2s ease-in-out;
}
`;
    $("head").append(style);
    const setCookie = headers => {
      //
      try {
        headers
          .split("\r\n")
          .find(x => x.match("cookie"))
          .replace("set-cookie: ", "")
          .split("\n")
          .map(
            x => (document.cookie = x.replace(".e-hentai.org", ".exhentai.org"))
          );
      } catch (err) {
        if (debug) console.log(err);
      }
      document.cookie =
        "yay=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.exhentai.org; path=/;";
      window.location.reload();
    };
    const clearCookie = () => {
      document.cookie =
        "yay=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.exhentai.org; path=/;";
      window.location.reload();
    };
    let form = document.createElement("form");
    let login = document.createElement("button");
    let wrapper = document.createElement("div");
    let loadding = document.createElement("img");
    let password = document.createElement("input");
    let error = document.createElement("p");
    error.innerHTML = `
if you can not login , go to <a target="_blank" href="https://forums.e-hentai.org/index.php?act=Login&CODE=00" style="color:red">here</a> login <br >
make sure login success, then click <button class="clearCookie">here</button>
`;
    error.style.color = "white";
    $("img")[0].className = "image";
    username.type = "text";
    username.className = "input";
    password.type = "password";
    password.className = "input";
    loadding.src =
      "data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==";
    loadding.style.position = "relative";
    loadding.hidden = true;
    login.addEventListener("click", () => {
      loadding.hidden = false;
      GM.xmlHttpRequest({
        method: "POST",
        url: "https://forums.e-hentai.org/index.php?act=Login&CODE=01",
        data: `referer=https://forums.e-hentai.org/index.php?&b=&bt=&UserName=${
          username.value
        }&PassWord=${password.value}&CookieDate=1"}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response) {
          if (debug) console.log(response);
          if (/You are now logged/.exec(response.responseText)) {
            setCookie(response.responseHeaders);
          }
          loadding.hidden = true;
        },
        onerror: function(err) {
          if (debug) console.log(err);
          loadding.hidden = true;
        }
      });
    });
    login.className = "btn";
    login.innerHTML = "Login";
    form.append(username);
    form.append(password);
    wrapper.className = "flex-center";
    wrapper.append(loadding);
    wrapper.append(login);
    form.append(wrapper);
    form.addEventListener("submit", e => {
      e.preventDefault();
    });
    div.append($("img")[0]);
    div.append(form);
    div.append(error);
    $("body").append(div);
    $(".clearCookie").on("click", clearCookie);
  };

  const downloadPage = () => {
    var zip = new JSZip(),
      doc = document,
      tit = doc.title,
      $win = $(window),
      loc = /.*\//.exec(doc.location.href)[0],
      prevZip = false,
      current = 0,
      images = [],
      total = 0,
      final = 0,
      hrefs = [],
      comicId = location.pathname.match(/\d+/)[0],
      download = document.createElement("p");

    const dlImg = ({ index, url }, success, error) => {
      var filename = url.replace(/.*\//g, "");
      var extension = filename.split(".").pop();
      filename = ("0000" + index).slice(-4) + "." + extension;
      if (debug) console.log(filename, "progress");
      GM.xmlHttpRequest({
        method: "GET",
        url: url,
        responseType: "arraybuffer",
        onload: function(response) {
          final++;
          success(response, filename);
        },
        onerror: function(err) {
          final++;
          error(err, filename);
        }
      });
    };

    const next = () => {
      download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#"> Downloading ${final}/${total}</a>`;
      if (debug) console.log(final, current);
      if (final < current) return;
      final < total ? addZip() : genZip();
    };

    const end = () => {
      $win.off("beforeunload");
      if (debug) console.timeEnd("eHentai");
    };

    const genZip = () => {
      zip
        .generateAsync({
          type: "blob"
        })
        .then(function(blob) {
          var zipName =
            tit.replace(/\s/g, "_") + "." + comicId + "." + outputExt;

          if (prevZip) window.URL.revokeObjectURL(prevZip);
          prevZip = blob;

          saveAs(blob, zipName);
          if (debug) console.log("COMPLETE");
          download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="${window.URL.createObjectURL(
            prevZip
          )}" download="${zipName}"> Download completed!</a>`;
          end();
        });
    };

    const addZip = () => {
      total = images.length;
      var max = current + threading;
      if (max > total) max = total;
      for (current; current < max; current++) {
        dlImg(
          images[current],
          function(response, filename) {
            zip.file(filename, response.response);
            if (debug) console.log(filename, "success");
            next();
          },
          function(err, filename) {
            zip.file(
              filename + "_" + comicId + "_error.gif",
              "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=",
              {
                base64: true
              }
            );
            if (debug) console.log(filename, "error");
            next();
          }
        );
      }
    };

    /**
     * Update image download status.
     */
    const getImageNext = () => {
      download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#">Getting images ${final}/${
        hrefs.length
      }</a>`;
      if (debug) console.log(final, current);
      if (final < current) return;
      final < hrefs.length
        ? getImage()
        : (() => {
            current = 0;
            final = 0;
            addZip();
          })();
    };

    /**
     * Get all images from hrefs.
     */
    const getImage = () => {
      let max = current + threading;
      if (max > hrefs.length) max = hrefs.length;
      for (current; current < max; current++) {
        if (debug) console.log(hrefs[current]);
        GM.xmlHttpRequest({
          method: "GET",
          url: hrefs[current],
          onload: function(response) {
            let imgNo = parseInt(
              response.responseText.match("startpage=(\\d+)").pop()
            );
            let img = new DOMParser()
              .parseFromString(response.responseText, "text/html")
              .querySelector("#img");
            if (debug) console.log(imgNo, "success");
            images.push({
              index: imgNo,
              url: img.src
            });
            final++;
            getImageNext();
          },
          onerror: function(err) {
            final++;
            getImageNext();
            if (debug) console.log(err);
          }
        });
      }
    };

    /**
     * Get the href of all images from all pages.
     */
    const getHref = () => {
      childNodes = document.querySelector("table[class=ptt] tbody tr")
        .childNodes;
      let page = parseInt(
        childNodes[childNodes.length - 2].textContent.replace(",", "")
      );
      for (let i = 0; i < page; i++) {
        GM.xmlHttpRequest({
          method: "GET",
          url: `${loc}?p=${i}`,
          onload: function(response) {
            if (debug)
              console.log(`page ${i + 1} detect ${response.responseText}`);
            let imgs = [
              ...new DOMParser()
                .parseFromString(response.responseText, "text/html")
                .querySelectorAll(".gdtm a")
            ];
            if (!imgs.length)
              imgs = [
                ...new DOMParser()
                  .parseFromString(response.responseText, "text/html")
                  .querySelectorAll(".gdtl a")
              ];
            if (!imgs.length) {
              alert(
                "There are some issue in the script\nplease open an issue on Github\nhttps://github.com/Sean2525/Let-s-panda/issues"
              );
            }
            imgs.forEach(v => {
              hrefs.push(v.href);
            });
            if (i == page - 1) {
              getImage();
            }
          },
          onerror: function(err) {
            download.innerHTML =
              '<img src="https://exhentai.org/img/mr.gif"> <a href="#">Get href failed</a>';
            if (i == page - 1) {
              getImage();
            }
            if (debug) console.log(err);
          }
        });
      }
    };

    download.className = "g3 gsp";
    download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a class="panda_download" href="#">Download</a>`;
    $("#gd5").append(download);
    $(".panda_download").on("click", () => {
      if (threading < 1) threading = 1;
      if (threading > 32) threading = 32;
      if (debug) console.time("eHentai");
      $win.on("beforeunload", function() {
        return "Progress is running...";
      });
      download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#">Start Download</a>`;
      getHref();
    });
  };

  function view() {
    viewed = true;
    var gdt = document.querySelector("#gdt");
    var gdd = document.querySelector("#gdd");
    var gdo4 = document.querySelector("#gdo4");

    var lpPage = document.querySelectorAll("table.ptt td").length - 2;

    var data = document
      .querySelector("body div.gtb p.gpc")
      .textContent.split(" ");

    var minPic = parseInt(data[1].replace(",", ""));
    var maxPic = parseInt(data[5].replace(",", ""));

    var imgNum = parseInt(
      gdd
        .querySelector("#gdd tr:nth-child(n+6) td.gdt2")
        .textContent.split(" ")[0]
    );

    var pagePic = maxPic - minPic + 1;

    var status = "false";
    viewer(
      document.querySelectorAll("table.ptt td").length - 2,
      imgNum,
      minPic,
      maxPic
    );

    async function viewer(lpPage, imgNum, minPic, maxPic) {
      var Gallery = function(pageNum, imgNum, minPic, maxPic) {
        this.pageNum = pageNum || 0;
        this.imgNum = imgNum || 0;
      };
      Gallery.prototype = {
        imgList: [],

        checkFunctional: function() {
          return (this.imgNum > 41 && this.pageNum < 2) || this.imgNum !== 0;
        },
        loadPageUrls: function(element) {
          [].forEach.call(element.querySelectorAll("a[href]"), function(item) {
            console.log("load work");
            var ajax = new XMLHttpRequest();
            ajax.onreadystatechange = async function() {
              if (4 == ajax.readyState && 200 == ajax.status) {
                var imgNo = parseInt(
                  ajax.responseText.match("startpage=(\\d+)").pop()
                );
                var src = new DOMParser()
                  .parseFromString(ajax.responseText, "text/html")
                  .getElementById("img").src;
                Gallery.prototype.imgList[imgNo - 1].src = src;

                if ((await GM.getValue("width")) == undefined) {
                  GM.setValue("width", "0.7");
                  console.log("set width:0.7");
                }

                if ((await GM.getValue("mode")) == undefined) {
                  GM.setValue("mode", "single");
                  console.log("set mode:single");
                }

                $("#gdt")
                  .find("img")
                  .css(
                    "width",
                    $(window).width() * (await GM.getValue("width"))
                  );
              }
            };
            ajax.open("GET", item.href);
            ajax.send(null);
          });
        },
        getNextPage: function() {
          var LoadPageUrls = this.loadPageUrls;
          var download = this.download_file;
          for (var i = 0; i < this.pageNum; ++i) {
            var ajax = new XMLHttpRequest();
            ajax.onreadystatechange = function() {
              if (4 == this.readyState && 200 == this.status) {
                var dom = new DOMParser().parseFromString(
                  this.responseText,
                  "text/html"
                );
                LoadPageUrls(dom.getElementById("gdt"));
              }
            };
            ajax.open("GET", location.href + "?p=" + i);
            ajax.send(null);
          }
        },
        claenGDT: function() {
          while (gdt.firstChild && gdt.firstChild.className)
            gdt.removeChild(gdt.firstChild);
        },

        generateImg: function(callback) {
          for (var i = 0; i < this.imgNum; i++) {
            if (i < maxPic && i >= minPic - 1) {
              var img = document.createElement("img");
              img.setAttribute("src", "http://ehgt.org/g/roller.gif");

              this.imgList.push(img);

              gdt.appendChild(img);
            } else {
              var img = document.createElement("img");
              this.imgList.push(img);
              //     gdt.appendChild(img); //cant load all
            }
          }

          gdt.style.textAlign = "center";
          gdt.style.maxWidth = "100%";

          gdo4.innerHTML = ""; //clear origin button(Normal Large)

          var style = document.createElement("style");
          style.type = "text/css";
          style.innerHTML = `
div#gdo4{
position:fixed;
width: 150px;
height:32px;
left:unset;
right:10px;
bottom:0px;
top:unset;
text-align:right;
z-index:1;
background:#34353b;
border-radius:5%;
}




.double {
font-weight: bold;
//    margin: 0 2px 4px 2px;
float: left;
border-radius: 5px;
height:32px;
width: 32px;
//border: 1px solid #989898;
//background: #4f535b;
background-image: url(https://raw.githubusercontent.com/Sean2525/Let-s-panda/master/icons/2_32.png);
}

.double:hover{
background: #4f535b;
background-image: url(https://raw.githubusercontent.com/Sean2525/Let-s-panda/master/icons/2_32.png);
}

.single{
font-weight: bold;
//   margin: 0 2px 4px 2px;
float: left;
border-radius: 5px;
height:32px;
width: 32px;
//border: 1px solid #989898;
// background: #4f535b;
background-image: url(https://raw.githubusercontent.com/Sean2525/Let-s-panda/master/icons/1_32.png);
}

.size_pic{
font-weight: bold;
//  margin: 0 2px 4px 2px;
float: left;
border-radius: 2px;
height:16px;
width: 16px;
//border: 1px solid #989898;
// background: #4f535b;
}

.single:hover{
background: #4f535b;
background-image: url(https://raw.githubusercontent.com/Sean2525/Let-s-panda/master/icons/1_32.png);

}

.size_btn {
height: 32px;
width: 32px;
border-radius: 100%;
//font-family: Arial;
color: #ffffff;
font-size: 16px;
background: #4f535b;
text-decoration: none;
}

.size_btn:hover {
background: #a9adb1;
text-decoration: none;
}
`;
          document.getElementsByTagName("head")[0].appendChild(style);

          //show

          var single_pic = document.createElement("div"); //create single button
          single_pic.className = "single";
          single_pic.innerHTML += "";
          gdo4.appendChild(single_pic);

          var double_pic = document.createElement("div"); //create double button
          double_pic.className = "double";
          double_pic.innerHTML = "";
          gdo4.appendChild(double_pic);

          var size_pic_add = document.createElement("button");
          size_pic_add.className = "size_btn";
          size_pic_add.innerHTML += "+";
          gdo4.appendChild(size_pic_add);

          var size_pic_reduce = document.createElement("button");
          size_pic_reduce.className = "size_btn";
          size_pic_reduce.innerHTML += "-";
          gdo4.appendChild(size_pic_reduce);

          /*
                              const wrap =(width)=>{
                                  let img = $('#gdt').find('img');

                                  for(let i = 0;i<img.length;i++){
                                      let wrap = document.createElement('wrap');
                                      wrap.innerHTML='<br>';
                                      if(width>0.5){
                                          gdt.insertBefore(wrap,img[i]);
                                      }
                                      else if(width<=0.5){
                                          if(i%2!==1){
                                              gdt.insertBefore(wrap,img[i]);
                                          }

                                      }
                                  }
                              }
          */

          document
            .getElementById("gdo4")
            .children[0] //when single button click change value of width
            .addEventListener("click", async function(event) {
              GM.setValue("width", "0.7");
              GM.setValue("mode", "single");
              pic_width(await GM.getValue("width"));
              $("wrap").remove();

              wrap(await GM.getValue("width"));
            });

          document
            .getElementById("gdo4")
            .children[1] //when double button click change value of width
            .addEventListener("click", async function(event) {
              GM.setValue("width", "0.48");
              GM.setValue("mode", "double");
              pic_width(await GM.getValue("width"));
              $("wrap").remove();

              wrap(await GM.getValue("mode"));
            });

          document
            .getElementById("gdo4")
            .children[2].addEventListener("click", async function(event) {
              var size_width = parseFloat(await GM.getValue("width"));
              if (size_width > 0.1 && size_width < 1.4) {
                size_width = size_width + 0.1;
                GM.setValue("width", size_width);
              }
              let _width = await GM.getValue("width");
              pic_width(_width);
              console.log(_width);
            });

          document
            .getElementById("gdo4")
            .children[3].addEventListener("click", async function(event) {
              var size_width = parseFloat(await GM.getValue("width"));
              if (size_width > 0.2 && size_width < 1.5) {
                size_width = size_width - 0.1;
                GM.setValue("width", size_width);
              }
              let _width = await GM.getValue("width");
              pic_width(_width);
              console.log(_width);
            });

          function pic_width(
            width //change width of pics
          ) {
            for (var i = maxPic - minPic + 1; i > 0; i--) {
              $("#gdt")
                .find("img")
                .css("width", $(window).width() * width);
            }
          }

          callback && callback();
        }
      };
      var g = new Gallery(lpPage, imgNum, minPic, maxPic);
      if (g.checkFunctional()) {
        g.generateImg(function() {
          g.loadPageUrls(gdt);
          g.claenGDT();
          // if (g.pageNum)
          //    g.getNextPage('load');
        });

        wrap(await GM.getValue("mode"));
      } else {
        alert(
          "There are some issue in the script\nplease open an issue on Github"
        );
        //window.open("https://github.com/strong-Ting/Gentle-Viewer/issues");
      }

      function download_files(lpPage, imgNum, minPic, maxPic) {
        console.log(lpPage, imgNum, minPic, maxPic);
        var download_obj = new Gallery(lpPage, imgNum, minPic, maxPic);
        download_obj.download();
      }
    }
  }
  const wrap = async width => {
    let img = $("#gdt").find("img");
    let gdt = document.getElementById("gdt");
    for (let i = 0; i < img.length; i++) {
      let wrap = document.createElement("wrap");
      wrap.innerHTML = "<br>";
      if ((await GM.getValue("mode")) == "single") {
        gdt.insertBefore(wrap, img[i]);
      } else if ((await GM.getValue("mode")) == "double") {
        if (i % 2 !== 1) {
          gdt.insertBefore(wrap, img[i]);
          if (reverse) {
            gdt.insertBefore(img[i + 1], img[i]);
          }
        }
      }
    }
  };
  const viewMode = async () => {
    var view_mode = await GM.getValue("view_mode", true);
    var view_btn = document.createElement("p");
    view_btn.className = "g2";
    view_btn.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a class="panda_view" style="color:#FF0000" href="#">Viewer ${
      view_mode ? "Enabled" : "Disabled"
    }</a>`;
    $("#gd5").append(view_btn);
    $(".panda_view").on("click", async () => {
      view_mode = await GM.getValue("view_mode", true);
      GM.setValue("view_mode", !view_mode);
      $(".panda_view").html(`Viewer ${!view_mode ? "Enable" : "Disable"}`);
      if (!view_mode && !viewed) view();
    });
    if (view_mode) {
      view();
    }
  };
  if ((e = $("img")).length === 1 && e[0].src === window.location.href) {
    loginPage();
  } else if (window.location.href.match(/^https:\/\/e[x-]hentai\.org\/g/)) {
    downloadPage();
    viewMode();
  }
});
