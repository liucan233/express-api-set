if (localStorage.getItem("cas")) {
  location.href = "./enteredCas";
}

const captcha = document.querySelector(".captcha"),
  user = document.querySelector(".user"),
  passwd = document.querySelector(".passwd"),
  cookie = document.querySelector(".cookie"),
  captchaImg=document.querySelector('.captchaImg')

function handleStartup() {
  fetch("./api/cas/login")
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      captchaImg.src = res.data.captcha;
      cookie.value = res.data.cookie;
      captcha.value=res.data.captchaText;
    });
}

handleStartup();

function handleSubmit(e) {
  e.preventDefault();
  const params = new URLSearchParams();
  params.set('user',user.value);
  params.set('cookie',cookie.value);
  params.set('passwd',passwd.value);
  params.set('captcha',captcha.value)
  fetch("./api/cas/login", {
    method: "post",
    body: params.toString(),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      if (res.code === 200) {
        alert(JSON.stringify(res));
        localStorage.setItem("cas", res.data.cookie);
        location.href = "./enteredCas";
      } else {
        throw new Error(res.msg);
      }
    })
    .catch((err) => {
      alert(err.message);
      handleStartup();
    });
}
