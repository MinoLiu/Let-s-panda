// ==UserScript==
// @name         Let's panda!
// @namespace    Let-s-panda
// @author       sean2525, strong-Ting
// @description  A login, view, download tool for exhentai
// @license      MIT
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @include      https://exhentai.org/
// @include      https://exhentai.org/g/*
// @include      https://e-hentai.org/g/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.4/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-end
// @version      0.0.2
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
    var outputExt = 'cbz'; // or 'zip'

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

    const loginPage = () => {
        let div = document.createElement('div');
        div.className = "main";
        let username = document.createElement('input');
        let style = document.createElement('style');
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
        $('head').append(style);
        const clearCookie = ()  => {
            document.cookie = "yay=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.exhentai.org; path=/;";
            window.location.reload();
        };
        let form = document.createElement('form');
        let login = document.createElement('button');
        let password = document.createElement('input');
        let error = document.createElement('p');
        error.innerHTML = `
if you can not login , go to <a target="_blank" href="https://forums.e-hentai.org/index.php?act=Login&CODE=00" style="color:red">here</a> login <br >
make sure login success, then click <button class="clearCookie">here</button>
`;
        error.style.color = "white";
        error.hidden = true;
        $('img')[0].className = "image";
        username.type = "text";
        username.className = "input";
        password.type = "password";
        password.className = "input";
        login.addEventListener('click', () => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://forums.e-hentai.org/index.php?act=Login&CODE=01",
                data: `referer=https://forums.e-hentai.org/index.php?&b=&bt=&UserName=${username.value}&PassWord=${password.value}&CookieDate=1"}`,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                onload: function(response) {
                    if(/You are now logged/.exec(response.responseText)){
                        clearCookie();
                    } else {
                        error.hidden = false;
                    }

                }
            });
        });
        login.className = "btn";
        login.innerHTML = "Login";
        form.append(username);
        form.append(password);
        form.append(login);
        form.addEventListener('submit', e => {
            e.preventDefault();
        });
        div.append($('img')[0]);
        div.append(form);
        div.append(error);
        $('body').append(div);
        $('.clearCookie').on('click', clearCookie);
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
            download = document.createElement('p');

        const dlImg = ({index, url}, success, error) => {
            var filename = url.replace(/.*\//g, '');
            var extension = filename.split('.').pop();
            filename = ('0000' + index).slice(-4) + '.' + extension;
            if (debug) console.log(filename, 'progress');
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                onload: function (response) {
                    final++;
                    success(response, filename);
                },
                onerror: function (err) {
                    final++;
                    error(err, filename);
                }
            });
        };
        const next = () => {
            download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#"> Downloading ${final}/${total}</a>`;
            if (debug) console.log(final, current);
            if (final < current) return;
            (final < total) ? addZip() : genZip();
        };
        const end = () => {
           $win.off('beforeunload');
           if (debug) console.timeEnd('eHentai');
        }
        const genZip = () => {
            zip.generateAsync({
                type: 'blob'
            }).then(function (blob) {
                var zipName = tit
                .replace(/\s/g, '_') + '.' + comicId + '.' + outputExt;

                if (prevZip) window.URL.revokeObjectURL(prevZip);
                prevZip = blob;


                saveAs(blob, zipName);
                if (debug) console.log('COMPLETE');
                download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#"> Download completed!</a>`;
                end();
            });
        };
        const addZip = () => {
            total = images.length;
            var max = current + threading;
            if(max > total) max = total;
            for(current; current < max ; current++){
                dlImg(images[current], function (response, filename) {
                    zip.file(filename, response.response);
                    if (debug) console.log(filename, 'success');
                    next();
                }, function (err, filename) {
                    zip.file(filename + '_' + comicId + '_error.gif', 'R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=', {
                        base64: true
                    });
                    if (debug) console.log(filename, 'error');
                    next();
                });
            }
        };
        const getImageNext = () => {
            download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#">Getting images ${final}/${hrefs.length}</a>`;
            if (debug) console.log(final, current);
            if (final < current) return;
            (final < hrefs.length) ? getImage() :(() => {
                current = 0;
                final = 0;
                addZip();
            })();
        };
        const getImage = () => {
            let max = current + threading;
            if(max > hrefs.length) max = hrefs.length;
            for(current; current < max ; current++){
                if(debug) console.log(hrefs[current]);
                GM_xmlhttpRequest({
                    method: "GET",
                    url: hrefs[current],
                    onload: function(response) {
                        let imgNo = parseInt(response.responseText.match("startpage=(\\d+)").pop());
                        let img = (new DOMParser()).parseFromString(response.responseText, "text/html").querySelector("#img");
                        if (debug) console.log(imgNo, 'success');
                        images.push({ index: imgNo ,url:img.src});
                        final++;
                        getImageNext();
                    },
                    onerror: function(err) {
                        final++;
                        getImageNext();
                        if(debug) console.log(err);
                    }
                });
            }
        };
        const getHref = () => {
            let page = document.querySelector('table[class=ptt] tbody tr').childNodes.length-2;
            for(let i = 0 ; i < page; i++){
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `${loc}?p=${i}`,
                    onload: function(response) {
                        let imgs = [...(new DOMParser()).parseFromString(response.responseText, "text/html").querySelectorAll(".gdtm a")];
                        imgs.forEach((v) => {
                            hrefs.push(v.href);
                        });
                        if(i == page -1){
                            getImage();
                        }
                    },
                    onerror: function(err) {
                        download.innerHTML = '<img src="https://exhentai.org/img/mr.gif"> <a href="#">Get href failed</a>';
                        if(i == page -1){
                            getImage();
                        }
                        if(debug) console.log(err);
                    }
                });
            }
        };
        download.className = "g3 gsp";
        download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a class="panda_download" href="#">Download</a>`;
        $('#gd5').append(download);
        $('.panda_download').on('click', () => {
            if(threading < 1) threading = 1;
            if(threading > 32) threading = 32;
            if (debug) console.time('eHentai');
            $win.on('beforeunload', function () {
                return 'Progress is running...';
            });
            download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="#">Start Download</a>`;
            getHref();
        });
    };
    if((e = $('img')).length === 1 && e[0].src === window.location.href){
        loginPage();
    } else {
        downloadPage();
    }
});
