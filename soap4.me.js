//obevlyaem plugin berem dannye iz plugin.json iz manifesta
var plugin = JSON.parse(Plugin.manifest);
var PREFIX = plugin.id;

//podgruzhaem moduli
var service = require('showtime/service');
var settings = require('showtime/settings');
var page = require('showtime/page');
var http = require('showtime/http');
var html = require('showtime/html');
var io = require('native/io');

var token

// Service creation link na home page
service.create(plugin.title, PREFIX + ":start", "video", true, Plugin.path + "logo.png");
/*******************************************************************************
 * // Settings
 ******************************************************************************/
settings.globalSettings(plugin.id, plugin.title, Plugin.path + "logo.png", plugin.synopsis);
// General settings
settings.createDivider("General");
// Enable / disable debug setting
settings.createBool("debug", "Debug", false, function(v) {
  service.debug = v;
});
settings.createAction('logout', 'LogOut from soap4.me', logOut)


new page.Route(PREFIX + ":start", start)
new page.Route(PREFIX + ":show:(.*)", show)
new page.Route(PREFIX + ":mediaInfo:(.*)", mediaInfo)
new page.Route(PREFIX + ":logOut", logOut)

function logOut() {

  if (token !== undefined) {
    http.request('https://soap4.me/logout', {
      method: 'POST',
      noFollow: true,
      postdata: {
        token: token
      },
      headers: {
        'Host': 'soap4.me',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://soap4.me/',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}

//funkciya logina 

function login(page, showDialog) {
  var text = '';
  if (showDialog) {
    text = 'Введите email и пароль';
    logged = false;
  }
  if (!logged) {
    credentials = popup.getAuthCredentials('Test plug zapros', text, showDialog);
    if (credentials && credentials.username && credentials.password) {
      page.loading = true;
      var resp = http.request('https://soap4.me/login/', {
        method: 'POST',
        noFollow: true,
        headers: {
          'Host': 'soap4.me',
          'Accept-Encoding': 'gzip, deflate',
          'Referer': 'https://soap4.me/login/',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        postdata: {
          login: credentials.username,
          password: credentials.password
        }
      });
      page.loading = false;
      p(dump(resp));
      p(resp.headers.location);
      if (resp.headers.location == 'https://soap4.me/') logged = true;
    }
  }
  if (showDialog) {
    if (logged) {
      showtime.message("Вход успешно произведен. Параметры входа сохранены.", true, false);
      page.redirect(PREFIX + ':start');
    } else showtime.message("Не удалось войти. Проверьте email/пароль...", true, false);
  }
}

function start(page) {
  page.metadata.title = plugin.title;
  page.metadata.logo = Plugin.path + "logo.png";
  page.loading = true;

  try {
    var resp = http.request('https://soap4.me', {
      method: 'GET',
      noFail: true,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://soap4.me/',
      }
    });
    dom = html.parse(resp.toString())
    // user bar est' znachit zalogen
    if (dom.root.getElementByClassName("user")[0]) {

      username = dom.root.getElementByClassName("user")[0].textContent.trim()
      status = dom.root.getElementByClassName("user")[0].getElementByClassName("data")[0].textContent.trim()
      token = dom.root.getElementById("token").attributes.getNamedItem('data:token').value

      page.appendItem(PREFIX + ":logOut", "directory", {
        title: " Login as: " + username + " Status: " + status
      });

      dom.root.getElementById("soap").getElementByTagName("li").forEach(function(element, i) {
        href = element.getElementByTagName('a')[0].attributes.getNamedItem('href').value
        icon = element.getElementByTagName('img')[0].attributes.getNamedItem('original-src').value
        title = element.getElementByTagName('img')[0].attributes.getNamedItem('title').value

        page.appendItem(PREFIX + ":show:" + href, "video", {
          title: title,
          icon: icon
          /*,
            description: i.desc + '\n' + i.lastupdated,
            rating: i.rating * 10,
            genre: i.genre,
            year: parseInt(i.year, 10)*/
        });

      })
    } else {
      //userbara net probuem loginitsya
      login(page, true)
    }
  } catch (err) {
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    p(e(err))
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    login(page, true)
  }
  page.type = "directory";
  page.loading = false;

}

function show(page, href) {
  page.metadata.title = plugin.title;
  page.metadata.logo = Plugin.path + "logo.png";
  page.loading = true;
  try {
    var resp = http.request('https://soap4.me' + href, {
      method: 'GET',
      noFail: true,
      headers: {
        'Host': 'soap4.me',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://soap4.me/'
      }
    });
    //p(resp)
    dom = html.parse(resp.toString())
    dom.root.getElementById("soap").getElementByTagName("li").forEach(function(element, i) {
      href = element.getElementByTagName('a')[0].attributes.getNamedItem('href').value
      icon = element.getElementByTagName('img')[0].attributes.getNamedItem('original-src').value
      title = element.getElementByClassName('season')[0].textContent

      page.appendItem(PREFIX + ":mediaInfo:" + href, "video", {
        title: title,
        icon: icon
        /*,
            description: i.desc + '\n' + i.lastupdated,
            rating: i.rating * 10,
            genre: i.genre,
            year: parseInt(i.year, 10)*/
      });

    })

  } catch (err) {
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    p(e(err))
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  }
  page.type = "directory";
  page.loading = false;

}

function mediaInfo(page, href) {
  page.metadata.title = plugin.title;
  page.metadata.logo = Plugin.path + "logo.png";
  page.loading = true;

  try {
    var resp = http.request('https://soap4.me' + href, {
      method: 'GET',
      noFail: true,
      headers: {
        'Host': 'soap4.me',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://soap4.me/'
      }
    });
    dom = html.parse(resp.toString())
    dom.root.getElementByClassName('ep').forEach(function(element, i) {
      href = element.getElementByTagName('a')[0].attributes.getNamedItem('href').value
      title = element.getElementByClassName('title')[0].children[0].textContent
      translate = element.getElementByClassName('translate')[0].textContent.trim()
      number = element.getElementByClassName('number')[0].textContent.trim()
      quality = element.getElementByClassName('quality')[0].textContent.trim()
      page.appendItem('https://soap4.me' + href, "directory", {
        title: '['+quality+'] '+'#' + number + ' ' + title + " (" + translate + ")"
      });

    })

  } catch (err) {
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
    p(e(err))
    p('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  }
  page.type = "directory";
  page.loading = false;

}

function p(message) {
  if (service.debug == '1') print(message)
}

function e(ex) {
  console.log(ex);
  console.log("Line #" + ex.lineNumber);
}

function dump(arr, level) {
  var dumped_text = "";
  if (!level) level = 0;
  //The padding given at the beginning of the line.
  var level_padding = "";
  for (var j = 0; j < level + 1; j++) level_padding += "    ";
  if (typeof(arr) == 'object') { //Array/Hashes/Objects
    for (var item in arr) {
      var value = arr[item];
      if (typeof(value) == 'object') { //If it is an array,
        dumped_text += level_padding + "'" + item + "' ...\n";
        dumped_text += dump(value, level + 1);
      } else {
        dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
      }
    }
  } else { //Stings/Chars/Numbers etc.
    dumped_text = arr;
  }
  return dumped_text;
}