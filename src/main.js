// ==UserScript==
// @name         Let's panda!
// @namespace    https://github.com/Sean2525/Let-s-panda
// @author       sean2525, strong-Ting
// @description  A login, view, download tool for exhentai & e-hentai
// @description:zh-tw 一個用於exhentai和e-hentai的登入、查看、下載的工具
// @description:zh-cn 一个用于exhentai和e-hentai的登录、查看、下载的工具
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
// @grant        GM_notification
// @grant        GM.notification
// @connect      *
// @run-at       document-end
// @version      0.2.25
// ==/UserScript==

jQuery(function ($) {
  /**
   * Output extension
   * @type {String} zip
   *                cbz
   *
   */
  var outputExt = "zip"; // or 'cbz'

  /**
   * Download full image or resized image
   * @type {String} full
   *                resized
   * 
   * "full" image is the original image, which is usually larger than "resized" image.
   */
  var outputImgSrc = "full"; // or 'resized'

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


  var viewed = false;

  const getCurrPageImgUrl = (response) => {
    let imgs = [
      ...new DOMParser()
        .parseFromString(response.responseText, "text/html")
        .querySelectorAll(".gt200 a"),
    ];

    if (!imgs.length) {
      imgs = [
        ...new DOMParser()
          .parseFromString(response.responseText, "text/html")
          .querySelectorAll(".gt100 a"),
      ];
    }
    if (!imgs.length) {
      imgs = [
        ...new DOMParser()
          .parseFromString(response.responseText, "text/html")
          .querySelectorAll(".gdtm a"),
      ];
    }
    if (!imgs.length) {
      imgs = [
        ...new DOMParser()
          .parseFromString(response.responseText, "text/html")
          .querySelectorAll(".gdtl a"),
      ];
    }
    if (!imgs.length) {
      imgs = [
        ...new DOMParser()
          .parseFromString(response.responseText, "text/html")
          .querySelectorAll("#gdt a"),
      ];
    }
    if (!imgs.length) {
      alert(
        "There are some issue in the script\nplease open an issue on Github\nhttps://github.com/MinoLiu/Let-s-panda/issues"
      );
    }
    return imgs;
  }

  const loginPage = () => {
    let div = document.createElement("div");
    div.className = "main";
    let username = document.createElement("input");
    let style = document.createElement("style");
    style.innerHTML = `
body {
 background-color: #212121;
}
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
.btn:hover {
  background-color: #4da64d;
}
.btn-blue {
  color: #fff;
  background-color: #3832dd;
  border-color: #3832dd;
  display: inline-block;
  font-weight: 400;
  line-height: 1.0;
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
.btn-blue:hover {
  background-color: #1c15c8;
}
`;
    $("head").append(style);
    const setCookie = (headers) => {
      //
      try {
        headers
          .split("\r\n")
          .find((x) => x.match("cookie"))
          .replace("set-cookie: ", "")
          .split("\n")
          .map(
            (x) =>
              (document.cookie = x.replace(".e-hentai.org", ".exhentai.org") + " secure")
          );
      } catch (err) {
        if (debug) console.log(err);
      }
      document.cookie =
        "yay=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.exhentai.org; path=/; secure";

      setTimeout(function () { window.location.reload() }, 3000);
    };
    const clearCookie = () => {
      if (debug) console.log("Clearning cookies");
      document.cookie =
        "yay=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.exhentai.org; path=/; secure";
      window.location.reload();
    };
    let form = document.createElement("form");
    let login = document.createElement("button");
    let wrapper = document.createElement("div");
    let loadding = document.createElement("img");
    let password = document.createElement("input");
    username.placeholder = "Username"
    password.placeholder = "Password"
    let info = document.createElement("p");
    let error = document.createElement("p");
    info.innerHTML = `
    <center>
    If you can't log in, please visit the <a target="_blank" href="https://forums.e-hentai.org/index.php?act=Login&CODE=00"  class='btn-blue'>Forums</a> and log in from there. <br >
Please make sure you are logged in successfully and then click this <button class="clearCookie btn-blue">button</button>
    </center>
`;
    info.style.color = "white";
    username.type = "text";
    username.className = "input";
    password.type = "password";
    password.className = "input";
    loadding.src =
      "data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==";
    loadding.style.position = "relative";
    info.hidden = true;
    loadding.hidden = true;
    login.addEventListener("click", () => {
      loadding.hidden = false;
      GM.xmlHttpRequest({
        method: "POST",
        url: "https://forums.e-hentai.org/index.php?act=Login&CODE=01",
        data: `referer=https://forums.e-hentai.org/index.php?&b=&bt=&UserName=${username.value}&PassWord=${password.value}&CookieDate=1"}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        onload: function (response) {
          if (debug) console.log(response);
          if (/You are now logged/.exec(response.responseText)) {
            error.style = "color:green";
            error.innerText = "Login succeeded: you will be redirected to exhentai.org in 3 seconds, if you can't access exhentai, don't use private browsing. "
            GM.notification("You will be redirected to exhentai.org in 3 seconds; if you can't access exhentai, don't use private browsing", "Login succeeded");
            setCookie(response.responseHeaders);
          } else if (/IF YOU DO NOT SEE THE CAPTCHA/.exec(response.responseText)) {
            error.style = "color:red";
            error.innerText = "Login failed: Please visit the forums directly and log in from there; reCaptcha has been enabled."
          }
          else {
            error.style = "color:red";
            error.innerText = "Login failed: Please check that your username and password are correct.";
          }
          info.hidden = false;
          loadding.hidden = true;
        },
        onerror: function (err) {
          console.error(err);
          error.style = "color:red";
          error.innerText("Login got error: Please contact me at https://github.com/MinoLiu/Let-s-panda/issues");
          loadding.hidden = true;
        },
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
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
    var image = document.createElement("img");
    image.className = "image";
    image.src = "https://i.imgur.com/oX86mGf.png"
    div.append(image);
    div.append(form);
    div.append(error);
    div.append(info);
    $("body").append(div);
    $(".clearCookie").on("click", clearCookie);
  };

  const downloadPage = () => {
    var zip = new JSZip(),
      doc = document,
      tit = doc.title,
      $win = $(window),
      loc = /https?:\/\/e[x-]hentai\.org\/g\/\d+\/\w+/.exec(doc.location.href)[0],
      prevZip = false,
      current = 0,
      images = [],
      total = 0,
      final = 0,
      failed = 0,
      hrefs = [],
      comicId = location.pathname.match(/\d+/)[0],
      download = document.createElement("p");

    const dlImg = ({ index, url, _ }, success, error) => {
      var filename = url.replace(/.*\//g, "");
      var extension = filename.split(".").pop();
      filename = ("0000" + index).slice(-4) + "." + extension;
      if (debug) console.log(filename, "progress");
      GM.xmlHttpRequest({
        method: "GET",
        url: url,
        responseType: "arraybuffer",
        onload: function (response) {
          final++;
          success(response, filename);
        },
        onerror: function (err) {
          final++;
          error(err, filename);
        },
      });
    };

    const next = () => {
      download.innerHTML = `<span style="margin-left:10px;">▶</span> <a href="#"> Downloading ${final}/${total}</a>`;
      if (debug) console.log(final, current);
      if (final < current) return;
      final < total ? addZip() : genZip();
    };

    const end = () => {
      $win.off("beforeunload");
      if (failed > 0) {
        alert("Some pages download failed, please unzip and check!");
      }
      if (debug) console.timeEnd("eHentai");
    };

    const genZip = () => {
      zip
        .generateAsync({
          type: "blob",
        })
        .then(function (blob) {
          var zipName =
            tit.replace(/\s/g, "_") + "." + comicId + "." + outputExt;

          if (prevZip) window.URL.revokeObjectURL(prevZip);
          prevZip = blob;

          saveAs(blob, zipName);
          if (debug) console.log("COMPLETE");
          download.innerHTML = `<span style="margin-left:10px;">▶</span> <a href="${window.URL.createObjectURL(
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
        let _href = images[current];
        dlImg(
          _href,
          function (response, filename) {
            zip.file(filename, response.response);
            if (debug) console.log(filename, "image success");
            next();
          },
          function (err, filename) {
            final--;
            // retry backupUrl for once
            GM.xmlHttpRequest({
              method: "GET",
              url: _href.backupUrl,
              onload: function (response) {
                let imgNo = parseInt(
                  response.responseText.match("startpage=(\\d+)").pop()
                );
                let img = new DOMParser()
                  .parseFromString(response.responseText, "text/html")
                  .querySelector("#img");
                if (debug) console.log(imgNo, "backupUrl success");
                _href.url = img.src;
                dlImg(
                  _href,
                  function (response, filename) {
                    zip.file(filename, response.response);
                    if (debug) console.log(filename, "backupUrl image success");
                    next();
                  },
                  function (err, filename) {
                    failed++;
                    zip.file(
                      filename + "_" + comicId + "_error.gif",
                      "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=",
                      {
                        base64: true,
                      }
                    );
                    if (debug) console.log(filename, "backupUrl image error");
                    next();
                  }
                );
              },
              onerror: function (err, filename) {
                dlImg(
                  _href,
                  function (response, filename) {
                    zip.file(filename, response.response);
                    if (debug) console.log(filename, "retry image success");
                    next();
                  },
                  function (err, filename) {
                    failed++;
                    zip.file(
                      filename + "_" + comicId + "_error.gif",
                      "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=",
                      {
                        base64: true,
                      }
                    );
                    if (debug) console.log(filename, "retry url error");
                    next();
                  }
                );
              }
            });
          }
        );
      }
    };

    /**
     * Update image download status.
     */
    const getImageNext = () => {
      download.innerHTML = `<span style="margin-left:10px;">▶</span> <a href="#">Getting images ${final}/${hrefs.length}</a>`;
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
        let href = hrefs[current];
        GM.xmlHttpRequest({
          method: "GET",
          url: hrefs[current],
          onload: function (response) {
            let imgNo = parseInt(
              response.responseText.match("startpage=(\\d+)").pop()
            );
            let img = new DOMParser()
              .parseFromString(response.responseText, "text/html")
              .querySelector("#img");
            if (debug) console.log(imgNo, "url success");
            let src = href + "?nl=" + /nl\(\'(.*)\'\)/.exec(img.attributes.onerror.value)[1];
            let links = new DOMParser()
              .parseFromString(response.responseText, "text/html")
              .querySelectorAll("a");
            let imgSrc = img.src;

            // Check if the image is resized or full
            if (outputImgSrc != "resized") {
              // If the user wants the full image, find the full image link and replace imgSrc with it
              links.forEach(link => {
                if (link.href.includes("fullimg")) {
                  imgSrc = link.href;
                }
              });
            }

            images.push({
              index: imgNo,
              url: imgSrc,
              backupUrl: src,
            });
            final++;
            getImageNext();
          },
          onerror: function (err) {
            final++;
            getImageNext();
            if (debug) console.log(err);
          },
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
          onload: function (response) {
            if (debug)
              console.log(`page ${loc}?p=${i} detect ${response.responseText}`);
            let imgs = getCurrPageImgUrl(response);
            imgs.forEach((v) => {
              hrefs.push(v.href);
            });
            if (i == page - 1) {
              getImage();
            }
          },
          onerror: function (err) {
            download.innerHTML =
              '<span style="margin-left:10px;">▶</span> <a href="#">Get href failed</a>';
            if (i == page - 1) {
              getImage();
            }
            if (debug) console.log(err);
          },
        });
      }
    };

    download.className = "g3";
    download.innerHTML = `<span style="margin-left:10px;">▶</span> <a class="panda_download" href="#">Download</a>`;
    $("#gd5").append(download);
    $(".panda_download").on("click", () => {
      if (threading < 1) threading = 1;
      if (threading > 32) threading = 32;
      if (debug) console.time("eHentai");
      $win.on("beforeunload", function () {
        return "Progress is running...";
      });
      download.innerHTML = `<span style="margin-left:10px;">▶</span> <a href="#">Start Download</a>`;
      getHref();
    });
  };


  function view() {
    viewed = true;
    if (threading < 1) threading = 1;
    if (threading > 32) threading = 32;
    var gdt = document.querySelector("#gdt");
    var gdd = document.querySelector("#gdd");
    var gdo4 = document.createElement("div");
    gdo4.setAttribute("id", "gdo4");
    $("body").append(gdo4);

    let childNodes = document.querySelector("table[class=ptt] tbody tr")
      .childNodes;
    let lpPage = parseInt(
      childNodes[childNodes.length - 2].textContent.replace(",", "")
    );

    var data = document
      .querySelector("body div.gtb p.gpc")
      .textContent.split(" ");

    var minPic = parseInt(data[1].replace(",", ""));
    var maxPic = parseInt(data[3].replace(",", ""));

    var imgNum = parseInt(
      gdd
        .querySelector("#gdd tr:nth-child(n+6) td.gdt2")
        .textContent.split(" ")[0]
    );


    viewer(lpPage, imgNum, minPic, maxPic);

    async function viewer(lpPage, imgNum, minPic, maxPic) {
      var Gallery = function (pageNum, imgNum, minPic, maxPic) {
        this.pageNum = pageNum || 0;
        this.imgNum = imgNum || 0;
        this.loc = /https?:\/\/e[x-]hentai\.org\/g\/\d+\/\w+/.exec(location.href)[0];
        this.padding = false;
        this.current = 0;
        this.final = 0;
      };
      var viewAll = await GM.getValue("view_all", true);
      Gallery.prototype = {
        imgHref: [],
        imgList: [],
        retry: 0,
        getAllHref: function (nextID) {
          if (nextID >= this.pageNum) {
            this.loadNextImage();
            return;
          }
          var that = this;
          GM.xmlHttpRequest({
            method: "GET",
            url: `${this.loc}?p=${nextID}`,
            onload: function (response) {
              if (debug)
                console.log(`page ${that.loc}?p=${nextID} detect ${response.responseText}`);
              let imgs = getCurrPageImgUrl(response);
              imgs.forEach((v) => {
                that.imgHref.push(v.href);
              });
              that.getAllHref(nextID + 1);
            },
            onerror: function (err) {
              if (debug) console.log(err);
              that.retry++;
              if (that.retry > 2) {
                alert(`Page number ${nextID + 1} load failed for 3 times.`);
                that.getAllHref(nextID + 1);
              } else {
                that.getAllHref(nextID);
              }
            },
          });
        },
        getHref: function (pageID) {
          var that = this;
          GM.xmlHttpRequest({
            method: "GET",
            url: `${this.loc}?p=${pageID}`,
            onload: function (response) {
              if (debug)
                console.log(`page ${that.loc}?p=${pageID} detect ${response.responseText}`);
              let imgs = getCurrPageImgUrl(response);
              imgs.forEach((v) => {
                that.imgHref.push(v.href);
              });
              that.loadNextImage();
            },
            onerror: function (err) {
              if (debug) console.log(err);
              that.retry++;
              if (that.retry > 2) {
                alert(`Page number ${nextID + 1} load failed for 3 times.`);
                that.loadNextImage();
              } else {
                that.getHref(nextID);
              }
            },
          });
        },
        checkFunctional: function () {
          return (this.imgNum > 41 && this.pageNum < 2) || this.imgNum !== 0;
        },
        loadNextImage: function () {
          if (this.final < this.current) {
            return;
          }
          this.loadPageUrls();
        },
        onSucceed: async function (response, href) {
          let imgNo = parseInt(
            response.responseText.match("startpage=(\\d+)").pop()
          );
          let img = new DOMParser()
            .parseFromString(response.responseText, "text/html")
            .querySelector("#img");
          if (debug) console.log(imgNo, "success");
          let src = href + "?nl=" + /nl\(\'(.*)\'\)/.exec(img.attributes.onerror.value)[1];
          Gallery.prototype.imgList[imgNo - 1].setAttribute(
            "data-href",
            src
          );

          let timeoutId;
          let timeoutDuration = 10000; // 10s

          timeoutId = setTimeout(function () {
            // timeout trigger error
            Gallery.prototype.imgList[imgNo - 1].childNodes[0].dispatchEvent(new Event('error'));
          }, timeoutDuration);

          $(Gallery.prototype.imgList[imgNo - 1].childNodes[0]).on("load", function () {
            // success clear timeoutId
            clearTimeout(timeoutId);
          });

          $(Gallery.prototype.imgList[imgNo - 1].childNodes[0]).on(
            "error",
            function () {
              var ajax = new XMLHttpRequest();
              ajax.onreadystatechange = async function () {
                if (debug) {
                  console.log(`Failed load ${Number(imgNo)}, getting backup image from ${src}.`);
                }
                if (4 == ajax.readyState && 200 == ajax.status) {
                  var _imgNo = parseInt(
                    ajax.responseText.match("startpage=(\\d+)").pop()
                  );
                  var imgDom = new DOMParser()
                    .parseFromString(ajax.responseText, "text/html")
                    .getElementById("img");
                  Gallery.prototype.imgList[_imgNo - 1].childNodes[0].src =
                    imgDom.src;
                }
              };
              ajax.open("GET", src);
              ajax.send(null);
            }
          );

          Gallery.prototype.imgList[imgNo - 1].childNodes[0].src = img.src;

          this.loadNextImage();
        },
        onFailed: function (err, href) {
          GM.xmlHttpRequest({
            method: "GET",
            url: href,
            responseType: "document",
            onload: function (response) {
              that.onSucceed(response, href);
            },
            onerror: function (err) {
              if (debug) console.log(err);
              this.loadNextImage();
            },
          });
        },
        loadPageUrls: function () {
          if (debug) {
            console.log("load work");
          }
          let max = threading + this.current > this.imgHref.length ? this.imgHref.length : threading + this.current;
          for (this.current; this.current < max; this.current++) {
            let that = this;
            let href = this.imgHref[this.current];
            GM.xmlHttpRequest({
              method: "GET",
              url: href,
              responseType: "arraybuffer",
              onload: function (response) {
                that.final++;
                that.onSucceed(response, href);
              },
              onerror: function (err) {
                if (debug) console.log(err);
                that.final++;
                that.onFailed(err, href);
              },
            });
          }
        },
        cleanGDT: function () {
          while (gdt.firstChild && gdt.firstChild.className)
            gdt.removeChild(gdt.firstChild);
        },

        generateImg: function (callback) {
          for (var i = 0; i < this.imgNum; i++) {
            if (i < maxPic && i >= minPic - 1) {
              var img = document.createElement("img");
              var a = document.createElement("a");
              img.setAttribute("src", "https://ehgt.org/g/roller.gif");
              img.setAttribute("loadding", "lazy");
              a.appendChild(img);
              this.imgList.push(a);

              gdt.appendChild(a);
            } else {
              var img = document.createElement("img");
              var a = document.createElement("a");

              img.setAttribute("src", "https://ehgt.org/g/roller.gif");
              img.setAttribute("loadding", "lazy");
              a.appendChild(img);

              this.imgList.push(a);
              if (viewAll) gdt.appendChild(a);
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
width: 212px;
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
background-image: url(https://raw.githubusercontent.com/MinoLiu/Let-s-panda/master/icons/2_32.png);
}

.double:hover{
background: #4f535b;
background-image: url(https://raw.githubusercontent.com/MinoLiu/Let-s-panda/master/icons/2_32.png);
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
background-image: url(https://raw.githubusercontent.com/MinoLiu/Let-s-panda/master/icons/1_32.png);
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
background-image: url(https://raw.githubusercontent.com/MinoLiu/Let-s-panda/master/icons/1_32.png);

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


.pad_pic {
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

          var pad_pic = document.createElement("button");
          pad_pic.className = "pad_pic";
          pad_pic.innerHTML += "p";
          gdo4.appendChild(pad_pic);

          var full_pic = document.createElement("button");
          full_pic.className = "pad_pic";
          full_pic.innerHTML += "f";
          gdo4.appendChild(full_pic);

          var size_pic_reduce = document.createElement("button");
          size_pic_reduce.className = "size_btn";
          size_pic_reduce.innerHTML += "-";
          gdo4.appendChild(size_pic_reduce);

          var size_pic_add = document.createElement("button");
          size_pic_add.className = "size_btn";
          size_pic_add.innerHTML += "+";
          gdo4.appendChild(size_pic_add);

          document
            .getElementById("gdo4")
            .children[0] //when single button click change value of width
            .addEventListener("click", async function (event) {
              await GM.setValue("width", "0.7");
              await GM.setValue("mode", "single");
              await pic_width(await GM.getValue("width"));
              $("wrap").remove();

              wrap(await GM.getValue("width"));
            });

          document
            .getElementById("gdo4")
            .children[1] //when double button click change value of width
            .addEventListener("click", async function (event) {
              await GM.setValue("width", "0.49");
              await GM.setValue("mode", "double");
              let view_reverse = await GM.getValue("view_reverse", true);
              GM.setValue("view_reverse", !view_reverse);
              await pic_width(await GM.getValue("width"));
              $("wrap").remove();

              wrap(await GM.getValue("mode"));
            });

          var pad_img = document.createElement("img");
          var pad_a = document.createElement("a");
          pad_a.appendChild(pad_img);

          document
            .getElementById("gdo4")
            .children[2].addEventListener("click", async (event) => {
              this.padding = !this.padding;
              const view_reverse = await GM.getValue("view_reverse", true);
              await GM.setValue("view_reverse", false);
              $("wrap").remove();
              await wrap(await GM.getValue("mode"));
              $("wrap").remove();
              if (this.padding) {
                this.imgList.unshift(pad_a);
                gdt.insertBefore(pad_a, gdt.firstChild);
              } else {
                this.imgList.shift();
                gdt.removeChild(pad_a);
              }
              await GM.setValue("view_reverse", view_reverse);
              await wrap(await GM.getValue("mode"));
            });

          document
            .getElementById("gdo4")
            .children[3].addEventListener("click", async function (event) {
              await GM.setValue("full_image", true);
              await pic_width(0);
            });

          document
            .getElementById("gdo4")
            .children[4].addEventListener("click", async function (event) {
              await GM.setValue("full_image", false);
              var size_width = parseFloat(await GM.getValue("width"));
              if (size_width > 0.2 && size_width < 1.5) {
                size_width = size_width - 0.1;
                GM.setValue("width", size_width);
              }
              let _width = await GM.getValue("width");
              await pic_width(_width);
              console.log(_width);
            });

          document
            .getElementById("gdo4")
            .children[5].addEventListener("click", async function (event) {
              await GM.setValue("full_image", false);
              var size_width = parseFloat(await GM.getValue("width"));
              if (size_width > 0.1 && size_width < 1.4) {
                size_width = size_width + 0.1;
                GM.setValue("width", size_width);
              }
              let _width = await GM.getValue("width");
              await pic_width(_width);
              console.log(_width);
            });

          async function pic_width(
            width //change width of pics
          ) {
            for (var i = maxPic - minPic + 1; i > 0; i--) {
              await resizeImg(width);
            }
          }

          callback && callback();
        },
      };
      var g = new Gallery(lpPage, imgNum, minPic, maxPic);

      if (g.checkFunctional()) {
        var viewAll = await GM.getValue("view_all", true);
        g.generateImg(function () {
          if (g.pageNum && viewAll) {
            g.getAllHref(0);
          } else {
            g.getHref(Number(document.querySelector("td.ptds").childNodes[0].text) - 1);
          }
          g.cleanGDT();
        });

        document.addEventListener("keydown", (e) => {
          let nextImg = null;

          // Check if the current focus is on an input or textarea element
          if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
            return;
          }

          // ignore key combinations
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
            return;
          }

          if (e.code === "ArrowUp" || e.code === "KeyW") {
            for (let i = g.imgList.length - 1; i >= 0; i--) {
              const img = g.imgList[i].childNodes[0];
              const rect = img.getBoundingClientRect();
              if (rect.top < -1) {
                nextImg = img;
                break;
              }
            }
          }

          if (e.code === "ArrowDown" || e.code === "Space" || e.code === "KeyS") {
            for (let i = 0; i < g.imgList.length; i++) {
              const img = g.imgList[i].childNodes[0];
              const rect = img.getBoundingClientRect();
              if (rect.top > 1) {
                nextImg = img;
                break;
              }
            }
          }

          if (nextImg !== null) {
            e.preventDefault();
            window.scrollTo({
              top: nextImg.offsetTop,
            });
          }
        })

        document.addEventListener("keydown", async (e) => {
          // ignore key combinations
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) {
            return;
          }
          // Check if the current focus is on an input or textarea element
          if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
            return;
          }


          var view_all = await GM.getValue("view_all", true);

          if (view_all === true) {
            return;
          }


          if (e.code === "ArrowLeft" || e.code === "KeyA") {
            e.preventDefault();
            childNodes[0].click();
          }

          if (e.code === "ArrowRight" || e.code === "KeyD") {
            e.preventDefault();
            childNodes[childNodes.length - 1].click();
          }
        })

        await wrap(await GM.getValue("mode"));
      } else {
        alert(
          "There are some issue in the script\nplease open an issue on Github\nhttps://github.com/MinoLiu/Let-s-panda/issues"
        );
      }
    }
  }

  var switchWrap = false;

  const wrap = async (width) => {
    let img = $("#gdt").find("a");
    let gdt = document.getElementById("gdt");
    if (switchWrap == true) {
      for (let i = 0; i < img.length - 1; i++) {
        if (i % 2 !== 1) {
          gdt.insertBefore(img[i + 1], img[i]);
        }
      }
      switchWrap = false;
    }

    if ((await GM.getValue("width")) == undefined) {
      await GM.setValue("width", "0.49");
      console.log("set width:0.49");
    }

    if ((await GM.getValue("mode")) == undefined) {
      await GM.setValue("mode", "double");
      console.log("set mode:double");
    }
    if ((await GM.getValue("view_reverse")) == undefined) {
      await GM.setValue("view_reverse", true);
      console.log("set view_reverse:true");
    }


    img = $("#gdt").find("a");
    let view_reverse = (await GM.getValue("view_reverse", true));
    for (let i = 0; i < img.length; i++) {
      let wrap = document.createElement("wrap");
      wrap.innerHTML = "<br>";
      if ((await GM.getValue("mode")) == "single") {
        gdt.insertBefore(wrap, img[i]);
      } else if ((await GM.getValue("mode")) == "double") {
        if (i % 2 !== 1) {
          gdt.insertBefore(wrap, img[i]);
          if (view_reverse && i != img.length - 1) {
            switchWrap = true;
            gdt.insertBefore(img[i + 1], img[i]);
          }
        }
      }
    }

    await resizeImg(await GM.getValue("width"));
  };

  const resizeImg = async (width) => {
    const full_image = (await GM.getValue("full_image"));
    if (full_image == true) {
      $("#gdt")
        .find("img")
        .css({ "height": "100vh", "width": "auto" });
    } else {
      $("#gdt")
        .find("img")
        .css({ "height": "auto", "width": $(window).width() * width });
    }
  }

  const adjustGmid = () => {
    var height = $("#gd5").outerHeight(true);
    height = height >= 330 ? height : 330;
    $("#gmid").height(height);
    $("#gd4").height(height);
  };

  const viewAllMode = async () => {
    var view_all_btn = document.createElement("p");
    var view_all = await GM.getValue("view_all", true);

    view_all_btn.className = "g3";
    view_all_btn.innerHTML = `<span style="margin-left:10px;">▶</span> <a class="panda_view_all" href="#">Viewer page(s): ${view_all ? "All" : "One"}</a>`;
    $("#gd5").append(view_all_btn);

    $(".panda_view_all").on("click", async () => {
      view_all = await GM.getValue("view_all", true);
      GM.setValue("view_all", !view_all);
      $(".panda_view_all").html(
        `Viewer page(s): ${view_all ? "All" : "One"}`
      );
      window.location.reload(true);
    });

    adjustGmid();
  };
  const viewMode = async () => {
    var view_mode = await GM.getValue("view_mode", true);
    var view_btn = document.createElement("p");
    view_btn.className = "g3";
    view_btn.innerHTML = `<span style="margin-left:10px;">▶</span> <a class="panda_view" href="#">Viewer ${view_mode ? "Enabled" : "Disabled"
      }</a>`;

    $("#gd5").append(view_btn);

    $(".panda_view").on("click", async () => {
      view_mode = await GM.getValue("view_mode", true);
      GM.setValue("view_mode", !view_mode);
      $(".panda_view").html(`Viewer ${!view_mode ? "Enabled" : "Disabled"}`);
      if (view_mode) {
        window.location.reload();
      }
      if (!view_mode && !viewed) {
        viewAllMode();
        // Stop image loadding for thumbnails.
        var imageToStop = document.querySelector("#gdt").querySelectorAll("a");
        // Clear .gt200
        document.querySelector("#gdt").removeAttribute("class");
        imageToStop.forEach((img, key) => {
          img.remove();
        })
        view();
      }
    });

    if (view_mode) {
      viewAllMode();
    }

    adjustGmid();
    if (view_mode) {
      // Stop image loadding for thumbnails.
      var imageToStop = document.querySelector("#gdt").querySelectorAll("a");
      // Clear class for #gdt
      document.querySelector("#gdt").removeAttribute("class");
      imageToStop.forEach((img) => {
        img.remove();
      })
      view();
    }
  };

  if ((e = $("img")).length === 0 && (e = $("dev")).length === 0) {
    loginPage();
  } else if (window.location.href.match(/^https:\/\/e[x-]hentai\.org\/g/)) {
    downloadPage();
    viewMode();
  }
});
