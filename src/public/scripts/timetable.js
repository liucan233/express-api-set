const captcha = document.querySelector(".captcha"),
  user = document.querySelector(".user"),
  passwd = document.querySelector(".passwd"),
  cookie = document.querySelector(".cookie");

user.value='5120191916'
passwd.value='9177880@wjL'

fetch("./api/timetable/login")
  .then((res) => {
    return res.json();
  })
  .then((res) => {
    captcha.src = res.captcha;
    cookie.value=res.cookie;
  });
