const captcha = document.querySelector(".captcha"),
  user = document.querySelector(".user"),
  passwd = document.querySelector(".passwd"),
  cookie = document.querySelector(".cookie");

user.value='5120191916'
passwd.value='xxxxxx'

fetch("./api/swust/loginCas")
  .then((res) => {
    return res.json();
  })
  .then((res) => {
    captcha.src = res.data.captcha;
    cookie.value=res.data.cookie;
  });
