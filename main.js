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
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// @run-at       document-end
// @version      0.0.4
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
                download.innerHTML = `<img src="https://exhentai.org/img/mr.gif"> <a href="${window.URL.createObjectURL(prevZip)}" download="${zipName}"> Download completed!</a>`;
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
function view()
{

    var lpPage = (document.querySelectorAll("table.ptt td").length - 2);

    var data = document.querySelector("body div.gtb p.gpc").textContent.split(" ");

    var minPic = parseInt(data[1]);
    var maxPic = parseInt(data[3]);

    var imgNum = parseInt(gdd.querySelector("#gdd tr:nth-child(n+6) td.gdt2").textContent.split(" ")[0]);

    var pagePic = maxPic - minPic +1;

    var status = "false";


    viewer(document.querySelectorAll("table.ptt td").length - 2,imgNum ,minPic,maxPic);
    
    function viewer(lpPage, imgNum,minPic,maxPic) {
    var Gallery = function(pageNum, imgNum,minPic,maxPic) {
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
                console.log('load work');
                var ajax = new XMLHttpRequest();
                ajax.onreadystatechange = function() {
                    if (4 == ajax.readyState && 200 == ajax.status) {
                        var imgNo =  parseInt(ajax.responseText.match("startpage=(\\d+)").pop());
                        var src = (new DOMParser()).parseFromString(ajax.responseText, "text/html").getElementById("img").src;
                        Gallery.prototype.imgList[imgNo-1].src = src;

                        var store_width = GM_getValue("width");

                            var width = null;
                            var page_width = document.getElementById("gdt").offsetWidth;
                            
                            if(GM_getValue == undefined)
                            {
                                width = 0.8;
                            }
                            else
                            {
                                width = store_width;
                            }
                            var pic_num = (imgNo-1) % (maxPic-minPic+1);
                            document.getElementById("gdt").children[pic_num].setAttribute('width',width*page_width);


                    }
                };
                ajax.open("GET", item.href);
                ajax.send(null);
            });
        },
        /*
        download_file: function(element,dir) {
            [].forEach.call(element.querySelectorAll("a[href]"), function(item) {
                console.log('load work');
                var ajax = new XMLHttpRequest();
                ajax.onreadystatechange = function() {
                    if (4 == ajax.readyState && 200 == ajax.status) {
                        var imgNo =  parseInt(ajax.responseText.match("startpage=(\\d+)").pop());
                        var src = (new DOMParser()).parseFromString(ajax.responseText, "text/html").getElementById("img").src;
                        
                        var download_url = src;
                        var download_filename = dir+"/" + (imgNo).toString();
                        chrome.runtime.sendMessage({url:download_url ,filename:download_filename}, function(response) {  
                            console.log(response);  
                        });



                    }
                };
                ajax.open("GET", item.href);
                ajax.send(null);
            });
        },*/
        getNextPage: function(action) {
            var LoadPageUrls = this.loadPageUrls;
            var download = this.download_file;
            var dir_name = document.getElementById('gj').innerHTML;
            if (dir_name == "")
            {
                dir_name = document.getElementById('gn').innerHTML;
            }
            dir_name = dir_name.replace("/"," ");
            dir_name = dir_name.replace("?"," ");
            dir_name = dir_name.replace("*"," ");
            dir_name = dir_name.replace("<"," ");
            dir_name = dir_name.replace('"'," ");
            dir_name = dir_name.replace(":"," ");
            dir_name = dir_name.replace(">"," ");
            dir_name = dir_name.replace("|"," ");
            for (var i = 0; i < this.pageNum; ++i) {
                var ajax = new XMLHttpRequest();
                ajax.onreadystatechange = function() {
                    if (4 == this.readyState && 200 == this.status) {
                        var dom = (new DOMParser()).parseFromString(this.responseText, "text/html");
                        if (action == 'download')
                        {
                            download(dom.getElementById("gdt"),dir_name);
                        }
                        else
                        {
                            LoadPageUrls(dom.getElementById("gdt"));
                        }
                    }
                };
                ajax.open("GET", location.href + "?p=" + i);
                ajax.send(null);
            }
        },
        download: function() {
            this.getNextPage("download");   
        },
        claenGDT: function() {
            while (gdt.firstChild && gdt.firstChild.className)
                gdt.removeChild(gdt.firstChild);
        },
        generateImg: function(callback) {
            for (var i = 0; i < this.imgNum; i++) {
                if(i<maxPic && i >= minPic - 1 )
                {
                    var img = document.createElement('img');
                    img.setAttribute("src", "http://ehgt.org/g/roller.gif");

                    this.imgList.push(img);

                    gdt.appendChild(img);
                }
                else
                {
                    var img = document.createElement("img");
                    this.imgList.push(img);
 //                   gdt.appendChild(img); //cant load all
                }
            }

            document.getElementById("gdt").style.textAlign="center";
            document.getElementById("gdt").style.maxWidth="100%";
            
            document.getElementById('gdo4').innerHTML= ""; //clear origin button(Normal Large)


            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '.buttonCss{font-weight:bold;padding:3px 2px;margin:0 2px 4px 2px;white-space:nowrap;width: 55px;float:left;border-radius:5px;text-align:center;font-size:10pt;border:1px solid #706563;cursor:pointer}';
            document.getElementsByTagName('head')[0].appendChild(style);
            

            var single_pic = document.createElement("div");//create single button
            single_pic.className = "buttonCss";
            single_pic.innerHTML += 'single';
            gdo4.appendChild(single_pic);


            var double_pic = document.createElement("div"); //create double button
            double_pic.className = "buttonCss";
            double_pic.innerHTML = 'double';
            gdo4.appendChild(double_pic);

/*            var downloads = document.createElement("div");
            downloads.className = "buttonCss";
            downloads.innerHTML = "downloads";
            gdo4.appendChild(downloads);*/

            document.getElementById('gdo4').children[0] //when single button click change value of width
                    .addEventListener('click', function (event) {
               // chrome.storage.sync.set({"width":0.8});
                GM_setValue("width", "0.8");
                var page_width = document.getElementById("gdt").offsetWidth;
                pic_width(GM_getValue("width")*page_width);                        
                
            });


            document.getElementById('gdo4').children[1] //when double button click change value of width
                    .addEventListener('click', function (event) {

                       // chrome.storage.sync.set({"width":0.48});
                        GM_setValue("width", "0.48");
                        var page_width = document.getElementById("gdt").offsetWidth;
                        pic_width(GM_getValue("width")*page_width);                        
                    });
     /*       
            document.getElementById('gdo4').children[2]
                    .addEventListener('click',function(event){
                    
                        download_files(lpPage,imgNum,minPic,maxPic);
                    
            });*/
/*
            chrome.storage.onChanged.addListener(function(changes,area){ //when value of width is changed,change width of pics
        
                var page_width = document.getElementById("gdt").offsetWidth;
                pic_width(changes.width.newValue*page_width);

            })
*/
            

            function pic_width(width)//change width of pics 
            {
                for(var i = (maxPic-minPic+1);i>0;i--)
                { 
                document.getElementById('gdt').children[i-1].setAttribute('width',width); 
                }
            }    


            callback && callback();
        }
    };
    var g = new Gallery(lpPage,imgNum,minPic,maxPic);
    if (g.checkFunctional()) {
        g.generateImg(function() {
            g.loadPageUrls(gdt);
            g.claenGDT();
//            if (g.pageNum)
//                g.getNextPage('load');
        });
    }
    else {
        alert("There are some issue in the script\nplease open an issue on Github");
        window.open("https://github.com/strong-Ting/Gentle-Viewer/issues");
    }
    function download_files(lpPage ,imgNum,minPic,maxPic)
    {
        console.log(lpPage,imgNum,minPic,maxPic);
        var download_obj = new Gallery(lpPage,imgNum,minPic,maxPic);
        download_obj.download();
    }
}





}

view();
